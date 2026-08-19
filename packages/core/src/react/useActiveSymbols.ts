'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DerivWS } from '../ws';
import type { ActiveSymbol, ContractsForResponse, ContractInfo, DurationLimits } from '../types';
import { pickDefaultSymbol } from '../utils/pick-default-symbol';

const SYMBOL_PARAM = 'symbol';

function readSymbolFromUrl(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return new URLSearchParams(window.location.search).get(SYMBOL_PARAM) ?? undefined;
}

function writeSymbolToUrl(symbol: string): void {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  params.set(SYMBOL_PARAM, symbol);
  const next = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
  window.history.replaceState(null, '', next);
}

interface UseActiveSymbolsReturn {
  symbols: ActiveSymbol[];
  activeSymbol: ActiveSymbol | null;
  selectSymbol: (symbol: string) => void;
  contracts: ContractInfo[];
  contractsAvailable: boolean;
  durationLimits: DurationLimits;
  defaultStake: number;
  isLoading: boolean;
  error: string | null;
}

const FALLBACK_SYMBOLS: ActiveSymbol[] = [
  {
    exchange_is_open: 1,
    is_trading_suspended: 0,
    market: 'synthetic_index',
    market_display_name: 'Derived',
    pip_size: 2,
    subgroup: 'synthetics',
    submarket: 'random_index',
    submarket_display_name: 'Continuous Indices',
    trade_count: 0,
    underlying_symbol: 'R_100',
    underlying_symbol_name: 'Volatility 100 Index',
    underlying_symbol_type: 'synthetic',
  },
  {
    exchange_is_open: 1,
    is_trading_suspended: 0,
    market: 'synthetic_index',
    market_display_name: 'Derived',
    pip_size: 2,
    subgroup: 'synthetics',
    submarket: 'random_index',
    submarket_display_name: 'Continuous Indices',
    trade_count: 0,
    underlying_symbol: 'R_10',
    underlying_symbol_name: 'Volatility 10 Index',
    underlying_symbol_type: 'synthetic',
  },
  {
    exchange_is_open: 1,
    is_trading_suspended: 0,
    market: 'synthetic_index',
    market_display_name: 'Derived',
    pip_size: 2,
    subgroup: 'synthetics',
    submarket: 'random_index',
    submarket_display_name: 'Continuous Indices',
    trade_count: 0,
    underlying_symbol: 'R_10',
    underlying_symbol_name: 'Volatility 10 Index',
    underlying_symbol_type: 'synthetic',
  },
  {
    exchange_is_open: 1,
    is_trading_suspended: 0,
    market: 'synthetic_index',
    market_display_name: 'Derived',
    pip_size: 2,
    subgroup: 'synthetics',
    submarket: 'random_index',
    submarket_display_name: 'Continuous Indices',
    trade_count: 0,
    underlying_symbol: 'R_25',
    underlying_symbol_name: 'Volatility 25 Index',
    underlying_symbol_type: 'synthetic',
  },
  {
    exchange_is_open: 1,
    is_trading_suspended: 0,
    market: 'synthetic_index',
    market_display_name: 'Derived',
    pip_size: 2,
    subgroup: 'synthetics',
    submarket: 'random_index',
    submarket_display_name: 'Continuous Indices',
    trade_count: 0,
    underlying_symbol: 'R_50',
    underlying_symbol_name: 'Volatility 50 Index',
    underlying_symbol_type: 'synthetic',
  },
  {
    exchange_is_open: 1,
    is_trading_suspended: 0,
    market: 'synthetic_index',
    market_display_name: 'Derived',
    pip_size: 2,
    subgroup: 'synthetics',
    submarket: 'random_index',
    submarket_display_name: 'Continuous Indices',
    trade_count: 0,
    underlying_symbol: 'R_75',
    underlying_symbol_name: 'Volatility 75 Index',
    underlying_symbol_type: 'synthetic',
  },
];

