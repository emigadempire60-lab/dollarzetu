'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  useProposal,
  useBuy,
} from '@deriv/core';
import type {
  ActiveSymbol,
  Tick,
  ProposalInfo,
  ProposalParams,
  DurationLimits,
  BuyResult,
} from '@deriv/core';
import { useBaseTrading } from '@/hooks/use-base-trading';
import type { UseBaseTradingParams } from '@/hooks/use-base-trading';
import { computeDigitStats, getLastDigit } from '../lib/digit-stats';
import type { ContractMode, TradeType, DigitStats, OpenPosition, ClosedPosition } from '../lib/types';

import { recordTradePlaced, recordTradeOutcome } from '../lib/analytics';

const CONTRACT_TYPES = ['DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD'];

interface UseDigitsTradingReturn {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  symbols: ActiveSymbol[];
  activeSymbol: ActiveSymbol | null;
  selectSymbol: (symbol: string) => void;
  currentTick: Tick | null;
  lastDigit: number | null;
  digitStats: DigitStats;
  tickWindow: number;
  setTickWindow: (windowSize: number) => void;
  tradeType: TradeType;
  setTradeType: (type: TradeType) => void;
  contractMode: ContractMode;
  setContractMode: (mode: ContractMode) => void;
  selectedDigit: number;
  setSelectedDigit: (digit: number) => void;
  contractsAvailable: boolean;
  pipSize: number;
  stake: string;
  setStake: (value: string) => void;
  duration: number;
  setDuration: (value: number) => void;
  durationLimits: DurationLimits;
  defaultStake: number;
  proposal: ProposalInfo | null;
  isProposalLoading: boolean;
  buyContract: () => Promise<void>;
  isBuying: boolean;
  buyResult: BuyResult | null;
  buyError: string | null;
  clearBuyResult: () => void;
  openPositions: OpenPosition[];
  closedPositions: ClosedPosition[];
  sellContract: (contractId: number, bidPrice: string) => Promise<void>;
  sellingId: number | null;
  sellError: string | null;
  clearSellError: () => void;
}

export type UseDigitsTradingParams = Pick<UseBaseTradingParams, 'ws' | 'isConnected' | 'isExhausted' | 'isAuthenticated' | 'onAuthWSFailed'>;

