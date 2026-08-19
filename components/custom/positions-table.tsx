'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { getSymbolDisplayName } from '@/lib/active-symbols-display-names';
import { OpenPositionCard } from './open-position-card';
import { ClosedPositionCard } from './closed-position-card';
import type { OpenPosition } from '@/hooks/use-open-positions';
import type { ClosedPosition } from '@/hooks/use-closed-positions';

export type PositionFilter = 'open' | 'closed' | 'all';

interface PositionsTableProps {
  openPositions: OpenPosition[];
  closedPositions: ClosedPosition[];
  onSell: (contractId: number, bidPrice: string) => Promise<void>;
  sellingId: number | null;
  sellError: string | null;
  onClearSellError: () => void;
  /** Map from contract_type string to display label. Falls back to raw type. */
  contractTypeLabels?: Record<string, string>;
  /** Merged onto the root wrapper (spacing, max-height, overflow). */
  className?: string;
}

const VALUE_COL_HEADER: Record<PositionFilter, string> = {
  open: 'Current Value',
  closed: 'Sell Price',
  all: 'Value',
};

function formatContractType(
  contractType: string,
  labels: Record<string, string>,
  barrier?: string
): string {
  const label = labels[contractType] ?? contractType;
  return barrier !== undefined ? `${label} (${barrier})` : label;
}

export function PositionsTable({
  openPositions,
  closedPositions,
  onSell,
  sellingId,
  sellError,
  onClearSellError,
  contractTypeLabels = {},
  className,
}: PositionsTableProps) {
  const [filter, setFilter] = useState<PositionFilter>('open');

  useEffect(() => {
    if (sellError) {
      toast.error('Sell Failed', { description: sellError });
      onClearSellError();
    }
  }, [sellError, onClearSellError]);

  const totalCount = openPositions.length + closedPositions.length;

  const visibleOpen = filter === 'open' || filter === 'all' ? openPositions : [];
  const visibleClosed = filter === 'closed' || filter === 'all' ? closedPositions : [];

  return (
    <div className={cn('mt-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-mono font-bold tracking-tight">Trade History &amp; Positions</h2>
          <p className="text-xs font-mono text-muted-foreground">Live running contracts and settled trade ledger</p>
        </div>
        <Select value={filter} onValueChange={(value: string) => setFilter(value as PositionFilter)}>
          <SelectTrigger className="w-32 font-mono text-xs bg-card border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="font-mono text-xs">
            <SelectItem value="open">Open ({openPositions.length})</SelectItem>
            <SelectItem value="closed">Closed ({closedPositions.length})</SelectItem>
            <SelectItem value="all">All ({totalCount})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Desktop: table */}
      <div className="hidden lg:block rounded-xl border border-border bg-card/60 overflow-hidden shadow-sm">
        <Table className="font-mono text-xs">
          <TableHeader>
            <TableRow className="border-b border-border/80 bg-muted/40 hover:bg-muted/40">
              <TableHead className="font-bold uppercase tracking-wider text-muted-foreground">Type</TableHead>
              <TableHead className="font-bold uppercase tracking-wider text-muted-foreground">Symbol</TableHead>
              <TableHead className="text-right font-bold uppercase tracking-wider text-muted-foreground">Stake</TableHead>
              <TableHead className="text-right font-bold uppercase tracking-wider text-muted-foreground">{VALUE_COL_HEADER[filter]}</TableHead>
              <TableHead className="text-right font-bold uppercase tracking-wider text-muted-foreground">P&amp;L</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleOpen.map((pos) => (
              <OpenPositionRow
                key={`open-${pos.contract_id}`}
                pos={pos}
                isSelling={sellingId === pos.contract_id}
                onSell={onSell}
                contractTypeLabels={contractTypeLabels}
              />
            ))}
            {visibleClosed.map((pos) => (
              <ClosedPositionRow
                key={`closed-${pos.contract_id}`}
                pos={pos}
                contractTypeLabels={contractTypeLabels}
              />
            ))}
            {visibleOpen.length === 0 && visibleClosed.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center font-mono text-sm text-muted-foreground py-12">
                  No trade positions recorded
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: cards */}
      <div className="lg:hidden flex flex-col gap-3">
        {visibleOpen.map((pos) => (
          <OpenPositionCard
            key={`open-card-${pos.contract_id}`}
            pos={pos}
            isSelling={sellingId === pos.contract_id}
            onSell={onSell}
            contractTypeLabels={contractTypeLabels}
          />
        ))}
        {visibleClosed.map((pos) => (
          <ClosedPositionCard
            key={`closed-card-${pos.contract_id}`}
            pos={pos}
            contractTypeLabels={contractTypeLabels}
          />
        ))}
        {visibleOpen.length === 0 && visibleClosed.length === 0 && (
          <p className="text-center text-sm font-mono text-muted-foreground py-8">No trade positions recorded</p>
        )}
      </div>
    </div>
  );
}

