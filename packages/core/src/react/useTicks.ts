'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { DerivWS } from '../ws';
import type { ActiveSymbol, Tick, TicksHistoryResponse } from '../types';

const DEFAULT_TICK_COUNT = 1000;

interface UseTicksReturn {
  currentTick: Tick | null;
  prices: number[];
  pipSize: number;
}

export function useTicks(
  ws: DerivWS | null,
  isConnected: boolean,
  activeSymbol: ActiveSymbol | null,
  tickCount: number = DEFAULT_TICK_COUNT
): UseTicksReturn {
  const pricesRef = useRef<number[]>([]);
  const pipSizeRef = useRef<number>(2);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const [currentTick, setCurrentTick] = useState<Tick | null>(null);
  const [prices, setPrices] = useState<number[]>([]);
  const [pipSize, setPipSize] = useState<number>(2);

  const pipSizeFromPip = useCallback((pip: number): number => {
    if (pip >= 1) return 0;
    const str = pip.toString();
    const dotIndex = str.indexOf('.');
    return dotIndex === -1 ? 0 : str.length - dotIndex - 1;
  }, []);

  const activeSymbolId = activeSymbol?.underlying_symbol;

  useEffect(() => {
    if (!ws || !isConnected || !activeSymbolId) return;
    let disposed = false;

    // Unsubscribe from previous
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    // Reset refs
    pricesRef.current = [];

    const ps = pipSizeFromPip(activeSymbol?.pip_size ?? 2);
    pipSizeRef.current = ps;

    async function subscribe() {
      try {
        const historyResponse = await ws!.send<TicksHistoryResponse>({
          ticks_history: activeSymbolId!,
          end: 'latest',
          start: 1,
          count: tickCount,
          style: 'ticks',
        });
        if (disposed) return;

        setPipSize(ps);
        const historyPrices = historyResponse.history?.prices ?? [];
        pricesRef.current = historyPrices;
        setPrices([...historyPrices]);

        if (historyPrices.length > 0) {
          const lastPrice = historyPrices[historyPrices.length - 1];
          const lastTime = (historyResponse.history as any)?.times?.slice(-1)[0] ?? Math.floor(Date.now() / 1000);
          setCurrentTick({
            ask: lastPrice,
            bid: lastPrice,
            epoch: lastTime,
            id: activeSymbolId!,
            pip_size: ps,
            quote: lastPrice,
            symbol: activeSymbolId!,
          });
        }
      } catch {
        // Continue to tick stream if history fails
      }

      if (disposed) return;

      const sub = await ws!.subscribe(
        { ticks: activeSymbolId! },
        (data) => {
          const tick = (data as { tick?: Tick }).tick;
          if (tick) {
            const tickPs = tick.pip_size ?? pipSizeRef.current;
            if (tick.pip_size && tick.pip_size !== pipSizeRef.current) {
              pipSizeRef.current = tick.pip_size;
            }

            setCurrentTick(tick);

            // Sliding window update
            pricesRef.current = [...pricesRef.current, tick.quote];
            if (pricesRef.current.length > tickCount) {
              pricesRef.current = pricesRef.current.slice(-tickCount);
            }
            setPrices([...pricesRef.current]);
            setPipSize(tickPs);
          }
        }
      );
      if (disposed) {
        sub.unsubscribe();
        return;
      }
      unsubscribeRef.current = sub.unsubscribe;
    }

    subscribe().catch(() => {});

    return () => {
      disposed = true;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      if (ws?.isConnected) {
        ws.send({ forget_all: 'ticks' }).catch(() => {});
      }
    };
  }, [ws, isConnected, activeSymbolId, tickCount, pipSizeFromPip]);

  return { currentTick, prices, pipSize };
}
