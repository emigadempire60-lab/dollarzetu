import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { TickWindowSelector } from './tick-window-selector';
import type { DigitStats } from '../lib/types';

interface DigitStatsBarProps {
  digitStats: DigitStats;
  selectedDigit: number;
  onDigitSelect: (digit: number) => void;
  tickWindow?: number;
  onTickWindowChange?: (windowSize: number) => void;
}

export function DigitStatsBar({
  digitStats,
  selectedDigit,
  onDigitSelect,
  tickWindow = 1000,
  onTickWindowChange,
}: DigitStatsBarProps) {
  const maxPct = Math.max(...digitStats.percentages);
  const minPct = Math.min(...digitStats.percentages);

  return (
    <div className="h-full flex flex-col justify-between">
      {/* Header Row with Label & Tick Window Selector */}
      <div className="flex items-center justify-between mb-3 gap-2">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
            Digit Frequencies
          </span>
          <p className="text-[11px] text-muted-foreground/70">
            Sample: {digitStats.totalTicks.toLocaleString()} ticks
          </p>
        </div>
        {onTickWindowChange && (
          <TickWindowSelector value={tickWindow} onValueChange={onTickWindowChange} />
        )}
      </div>

      {/* 0-9 Digit Selection Grid */}
      <div className="grid grid-cols-5 gap-2 sm:gap-2.5 place-items-center w-full my-auto">
        {digitStats.percentages.map((pct, digit) => {
          const isSelected = digit === selectedDigit;
          const isHighest = digitStats.totalTicks > 0 && pct === maxPct;
          const isLowest = digitStats.totalTicks > 0 && pct === minPct;
          const count = digitStats.counts ? digitStats.counts[digit] : 0;

          return (
            <div key={digit} className="flex flex-col items-center gap-1.5 w-full">
              <Button
                variant={isSelected ? 'default' : 'outline'}
                onClick={() => onDigitSelect(digit)}
                title={`Digit ${digit}: ${count} hits (${pct.toFixed(1)}%)`}
                className={cn(
                  'w-full h-11 sm:h-13 text-base sm:text-lg font-mono font-bold rounded-lg p-0 transition-all relative overflow-hidden',
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-md ring-2 ring-primary/40 font-extrabold scale-102'
                    : isHighest
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                    : 'bg-card/60 border-border/80 hover:bg-muted/60 text-foreground'
                )}
              >
                {digit}
                {isHighest && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                )}
              </Button>
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    'text-[11px] font-mono font-bold',
                    isHighest && 'text-emerald-400',
                    isLowest && 'text-rose-400',
                    !isHighest && !isLowest && 'text-muted-foreground'
                  )}
                >
                  {pct.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