// ─── Desktop table rows ────────────────────────────────────────────────────

function OpenPositionRow({
  pos,
  isSelling,
  onSell,
  contractTypeLabels,
}: {
  pos: OpenPosition;
  isSelling: boolean;
  onSell: (contractId: number, bidPrice: string) => Promise<void>;
  contractTypeLabels: Record<string, string>;
}) {
  const profit = parseFloat(pos.profit);
  const isProfit = profit >= 0;

  return (
    <TableRow className="border-b border-border/40 hover:bg-muted/20">
      <TableCell className="font-mono font-bold text-foreground">
        {formatContractType(pos.contract_type, contractTypeLabels, pos.barrier)}
      </TableCell>
      <TableCell className="font-mono text-muted-foreground">{getSymbolDisplayName(pos.underlying_symbol)}</TableCell>
      <TableCell className="text-right font-mono font-semibold">
        {parseFloat(pos.buy_price).toFixed(2)} {pos.currency}
      </TableCell>
      <TableCell className="text-right font-mono font-semibold">
        {parseFloat(pos.bid_price).toFixed(2)} {pos.currency}
      </TableCell>
      <ProfitCell profit={profit} profitPct={pos.profit_percentage} currency={pos.currency} isProfit={isProfit} />
      <TableCell className="text-right">
        <Button
          size="sm"
          variant="outline"
          className="font-mono text-xs"
          disabled={isSelling || pos.is_valid_to_sell !== 1}
          onClick={() => onSell(pos.contract_id, pos.bid_price)}
        >
          {isSelling ? 'Selling...' : 'Sell'}
        </Button>
      </TableCell>
    </TableRow>
  );
}

function ClosedPositionRow({
  pos,
  contractTypeLabels,
}: {
  pos: ClosedPosition;
  contractTypeLabels: Record<string, string>;
}) {
  const profit = pos.sell_price - pos.buy_price;
  const profitPct = (profit / pos.buy_price) * 100;
  const isProfit = profit >= 0;

  return (
    <TableRow className="border-b border-border/40 hover:bg-muted/20">
      <TableCell className="font-mono font-bold text-foreground">
        {formatContractType(pos.contract_type, contractTypeLabels)}
      </TableCell>
      <TableCell className="font-mono text-muted-foreground">{getSymbolDisplayName(pos.underlying_symbol)}</TableCell>
      <TableCell className="text-right font-mono font-semibold">
        {pos.buy_price.toFixed(2)}
      </TableCell>
      <TableCell className="text-right font-mono font-semibold">
        {pos.sell_price.toFixed(2)}
      </TableCell>
      <ProfitCell profit={profit} profitPct={profitPct} currency="" isProfit={isProfit} />
      <TableCell />
    </TableRow>
  );
}

function ProfitCell({
  profit,
  profitPct,
  currency,
  isProfit,
}: {
  profit: number;
  profitPct: number;
  currency: string;
  isProfit: boolean;
}) {
  return (
    <TableCell
      className={cn(
        'text-right font-mono font-bold',
        isProfit ? 'text-emerald-400' : 'text-rose-400'
      )}
    >
      {isProfit ? '+' : ''}{profit.toFixed(2)}{currency ? ` ${currency}` : ''}
      <span className="text-[11px] font-normal ml-1 opacity-80">
        ({isProfit ? '+' : ''}{profitPct.toFixed(1)}%)
      </span>
    </TableCell>
  );
}
