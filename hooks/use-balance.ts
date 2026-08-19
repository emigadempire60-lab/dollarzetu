'use client';

import { useState, useEffect, useRef } from 'react';
import type { DerivWS } from '@deriv/core';

export interface BalanceInfo {
  balance: number;
  currency: string;
}

export function useBalance(
  ws: DerivWS | null,
  isConnected: boolean,
  isAuthenticated: boolean
): BalanceInfo | null {
  const [balanceInfo, setBalanceInfo] = useState<BalanceInfo | null>(null);
  const isSubscribedRef = useRef(false);

  useEffect(() => {
    if (!ws || !isConnected || !isAuthenticated) {
      setBalanceInfo(null);
      return;
    }

    const unsubscribeListener = ws.onMessage((data) => {
      if (data.msg_type === 'balance' && data.balance && typeof data.balance === 'object') {
        const bal = data.balance as { balance: number; currency: string };
        if (typeof bal.balance === 'number') {
          setBalanceInfo({
            balance: bal.balance,
            currency: bal.currency || 'USD',
          });
        }
      }
    });

    ws.send({ balance: 1, subscribe: 1 })
      .then(() => {
        isSubscribedRef.current = true;
      })
      .catch(() => {});

    return () => {
      unsubscribeListener();
      if (isSubscribedRef.current && ws.isConnected) {
        ws.send({ forget_all: 'balance' }).catch(() => {});
      }
      isSubscribedRef.current = false;
    };
  }, [ws, isConnected, isAuthenticated]);

  return balanceInfo;
}
