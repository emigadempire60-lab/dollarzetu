'use client';

import { useState, useCallback } from 'react';
import type { DerivWS } from '../ws';
import type { ProposalInfo, BuyResponse, BuyResult } from '../types';

interface UseBuyReturn {
  buyContract: (
    proposal: ProposalInfo,
    params?: { symbol: string; contractType: string; amount: number; duration: number; barrier?: number }
  ) => Promise<void>;
  isBuying: boolean;
  buyResult: BuyResult | null;
  buyError: string | null;
  clearBuyResult: () => void;
}

export function useBuy(
  ws: DerivWS | null,
  isConnected: boolean
): UseBuyReturn {
  const [isBuying, setIsBuying] = useState(false);
  const [buyResult, setBuyResult] = useState<BuyResult | null>(null);
  const [buyError, setBuyError] = useState<string | null>(null);

  const clearBuyResult = useCallback(() => {
    setBuyResult(null);
    setBuyError(null);
  }, []);

  const buyContract = useCallback(
    async (
      proposal: ProposalInfo,
      params?: { symbol: string; contractType: string; amount: number; duration: number; barrier?: number }
    ) => {
      if (!ws || !isConnected) return;

      setIsBuying(true);
      setBuyError(null);
      setBuyResult(null);

      try {
        const payload: Record<string, unknown> =
          proposal.id !== 'fallback_proposal'
            ? {
                buy: proposal.id,
                price: String(proposal.askPrice),
              }
            : {
                buy: 1,
                price: String(proposal.askPrice),
                parameters: {
                  amount: proposal.askPrice,
                  basis: 'stake',
                  contract_type: params?.contractType,
                  currency: 'USD',
                  symbol: params?.symbol,
                  duration: params?.duration ?? 5,
                  duration_unit: 't',
                  ...(params?.barrier !== undefined ? { barrier: String(params.barrier) } : {}),
                },
              };

        const response = await ws.send<BuyResponse>(payload);

        if (response.buy) {
          setBuyResult({
            contractId: response.buy.contract_id,
            buyPrice: response.buy.buy_price,
            payout: response.buy.payout,
            longcode: response.buy.longcode,
            balanceAfter: response.buy.balance_after,
          });
        }
      } catch (err) {
        setBuyError(err instanceof Error ? err.message : 'Purchase failed');
      } finally {
        setIsBuying(false);
      }
    },
    [ws, isConnected]
  );

  return { buyContract, isBuying, buyResult, buyError, clearBuyResult };
}
