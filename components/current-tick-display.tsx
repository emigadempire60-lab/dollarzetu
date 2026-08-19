import { useEffect, useRef, useState } from 'react';
import type { Tick } from '../lib/types';
import type { ActiveSymbol } from '../lib/types';
import { cn } from '@/lib/utils';

interface CurrentTickDisplayProps {
  tick: Tick | null;
  lastDigit: number | null;
  activeSymbol: ActiveSymbol | null;
  pipSize: number;
}

export function CurrentTickDisplay({
  tick,
  lastDigit,
  activeSymbol,
  pipSize,
}: CurrentTickDisplayProps) {
  const prevQuoteRef = useRef<number | null>(null);
  const [direction, setDirection] = useState<'up' | 'down' | 'same'>('same');
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    if (tick) {
      if (prevQuoteRef.current !== null) {
        if (tick.quote > prevQuoteRef.current) {
          setDirection('up');
        } else if (tick.quote < prevQuoteRef.current) {
          setDirection('down');
        } else {
          setDirection('same');
        }
      }
      prevQuoteRef.current = tick.quote;
      setIsFlashing(true);
      const timer = setTimeout(() => setIsFlashing(false), 200);
      return () => clearTimeout(timer);
    }
  }, [tick]);

  if (!tick || !activeSymbol) {
    return (
      <div className="flex flex-col items-center justify-center py-4 sm:py-6 space-y-2">
        <div className="text-sm font-mono uppercase tracking-widest text-muted-foreground animate-pulse">
          Connecting to market...
        </div>
        <div className="text-3xl sm:text-4xl font-mono font-bold text-muted-foreground/30">
          0.0000
        </div>
      </div>
    );
  }

  const priceStr = tick.quote.toFixed(pipSize);
  const priceWithoutLast = priceStr.slice(0, -1);
  const lastDigitStr = priceStr.slice(-1);

  return (
    <div className="flex flex-col items-center justify-center py-3 sm:py-5 w-full">
      {/* Symbol Tag & Tick Time */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground bg-card/80 px-2 py-0.5 rounded border border-border">
          {activeSymbol.underlying_symbol_name || activeSymbol.underlying_symbol}
        </span>
        <span className="text-[10px] font-mono text-muted-foreground">
          {new Date(tick.epoch * 1000).toLocaleTimeString()}
        </span>
      </div>

      {/* Hero Price Display */}
      <div
        className={cn(
          'flex items-center justify-center gap-1 sm:gap-2 px-4 py-2 rounded-xl transition-colors duration-200 border border-transparent',
          isFlashing && (direction === 'up' ? 'bg-emerald-500/10 border-emerald-500/20' : direction === 'down' ? 'bg-rose-500/10 border-rose-500/20' : '')
        )}
      >
        <div className="text-3xl sm:text-5xl lg:text-6xl font-mono font-bold tracking-tight text-foreground flex items-baseline">
          <span>{priceWithoutLast}</span>
          {/* Isolated Last Digit */}
          <span className="text-primary text-4xl sm:text-6xl lg:text-7xl font-extrabold ml-0.5 underline decoration-primary/50 underline-offset-4">
            {lastDigitStr}
          </span>
        </div>

        {/* Direction Arrow Indicator */}
        <div
          className={cn(
            'flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 rounded-full font-mono text-sm sm:text-base font-bold transition-all duration-200',
            direction === 'up'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : direction === 'down'
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {direction === 'up' ? '↑' : direction === 'down' ? '↓' : '•'}
        </div>
      </div>

      {/* Active Last Digit Badge */}
      <div className="mt-2 flex items-center gap-2 text-xs font-mono text-muted-foreground">
        <span>LAST DIGIT SIGNAL</span>
        <span className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-mono font-extrabold text-sm shadow-md ring-2 ring-primary/30">
          {lastDigit}
        </span>
      </div>
    </div>
  );
}
