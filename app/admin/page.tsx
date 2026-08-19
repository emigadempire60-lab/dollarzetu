'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getTelemetryStats, clearTelemetryEvents, type TelemetryStats, type TelemetryTradeEvent } from '@/lib/analytics';
import { MasterSignalControl } from '@/components/master-signal-control';

export default function AdminMonitorPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passError, setPassError] = useState(false);
  const [stats, setStats] = useState<TelemetryStats | null>(null);

  const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';

  useEffect(() => {
    // Check if already authenticated in this session
    if (typeof window !== 'undefined' && sessionStorage.getItem('dola_admin_auth') === 'true') {
      setIsAuthenticated(true);
      setStats(getTelemetryStats());
    }
  }, []);

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password === adminPassword) {
      setIsAuthenticated(true);
      sessionStorage.setItem('dola_admin_auth', 'true');
      setStats(getTelemetryStats());
      setPassError(false);
    } else {
      setPassError(true);
    }
  };

  const handleRefresh = () => {
    setStats(getTelemetryStats());
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear local trade monitoring logs?')) {
      clearTelemetryEvents();
      setStats(getTelemetryStats());
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="flex flex-col items-center justify-center min-h-dvh bg-background px-4">
        <Card className="w-full max-w-md border-border bg-card/90 shadow-2xl">
          <CardHeader className="text-center">
            <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-mono font-bold text-xl mx-auto mb-2">
              ⚡
            </div>
            <CardTitle className="text-xl font-mono font-bold tracking-tight">
              Operator Trade Monitor
            </CardTitle>
            <p className="text-xs text-muted-foreground font-mono">
              Enter operator password to access site telemetry &amp; live trade metrics.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <Input
                  type="password"
                  placeholder="Enter Operator Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="font-mono text-sm"
                />
                {passError && (
                  <p className="text-xs text-rose-500 font-mono">Invalid password. Please verify your operator key.</p>
                )}
              </div>
              <Button type="submit" className="w-full font-mono font-bold">
                Unlock Dashboard
              </Button>
              <div className="text-center pt-2">
                <Link href="/" className="text-xs font-mono text-muted-foreground hover:text-foreground">
                  ← Back to Trading Terminal
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-background text-foreground p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-mono font-bold tracking-tight">
              Trade Monitoring Telemetry &amp; Signals
            </h1>
          </div>
          <p className="text-xs font-mono text-muted-foreground mt-0.5">
            Real-time site usage, trade activity, and master signal broadcasting
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} className="font-mono text-xs">
            🔄 Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleClear} className="font-mono text-xs text-rose-400 border-rose-500/30">
            Clear Logs
          </Button>
          <Button asChild size="sm" className="font-mono text-xs">
            <Link href="/">Terminal →</Link>
          </Button>
        </div>
      </div>

      {/* Master Signal Broadcaster */}
      <MasterSignalControl />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <Card className="bg-card/70 border-border">
          <CardContent className="p-4">
            <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Trades Today</p>
            <p className="text-2xl sm:text-3xl font-mono font-bold text-primary mt-1">
              {stats?.tradesPlacedToday || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border">
          <CardContent className="p-4">
            <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Total Trades</p>
            <p className="text-2xl sm:text-3xl font-mono font-bold text-foreground mt-1">
              {stats?.totalTrades || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border">
          <CardContent className="p-4">
            <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Total Volume</p>
            <p className="text-2xl sm:text-3xl font-mono font-bold text-emerald-400 mt-1">
              ${(stats?.totalVolume || 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border">
          <CardContent className="p-4">
            <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Win Rate</p>
            <p className="text-2xl sm:text-3xl font-mono font-bold text-foreground mt-1">
              {(stats?.winRate || 0).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border">
          <CardContent className="p-4">
            <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Top Symbol</p>
            <p className="text-lg sm:text-xl font-mono font-bold text-primary mt-2 truncate">
              {stats?.topSymbol || 'R_100'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border">
          <CardContent className="p-4">
            <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Top Contract</p>
            <p className="text-lg sm:text-xl font-mono font-bold text-amber-400 mt-2 truncate">
              {stats?.topContractType || 'DIGITMATCH'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Telemetry Stream Table */}
      <Card className="border-border bg-card/70">
        <CardHeader className="py-3 px-4 border-b border-border">
          <CardTitle className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">
            Recent Telemetry Stream
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {(!stats?.recentEvents || stats.recentEvents.length === 0) ? (
            <div className="py-12 text-center text-sm font-mono text-muted-foreground">
              No trade telemetry recorded yet. Place trades on the main terminal to see live telemetry stream.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground uppercase tracking-wider">
                  <th className="py-2.5 px-4">Time</th>
                  <th className="py-2.5 px-4">Event Type</th>
                  <th className="py-2.5 px-4">Symbol</th>
                  <th className="py-2.5 px-4">Contract</th>
                  <th className="py-2.5 px-4 text-right">Stake</th>
                  <th className="py-2.5 px-4 text-right">Payout / P&amp;L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {stats.recentEvents.map((evt: TelemetryTradeEvent) => (
                  <tr key={evt.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-2.5 px-4 text-muted-foreground">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-4 font-bold">
                      {evt.type === 'trade_placed' && (
                        <span className="text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                          TRADE PLACED
                        </span>
                      )}
                      {evt.type === 'trade_won' && (
                        <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          WIN (+${(evt.profit || 0).toFixed(2)})
                        </span>
                      )}
                      {evt.type === 'trade_lost' && (
                        <span className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                          LOSS (${(evt.profit || 0).toFixed(2)})
                        </span>
                      )}
                      {evt.type.startsWith('auth') && (
                        <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          {evt.type.toUpperCase()}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-foreground font-semibold">
                      {evt.symbol || '-'}
                    </td>
                    <td className="py-2.5 px-4 text-muted-foreground">
                      {evt.contractType || '-'} {evt.barrier !== undefined ? `(${evt.barrier})` : ''}
                    </td>
                    <td className="py-2.5 px-4 text-right font-semibold">
                      {evt.stake ? `$${evt.stake.toFixed(2)}` : '-'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold">
                      {evt.payout !== undefined ? `$${evt.payout.toFixed(2)}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
