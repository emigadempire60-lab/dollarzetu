'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { TradeSignal } from '@/lib/signals';

interface SignalReceiverWidgetProps {
  signals: TradeSignal[];
  isAutoTrade: boolean;
  onToggleAutoTrade: (enabled: boolean) => void;
  followerStake: string;
  onUpdateFollowerStake: (stake: string) => void;
  isConnectedToFeed: boolean;
  onManualCopy: (signal: TradeSignal) => void;
  isAuthenticated: boolean;
}

export function SignalReceiverWidget({
  signals,
  isAutoTrade,
  onToggleAutoTrade,
  followerStake,
  onUpdateFollowerStake,
  isConnectedToFeed,
  onManualCopy,
  isAuthenticated,
}: SignalReceiverWidgetProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  return (
    <Card className="border-border bg-card/90 backdrop-blur shadow-xl transition-all">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-border/60">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${isConnectedToFeed ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <CardTitle className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
            ⚡ Master Signal Feed
            {signals.length > 0 && (
              <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0 h-4 bg-primary/20 text-primary border-primary/30">
                {signals.length} New
              </Badge>
            )}
          </CardTitle>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-7 px-2 font-mono text-xs text-muted-foreground hover:text-foreground"
          >
            {isExpanded ? 'Minimize −' : 'Expand +'}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="p-3 sm:p-4 space-y-4 font-mono text-xs">
          {/* Controls Bar: Auto-Trade Toggle & Custom Stake */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-2.5 rounded-lg bg-muted/40 border border-border/40">
            {/* Auto Trade Toggle */}
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-bold text-foreground">Auto-Trade Signals</p>
                <p className="text-[10px] text-muted-foreground">Auto-execute incoming signals</p>
              </div>
              <Button
                size="sm"
                variant={isAutoTrade ? 'default' : 'outline'}
                onClick={() => onToggleAutoTrade(!isAutoTrade)}
                className={`font-mono text-xs font-bold transition-all ${
                  isAutoTrade ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/30' : 'text-muted-foreground'
                }`}
              >
                {isAutoTrade ? '🤖 AUTO ON' : '⏸️ OFF'}
              </Button>
            </div>

            {/* Custom Stake Override */}
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-bold text-foreground">Follower Stake ($)</p>
                <p className="text-[10px] text-muted-foreground">Your stake per signal</p>
              </div>
              <Input
                type="number"
                value={followerStake}
                onChange={(e) => onUpdateFollowerStake(e.target.value)}
                className="w-20 h-8 font-mono text-xs text-right bg-background border-border"
                placeholder="10"
                min="1"
              />
            </div>
          </div>

          {/* Signals List */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {signals.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground text-xs font-mono space-y-1">
                <p>📡 Listening for Master Trader signals...</p>
                <p className="text-[10px] text-muted-foreground/70">
                  When your guide issues a trade signal, it will appear here in real-time.
                </p>
              </div>
            ) : (
              signals.map((sig) => (
                <div
                  key={sig.id}
                  className="flex items-center justify-between p-2.5 rounded-md border border-border/60 bg-background/60 hover:bg-muted/30 transition-all"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-primary">{sig.masterName || 'Master Guide'}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(sig.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-foreground">
                      <span className="text-amber-400 font-bold">{sig.contractType}</span> on{' '}
                      <span className="text-emerald-400">{sig.symbolDisplayName || sig.symbol}</span>
                      {sig.selectedDigit !== undefined && ` (Digit: ${sig.selectedDigit})`}
                    </p>
                    {sig.note && <p className="text-[10px] text-muted-foreground italic">&quot;{sig.note}&quot;</p>}
                  </div>

                  <div>
                    <Button
                      size="sm"
                      onClick={() => onManualCopy(sig)}
                      disabled={!isAuthenticated}
                      className="font-mono text-xs font-bold h-8 bg-primary/20 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/40 transition-all"
                    >
                      ⚡ Copy Trade
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
