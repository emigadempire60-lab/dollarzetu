'use client';

import { useState, useEffect, useRef } from 'react';
import type { DerivWS } from '../ws';
import type { ProposalResponse, ProposalInfo, ProposalParams } from '../types';

interface UseProposalReturn {
  proposal: ProposalInfo | null;
  proposalError: string | null;
}

export function useProposal(
  ws: DerivWS | null,
  isConnected: boolean,
  params: ProposalParams | null
): UseProposalReturn {
  const [proposal, setProposal] = useState<ProposalInfo | null>(null);
  const [proposalError, setProposalError] = useState<string | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Forget previous proposal subscription
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }

    if (!ws || !isConnected || !params || params.amount <= 0) {
      setProposal(null);
      setProposalError(null);
      return;
    }

    let cancelled = false;

    const payload: Record<string, unknown> = {
      proposal: 1,
      amount: params.amount,
      basis: params.basis,
      contract_type: params.contractType,
      currency: params.currency,
      symbol: params.symbol,
    };

    if (params.dateExpiry !== undefined) {
      payload.date_expiry = params.dateExpiry;
    } else {
      payload.duration = params.duration;
      payload.duration_unit = params.durationUnit;
    }

    if (params.barrier !== undefined) {
      payload.barrier = String(params.barrier);
    }

    setProposalError(null);

    ws.subscribe(payload, (data) => {
      if (cancelled) return;
      if (data.error) {
        const errObj = data.error as { message?: string };
        setProposalError(errObj.message || 'Proposal failed');
        setProposal(null);
        return;
      }
      const resp = data as unknown as ProposalResponse;
      if (resp.proposal) {
        setProposal({
          id: resp.proposal.id,
          askPrice: resp.proposal.ask_price,
          payout: resp.proposal.payout,
          longcode: resp.proposal.longcode,
          minStake: parseFloat(resp.proposal.validation_params?.stake?.min ?? '0'),
          maxPayout: parseFloat(resp.proposal.validation_params?.payout?.max ?? '0'),
        });
        setProposalError(null);
      }
    }).then((sub) => {
      if (cancelled) {
        sub.unsubscribe();
      } else {
        unsubRef.current = sub.unsubscribe;
      }
    }).catch((err) => {
      if (!cancelled) {
        setProposal(null);
        setProposalError(err instanceof Error ? err.message : 'Unable to get proposal');
      }
    });

    return () => {
      cancelled = true;
      setProposal(null);
      setProposalError(null);
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally using individual param fields to avoid re-subscribing on object reference changes
  }, [ws, isConnected, params?.contractType, params?.symbol, params?.amount, params?.duration, params?.durationUnit, params?.barrier, params?.basis, params?.currency, params?.dateExpiry]);

  return { proposal, proposalError };
}
