'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { getTelemetryStats, clearTelemetryEvents, type TelemetryStats, type TelemetryTradeEvent } from '@/lib/analytics';

interface TradingJournalCardProps {
  className?: string;
}

export function TradingJournalCard({ className = '' }: TradingJournalCardProps) {
  const [stats, setStats] = useState<TelemetryStats | null>(null);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  useEffect(() => {
    setStats(getTelemetryStats());
    const interval = setInterval(() => {
      setStats(getTelemetryStats());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const exportCSV = () => {
    if (!stats?.recentEvents || stats.recentEvents.length === 0) return;

    const headers = ['ID', 'Timestamp', 'Event Type', 'Symbol', 'Contract Type', 'Digit Barrier', 'Stake ($)', 'Payout ($)', 'Profit ($)'];
    const rows = stats.recentEvents.map((e) => [
      e.id,
      new Date(e.timestamp).toISOString(),
      e.type,
      e.symbol || '',
      e.contractType || '',
      e.barrier !== undefined ? e.barrier : '',
      e.stake || 0,
      e.payout || 0,
      e.profit || 0,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DollarZetu_Trading_Journal_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate Net Profit
  const netProfit = (stats?.recentEvents || []).reduce((acc, ev) => acc + (ev.profit || 0), 0);

  // Calculate Win Streaks
  let currentStreak = 0;
  let maxStreak = 0;
  const outcomeEvents = (stats?.recentEvents || []).filter((e) => e.type === 'trade_won' || e.type === 'trade_lost');

  for (let i = outcomeEvents.length - 1; i >= 0; i--) {
    if (outcomeEvents[i].type === 'trade_won') {
      currentStreak++;
      if (currentStreak > maxStreak) maxStreak = currentStreak;
    } else {
      currentStreak = 0;
    }
  }

  return (
    <Card className={`border-border bg-card/90 shadow-xl ${className}`}>
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <CardTitle className="text-sm font-mono font-bold uppercase tracking-wider flex items-center gap-2">
            📊 Trading Performance Journal
          </CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Popover open={clearConfirmOpen} onOpenChange={setClearConfirmOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="font-mono text-xs text-rose-400 border-rose-500/30 hover:bg-rose-500/10 h-7"
              >
                🗑️ Clear History
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 p-4 bg-card border-border shadow-xl">
              <div className="space-y-3">
                <div className="space-y-1">
                  <h4 className="text-xs font-mono font-bold text-rose-400 flex items-center gap-1.5">
                    ⚠️ Clear Trade History?
                  </h4>
                  <p className="text-[11px] font-mono text-muted-foreground leading-normal">
                    Are you sure you want to clear your trade history entries? This action cannot be undone.
                  </p>
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setClearConfirmOpen(false)}
                    className="text-xs font-mono h-7 px-2 text-muted-foreground"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      clearTelemetryEvents();
                      setStats(getTelemetryStats());
                      setClearConfirmOpen(false);
                      toast.success('Trade history cleared');
                    }}
                    className="text-xs font-mono h-7 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold"
                  >
                    Yes, Clear History
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            className="font-mono text-xs text-primary border-primary/30 hover:bg-primary/10 h-7"
          >
            📥 Export CSV Journal
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4 font-mono text-xs">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Net P&L */}
          <div className="p-3 rounded-lg bg-muted/40 border border-border/50">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Net P&amp;L</p>
            <p className={`text-xl font-bold mt-0.5 ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {netProfit >= 0 ? `+$${netProfit.toFixed(2)}` : `-$${Math.abs(netProfit).toFixed(2)}`}
            </p>
          </div>

          {/* Win Rate */}
          <div className="p-3 rounded-lg bg-muted/40 border border-border/50">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Win Rate</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <p className="text-xl font-bold text-foreground">{(stats?.winRate || 0).toFixed(1)}%</p>
              <span className="text-[10px] text-muted-foreground">({stats?.totalWins || 0}W / {stats?.totalLosses || 0}L)</span>
            </div>
          </div>

          {/* Max Win Streak */}
          <div className="p-3 rounded-lg bg-muted/40 border border-border/50">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Peak Win Streak</p>
            <p className="text-xl font-bold text-amber-400 mt-0.5 flex items-center gap-1">
              🔥 {maxStreak} Trades
            </p>
          </div>

          {/* Total Volume */}
          <div className="p-3 rounded-lg bg-muted/40 border border-border/50">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Volume</p>
            <p className="text-xl font-bold text-primary mt-0.5">
              ${(stats?.totalVolume || 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Win Rate Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Win Ratio Distribution</span>
            <span>{stats?.totalWins || 0} Wins vs {stats?.totalLosses || 0} Losses</span>
          </div>
          <div className="w-full h-2 rounded-full bg-rose-500/30 overflow-hidden flex">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${stats?.winRate || 0}%` }}
            />
          </div>
        </div>

        {/* Recent Journal Table */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Recent Journal Entries</p>
          {(!stats?.recentEvents || stats.recentEvents.length === 0) ? (
            <div className="py-6 text-center text-muted-foreground text-xs font-mono">
              No journal entries recorded yet. Place trades to track win/loss analytics.
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto rounded-md border border-border/50">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead className="bg-muted/50 text-muted-foreground uppercase tracking-wider sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Time</th>
                    <th className="py-2 px-3">Symbol</th>
                    <th className="py-2 px-3">Contract</th>
                    <th className="py-2 px-3 text-right">Stake</th>
                    <th className="py-2 px-3 text-right">Result P&amp;L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 bg-background/50">
                  {stats.recentEvents.map((evt: TelemetryTradeEvent) => (
                    <tr key={evt.id} className="hover:bg-muted/30">
                      <td className="py-2 px-3 text-muted-foreground">
                        {new Date(evt.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2 px-3 font-semibold">{evt.symbol || '-'}</td>
                      <td className="py-2 px-3 text-muted-foreground">
                        {evt.contractType || '-'} {evt.barrier !== undefined ? `(${evt.barrier})` : ''}
                      </td>
                      <td className="py-2 px-3 text-right font-semibold">
                        {evt.stake ? `$${evt.stake.toFixed(2)}` : '-'}
                      </td>
                      <td className="py-2 px-3 text-right font-bold">
                        {evt.type === 'trade_won' && (
                          <span className="text-emerald-400">+${(evt.profit || 0).toFixed(2)}</span>
                        )}
                        {evt.type === 'trade_lost' && (
                          <span className="text-rose-400">-${Math.abs(evt.profit || evt.stake || 0).toFixed(2)}</span>
                        )}
                        {evt.type === 'trade_placed' && (
                          <Badge variant="outline" className="text-[9px] py-0 px-1 font-normal text-muted-foreground">
                            PENDING
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
