'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import type { TradeSignal } from '@/lib/signals';
import { getRecentSignals, saveSignalToHistory } from '@/lib/signals';

interface UseSignalReceiverParams {
  onExecuteSignal?: (signal: TradeSignal, customStake?: number) => Promise<boolean | void>;
  isAuthenticated?: boolean;
}

export interface SignalExecutionLog {
  id: string;
  signal: TradeSignal;
  executedAt: number;
  stakeUsed: number;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  errorMessage?: string;
}

export function useSignalReceiver({ onExecuteSignal, isAuthenticated = false }: UseSignalReceiverParams = {}) {
  const [isAutoTrade, setIsAutoTrade] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('dollarzetu_auto_trade') === 'true';
  });

  const [followerStake, setFollowerStake] = useState<string>(() => {
    if (typeof window === 'undefined') return '10';
    return localStorage.getItem('dollarzetu_follower_stake') || '10';
  });

  const [signals, setSignals] = useState<TradeSignal[]>([]);
  const [executionLogs, setExecutionLogs] = useState<SignalExecutionLog[]>([]);
  const [isConnectedToFeed, setIsConnectedToFeed] = useState<boolean>(false);
  const executedSignalIds = useRef<Set<string>>(new Set());

  // Store active props/states in refs to prevent infinite useEffect re-subscriptions
  const isAutoTradeRef = useRef(isAutoTrade);
  const followerStakeRef = useRef(followerStake);
  const isAuthenticatedRef = useRef(isAuthenticated);
  const onExecuteSignalRef = useRef(onExecuteSignal);

  useEffect(() => {
    isAutoTradeRef.current = isAutoTrade;
    followerStakeRef.current = followerStake;
    isAuthenticatedRef.current = isAuthenticated;
    onExecuteSignalRef.current = onExecuteSignal;
  });

  // Save settings to localStorage
  const toggleAutoTrade = useCallback((enabled: boolean) => {
    setIsAutoTrade(enabled);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dollarzetu_auto_trade', enabled ? 'true' : 'false');
    }
    if (enabled) {
      toast.success('🤖 Auto-Trade Signals Enabled', {
        description: 'Trade signals will auto-execute on your Deriv account automatically.',
      });
    } else {
      toast.info('⏸️ Auto-Trade Signals Paused');
    }
  }, []);

  const updateFollowerStake = useCallback((val: string) => {
    setFollowerStake(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dollarzetu_follower_stake', val);
    }
  }, []);

  // Process and execute incoming signal
  const handleIncomingSignal = useCallback(async (signal: TradeSignal) => {
    // Avoid duplicate executions
    if (executedSignalIds.current.has(signal.id)) return;

    saveSignalToHistory(signal);
    setSignals((prev) => [signal, ...prev.filter((s) => s.id !== signal.id)].slice(0, 30));

    const currentStake = parseFloat(followerStakeRef.current) || signal.recommendedStake || 10;
    const currentAutoTrade = isAutoTradeRef.current;
    const currentAuth = isAuthenticatedRef.current;
    const executeCb = onExecuteSignalRef.current;

    // Toast alert for incoming signal
    toast('⚡ LIVE TRADE SIGNAL RECEIVED', {
      description: `${signal.masterName}: ${signal.contractType} on ${signal.symbolDisplayName || signal.symbol} (Digit: ${signal.selectedDigit})`,
    });

    // Auto-trade execution logic
    if (currentAutoTrade && currentAuth && executeCb) {
      executedSignalIds.current.add(signal.id);

      try {
        toast.loading(`Auto-executing Signal #${signal.id.slice(-4)}...`, { id: `exec_${signal.id}` });
        const res = await executeCb(signal, currentStake);

        setExecutionLogs((prev) => [
          {
            id: `log_${Date.now()}`,
            signal,
            executedAt: Date.now(),
            stakeUsed: currentStake,
            status: res === false ? 'FAILED' : 'SUCCESS',
          },
          ...prev,
        ]);

        toast.success(`✅ Signal #${signal.id.slice(-4)} Executed!`, {
          id: `exec_${signal.id}`,
          description: `Placed ${signal.contractType} ($${currentStake}) on ${signal.symbolDisplayName || signal.symbol}`,
        });
      } catch (err: any) {
        setExecutionLogs((prev) => [
          {
            id: `log_${Date.now()}`,
            signal,
            executedAt: Date.now(),
            stakeUsed: currentStake,
            status: 'FAILED',
            errorMessage: err?.message || 'Execution error',
          },
          ...prev,
        ]);

        toast.error(`❌ Execution Failed for Signal #${signal.id.slice(-4)}`, {
          id: `exec_${signal.id}`,
          description: err?.message || 'Deriv WS error',
        });
      }
    }
  }, []);

  const handleIncomingSignalRef = useRef(handleIncomingSignal);
  useEffect(() => {
    handleIncomingSignalRef.current = handleIncomingSignal;
  }, [handleIncomingSignal]);

  // Connect to SSE Stream and BroadcastChannel ONCE on mount
  useEffect(() => {
    // Initial local history load
    setSignals(getRecentSignals());

    let eventSource: EventSource | null = null;
    let channel: BroadcastChannel | null = null;

    // 1. Setup SSE stream
    try {
      eventSource = new EventSource('/api/signals?stream=true');

      eventSource.onopen = () => {
        setIsConnectedToFeed(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'NEW_SIGNAL' && data.signal) {
            handleIncomingSignalRef.current(data.signal);
          } else if (data.type === 'INIT' && Array.isArray(data.signals)) {
            setSignals((prev) => {
              const combined = [...data.signals, ...prev];
              const unique = Array.from(new Map(combined.map((s) => [s.id, s])).values());
              return unique.slice(0, 30);
            });
          }
        } catch (e) {
          console.error('[SignalReceiver] Error parsing SSE payload:', e);
        }
      };

      eventSource.onerror = () => {
        setIsConnectedToFeed(false);
      };
    } catch (e) {
      console.warn('[SignalReceiver] SSE initialization error:', e);
    }

    // 2. Setup BroadcastChannel fallback
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        channel = new BroadcastChannel('dollarzetu_signals_v1');
        channel.onmessage = (event) => {
          if (event.data?.type === 'NEW_SIGNAL' && event.data.signal) {
            handleIncomingSignalRef.current(event.data.signal);
          }
        };
      } catch (e) {
        console.warn('[SignalReceiver] BroadcastChannel listener error:', e);
      }
    }

    return () => {
      if (eventSource) eventSource.close();
      if (channel) channel.close();
    };
  }, []); // Run ONCE on mount

  return {
    signals,
    isAutoTrade,
    toggleAutoTrade,
    followerStake,
    updateFollowerStake,
    isConnectedToFeed,
    executionLogs,
    manualExecuteSignal: handleIncomingSignal,
  };
}
