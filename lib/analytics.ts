'use client';

export interface TelemetryTradeEvent {
  id: string;
  type: 'trade_placed' | 'trade_won' | 'trade_lost' | 'auth_login' | 'auth_logout';
  timestamp: number;
  symbol?: string;
  contractType?: string;
  stake?: number;
  payout?: number;
  profit?: number;
  barrier?: number;
}

export interface TelemetryStats {
  totalTrades: number;
  tradesPlacedToday: number;
  totalVolume: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  topSymbol: string;
  topContractType: string;
  recentEvents: TelemetryTradeEvent[];
}

const STORAGE_KEY = 'dola_trade_telemetry_events';

function getStoredEvents(): TelemetryTradeEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEvents(events: TelemetryTradeEvent[]) {
  if (typeof window === 'undefined') return;
  try {
    // Keep max 500 recent events locally
    const trimmed = events.slice(-500);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // silent fallback
  }
}

export function recordTradePlaced(params: {
  symbol: string;
  contractType: string;
  stake: number;
  barrier?: number;
}): TelemetryTradeEvent {
  const event: TelemetryTradeEvent = {
    id: `tr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type: 'trade_placed',
    timestamp: Date.now(),
    symbol: params.symbol,
    contractType: params.contractType,
    stake: params.stake,
    barrier: params.barrier,
  };

  const existing = getStoredEvents();
  saveEvents([...existing, event]);
  return event;
}

export function recordTradeOutcome(params: {
  contractId: number;
  symbol?: string;
  contractType?: string;
  stake: number;
  payout: number;
  profit: number;
  isWin: boolean;
}) {
  const event: TelemetryTradeEvent = {
    id: `tr_res_${params.contractId}_${Date.now()}`,
    type: params.isWin ? 'trade_won' : 'trade_lost',
    timestamp: Date.now(),
    symbol: params.symbol,
    contractType: params.contractType,
    stake: params.stake,
    payout: params.payout,
    profit: params.profit,
  };

  const existing = getStoredEvents();
  saveEvents([...existing, event]);
}

export function recordAuthEvent(type: 'auth_login' | 'auth_logout') {
  const event: TelemetryTradeEvent = {
    id: `auth_${Date.now()}`,
    type,
    timestamp: Date.now(),
  };

  const existing = getStoredEvents();
  saveEvents([...existing, event]);
}

export function getTelemetryStats(): TelemetryStats {
  const events = getStoredEvents();
  const tradePlacedEvents = events.filter((e) => e.type === 'trade_placed');
  const winEvents = events.filter((e) => e.type === 'trade_won');
  const lossEvents = events.filter((e) => e.type === 'trade_lost');

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfDayMs = startOfDay.getTime();

  const tradesPlacedToday = tradePlacedEvents.filter((e) => e.timestamp >= startOfDayMs).length;

  const totalVolume = tradePlacedEvents.reduce((acc, e) => acc + (e.stake || 0), 0);
  const totalWins = winEvents.length;
  const totalLosses = lossEvents.length;

  const totalSettled = totalWins + totalLosses;
  const winRate = totalSettled > 0 ? (totalWins / totalSettled) * 100 : 0;

  // Calculate top symbol
  const symbolCounts: Record<string, number> = {};
  tradePlacedEvents.forEach((e) => {
    if (e.symbol) {
      symbolCounts[e.symbol] = (symbolCounts[e.symbol] || 0) + 1;
    }
  });

  let topSymbol = 'R_100';
  let maxSymCount = 0;
  Object.keys(symbolCounts).forEach((sym) => {
    const count = symbolCounts[sym];
    if (count > maxSymCount) {
      maxSymCount = count;
      topSymbol = sym;
    }
  });

  // Calculate top contract type
  const contractCounts: Record<string, number> = {};
  tradePlacedEvents.forEach((e) => {
    if (e.contractType) {
      contractCounts[e.contractType] = (contractCounts[e.contractType] || 0) + 1;
    }
  });

  let topContractType = 'DIGITMATCH';
  let maxTypeCount = 0;
  Object.keys(contractCounts).forEach((cType) => {
    const count = contractCounts[cType];
    if (count > maxTypeCount) {
      maxTypeCount = count;
      topContractType = cType;
    }
  });

  return {
    totalTrades: tradePlacedEvents.length,
    tradesPlacedToday,
    totalVolume,
    totalWins,
    totalLosses,
    winRate,
    topSymbol,
    topContractType,
    recentEvents: [...events].reverse().slice(0, 50),
  };
}

export function clearTelemetryEvents() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}
