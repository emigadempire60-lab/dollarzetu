'use client';

import { cn } from '@/lib/utils';

interface TickWindowSelectorProps {
  value: number;
  onValueChange: (value: number) => void;
  options?: number[];
  className?: string;
}

const DEFAULT_OPTIONS = [25, 50, 500, 1000];

export function TickWindowSelector({
  value,
  onValueChange,
  options = DEFAULT_OPTIONS,
  className,
}: TickWindowSelectorProps) {
  return (
    <div className={cn('inline-flex items-center gap-1 bg-card/60 p-1 rounded-lg border border-border/80', className)}>
      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground px-1.5 hidden sm:inline">
        Ticks:
      </span>
      <div className="flex items-center gap-1">
        {options.map((opt) => {
          const isSelected = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onValueChange(opt)}
              className={cn(
                'px-2 py-0.5 rounded text-xs font-mono font-medium transition-all duration-150',
                isSelected
                  ? 'bg-primary text-primary-foreground shadow-sm font-bold scale-105'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