export function useActiveSymbols(
  ws: DerivWS | null,
  isConnected: boolean,
  contractTypes: string[]
): UseActiveSymbolsReturn {
  const [symbols, setSymbols] = useState<ActiveSymbol[]>([]);
  const [activeSymbol, setActiveSymbol] = useState<ActiveSymbol | null>(null);
  const [contracts, setContracts] = useState<ContractInfo[]>([]);
  const [contractsAvailable, setContractsAvailable] = useState(false);
  const [durationLimits, setDurationLimits] = useState<DurationLimits>({ min: 1, max: 10, unit: 't' });
  const [defaultStake, setDefaultStake] = useState<number>(10);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const contractTypesKey = contractTypes.join(',');

  const loadContractsFor = useCallback(async (_wsInstance: DerivWS, _symbol: ActiveSymbol) => {
    setDurationLimits({ min: 1, max: 10, unit: 't' });
    setDefaultStake(10);
    setContractsAvailable(true);
  }, []);

  const selectSymbol = useCallback((underlyingSymbol: string) => {
    if (!ws || !isConnected) return;

    const symbol = symbols.find((s) => s.underlying_symbol === underlyingSymbol);
    if (!symbol || symbol.underlying_symbol === activeSymbol?.underlying_symbol) return;

    setActiveSymbol(symbol);
    writeSymbolToUrl(symbol.underlying_symbol);
    loadContractsFor(ws, symbol).catch(() => {});
  }, [ws, isConnected, symbols, activeSymbol, loadContractsFor]);

  useEffect(() => {
    if (!ws || !isConnected) return;
    let disposed = false;

    async function fetchSymbols() {
      try {
        setIsLoading(true);
        setError(null);
        let rawSymbols: any[] = [];
        try {
          const response = await ws!.send<{ active_symbols: ActiveSymbol[] }>({
            active_symbols: 'brief',
          });
          rawSymbols = response.active_symbols ?? [];
        } catch {
          rawSymbols = [];
        }

        if (disposed) return;

        if (!rawSymbols || rawSymbols.length === 0) {
          rawSymbols = FALLBACK_SYMBOLS;
        }

        const allSymbols: ActiveSymbol[] = rawSymbols.map((s: any) => ({
          exchange_is_open: s.exchange_is_open ?? 1,
          is_trading_suspended: s.is_trading_suspended ?? 0,
          market: s.market ?? 'synthetic_index',
          market_display_name: s.market_display_name,
          pip_size: s.pip_size ?? 2,
          subgroup: s.subgroup ?? 'none',
          submarket: s.submarket ?? 'random_index',
          submarket_display_name: s.submarket_display_name ?? 'Derived Indices',
          trade_count: s.trade_count ?? 0,
          underlying_symbol: s.underlying_symbol || s.symbol,
          underlying_symbol_name: s.underlying_symbol_name || s.display_name || s.symbol,
          underlying_symbol_type: s.underlying_symbol_type ?? 'synthetic',
        }));

        const seen = new Set<string>();
        const uniqueSymbols = allSymbols.filter((s) => {
          if (seen.has(s.underlying_symbol)) return false;
          seen.add(s.underlying_symbol);
          return true;
        });

        setSymbols(uniqueSymbols);
        const chosen = pickDefaultSymbol(uniqueSymbols, readSymbolFromUrl());
        setActiveSymbol(chosen);
        writeSymbolToUrl(chosen.underlying_symbol);

        await loadContractsFor(ws!, chosen);
        setIsLoading(false);
      } catch (err) {
        if (!disposed) {
          setSymbols(FALLBACK_SYMBOLS);
          setActiveSymbol(FALLBACK_SYMBOLS[0]);
          setContractsAvailable(true);
          setIsLoading(false);
        }
      }
    }

    fetchSymbols();
    return () => { disposed = true; };
  }, [ws, isConnected, contractTypesKey, loadContractsFor]);

  return {
    symbols,
    activeSymbol,
    selectSymbol,
    contracts,
    contractsAvailable,
    durationLimits,
    defaultStake,
    isLoading,
    error,
  };
}
