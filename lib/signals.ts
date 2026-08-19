import type { ContractMode } from './types';

export interface TradeSignal {
  id: string;
  timestamp: number;
  symbol: string;           // e.g. 'R_100' or '1HZ100V'
  symbolDisplayName?: string; // e.g. 'Volatility 100 Index'
  contractType: ContractMode; // 'DIGITMATCH' | 'DIGITDIFF' | 'DIGITOVER' | 'DIGITUNDER' | 'DIGITEVEN' | 'DIGITODD'
  selectedDigit: number;    // 0-9
  duration: number;         // ticks, e.g. 5
  recommendedStake: number; // e.g. 10
  masterName: string;       // e.g. "Master Trader"
  note?: string;            // Optional message / commentary
}

const BROADCAST_CHANNEL_NAME = 'dollarzetu_signals_v1';
const LOCAL_STORAGE_KEY = 'dollarzetu_recent_signals';

// Create a singleton BroadcastChannel if supported in browser
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  } catch (e) {
    console.warn('[SignalEngine] BroadcastChannel error:', e);
  }
}

/**
 * Get stored recent signals from localStorage
 */
export function getRecentSignals(): TradeSignal[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('[SignalEngine] Error reading recent signals:', e);
    return [];
  }
}

/**
 * Save signal to localStorage log (keeps last 50)
 */
export function saveSignalToHistory(signal: TradeSignal): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getRecentSignals();
    // Prepend new signal, filter duplicates by ID
    const updated = [signal, ...existing.filter((s) => s.id !== signal.id)].slice(0, 50);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('[SignalEngine] Error saving signal to history:', e);
  }
}

/**
 * Broadcast a signal locally via BroadcastChannel & localStorage event
 */
export function broadcastSignalLocally(signal: TradeSignal): void {
  saveSignalToHistory(signal);

  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'NEW_SIGNAL', signal });
    } catch (e) {
      console.warn('[SignalEngine] Failed to post to BroadcastChannel:', e);
    }
  }
}

/**
 * Dispatch a signal to the central API endpoint (and notify local tab)
 */
export async function sendSignalToNetwork(signal: TradeSignal): Promise<{ success: boolean; error?: string }> {
  // Broadcast locally first
  broadcastSignalLocally(signal);

  try {
    const res = await fetch('/api/signals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signal),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.error || 'Failed to send signal to server' };
    }

    return { success: true };
  } catch (err: any) {
    console.warn('[SignalEngine] Network signal dispatch error (falling back to local):', err);
    return { success: true }; // Local broadcast succeeded
  }
}