export function useDigitsTrading({ ws, isConnected, isExhausted, isAuthenticated, onAuthWSFailed }: UseDigitsTradingParams): UseDigitsTradingReturn {
  const [tickWindow, setTickWindow] = useState<number>(1000);

  const {
    ws: tradingWs,
    isConnected: tradingIsConnected,
    isLoading,
    error,
    symbols,
    activeSymbol,
    selectSymbol,
    currentTick,
    prices,
    pipSize,
    contractsAvailable,
    durationLimits,
    defaultStake,
    openPositions,
    closedPositions,
    sellContract,
    sellingId,
    sellError,
    clearSellError,
  } = useBaseTrading({ ws, isConnected, isExhausted, isAuthenticated, onAuthWSFailed, contractTypes: CONTRACT_TYPES, tickWindow });

  // Digits-specific trade state
  const [tradeType, setTradeTypeRaw] = useState<TradeType>('matches-differs');
  const [contractMode, setContractMode] = useState<ContractMode>('DIGITMATCH');
  const [selectedDigit, setSelectedDigit] = useState<number>(5);
  const [stake, setStake] = useState<string>('10');
  const [duration, setDuration] = useState<number>(5);

  // Reset contract mode to the first option of the selected trade type
  const setTradeType = useCallback((type: TradeType) => {
    setTradeTypeRaw(type);
    switch (type) {
      case 'matches-differs':
        setContractMode('DIGITMATCH');
        break;
      case 'over-under':
        setContractMode('DIGITOVER');
        break;
      case 'even-odd':
        setContractMode('DIGITEVEN');
        break;
    }
  }, []);

  const digitStats: DigitStats = useMemo(
    () => computeDigitStats(prices, pipSize),
    [prices, pipSize]
  );

  const lastDigit = useMemo(() => {
    if (currentTick) {
      return getLastDigit(currentTick.quote, pipSize);
    }
    if (prices.length > 0) {
      return getLastDigit(prices[prices.length - 1], pipSize);
    }
    return null;
  }, [currentTick, prices, pipSize]);

  const {
    buyContract: buyWithProposal,
    isBuying,
    buyResult,
    buyError,
    clearBuyResult,
  } = useBuy(tradingWs, tradingIsConnected);

  const proposalParams: ProposalParams | null = useMemo(() => {
    if (isBuying || !activeSymbol || !isAuthenticated) return null;
    const stakeNum = parseFloat(stake);
    if (!stakeNum || stakeNum <= 0) return null;

    const needsBarrier = contractMode !== 'DIGITEVEN' && contractMode !== 'DIGITODD';

    return {
      contractType: contractMode,
      symbol: activeSymbol.underlying_symbol,
      amount: stakeNum,
      duration,
      durationUnit: 't',
      basis: 'stake' as const,
      currency: 'USD',
      ...(needsBarrier ? { barrier: selectedDigit } : {}),
    };
  }, [activeSymbol, contractMode, stake, duration, selectedDigit, isBuying, isAuthenticated]);

  const { proposal } = useProposal(tradingWs, tradingIsConnected, proposalParams);

  const effectiveProposal: ProposalInfo | null = useMemo(() => {
    if (proposal) return proposal;
    if (isBuying || !activeSymbol || !isAuthenticated) return null;
    const stakeNum = parseFloat(stake);
    if (!stakeNum || stakeNum <= 0) return null;

    let payoutMult = 1.95;
    if (contractMode === 'DIGITMATCH') payoutMult = 9.5;
    else if (contractMode === 'DIGITDIFF') payoutMult = 1.09;
    else if (contractMode === 'DIGITEVEN' || contractMode === 'DIGITODD') payoutMult = 1.96;

    return {
      id: 'fallback_proposal',
      askPrice: stakeNum,
      payout: stakeNum * payoutMult,
      longcode: `${contractMode} contract for ${stakeNum} USD`,
      minStake: 0.35,
      maxPayout: 50000,
    };
  }, [proposal, activeSymbol, contractMode, stake, isBuying, isAuthenticated]);

  const buyContract = useCallback(async () => {
    if (!activeSymbol || !effectiveProposal) return;

    recordTradePlaced({
      symbol: activeSymbol.underlying_symbol,
      contractType: contractMode,
      stake: parseFloat(stake) || 10,
      barrier: selectedDigit,
    });

    const needsBarrier = contractMode !== 'DIGITEVEN' && contractMode !== 'DIGITODD';
    await buyWithProposal(effectiveProposal, {
      symbol: activeSymbol.underlying_symbol,
      contractType: contractMode,
      amount: parseFloat(stake) || 10,
      duration: duration,
      ...(needsBarrier ? { barrier: selectedDigit } : {}),
    });
  }, [effectiveProposal, activeSymbol, contractMode, stake, duration, selectedDigit, buyWithProposal]);

  useEffect(() => {
    if (buyResult) {
      const stakeNum = parseFloat(stake) || 10;
      const profit = buyResult.payout - buyResult.buyPrice;
      recordTradeOutcome({
        contractId: buyResult.contractId,
        symbol: activeSymbol?.underlying_symbol,
        contractType: contractMode,
        stake: stakeNum,
        payout: buyResult.payout,
        profit,
        isWin: profit > 0,
      });
    }
  }, [buyResult, activeSymbol, contractMode, stake]);

  return {
    isConnected,
    isLoading,
    error,
    symbols,
    activeSymbol,
    selectSymbol,
    currentTick,
    lastDigit,
    digitStats,
    tickWindow,
    setTickWindow,
    tradeType,
    setTradeType,
    contractMode,
    setContractMode,
    selectedDigit,
    setSelectedDigit,
    contractsAvailable,
    pipSize,
    stake,
    setStake,
    duration,
    setDuration,
    durationLimits,
    defaultStake,
    proposal: effectiveProposal,
    isProposalLoading: false,
    buyContract,
    isBuying,
    buyResult,
    buyError,
    clearBuyResult,
    openPositions,
    closedPositions,
    sellContract,
    sellingId,
    sellError,
    clearSellError,
  };
}
