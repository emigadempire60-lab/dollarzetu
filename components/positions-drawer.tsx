'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { OpenPositionCard } from '@/components/custom/open-position-card';
import type { OpenPosition } from '@/hooks/use-open-positions';

interface PositionsDrawerProps {
  openPositions: OpenPosition[];
  onSell: (contractId: number, bidPrice: string) => Promise<void>;
  sellingId: number | null;
  className?: string;
}

export function PositionsDrawer({
  openPositions,
  onSell,
  sellingId,
  className,
}: PositionsDrawerProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (openPositions.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'w-full bg-card/90 backdrop-blur-md border border-border/80 rounded-xl shadow-xl transition-all duration-300',
        className
      )}
    >
      {/* Drawer Header */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-4 py-2.5 cursor-pointer border-b border-border/60 hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-2 font-mono text-xs font-bold text-foreground">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>LIVE ACTIVE CONTRACTS</span>
          <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary font-mono text-[11px]">
            {openPositions.length}
          </span>
        </div>

        <Button variant="ghost" size="sm" className="h-7 text-xs font-mono">
          {isOpen ? 'Minimize ▼' : 'Expand ▲'}
        </Button>
      </div>

      {/* Drawer Content */}
      {isOpen && (
        <div className="p-3 max-h-64 overflow-y-auto space-y-2">
          {openPositions.map((pos) => (
            <OpenPositionCard
              key={`drawer-pos-${pos.contract_id}`}
              pos={pos}
              isSelling={sellingId === pos.contract_id}
              onSell={onSell}
              contractTypeLabels={{
                DIGITMATCH: 'Match',
                DIGITDIFF: 'Differs',
                DIGITOVER: 'Over',
                DIGITUNDER: 'Under',
                DIGITEVEN: 'Even',
                DIGITODD: 'Odd',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
