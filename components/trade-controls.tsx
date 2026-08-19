'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type {
  ContractMode,
  TradeType,
  DurationLimits,
  ProposalInfo,
  BuyResult,
} from '../lib/types';

interface TradeControlsProps {
  tradeType: TradeType;
  contractMode: ContractMode;
  onContractModeChange: (mode: ContractMode) => void;
  selectedDigit: number;
  isConnected: boolean;
  stake: string;
  onStakeChange: (value: string) => void;
  duration: number;
  onDurationChange: (value: number) => void;
  durationLimits: DurationLimits;
  proposal: ProposalInfo | null;
  isProposalLoading: boolean;
  onBuy: () => void;
  isBuying: boolean;
  buyResult: BuyResult | null;
  buyError: string | null;
  onClearBuyResult: () => void;
  isAuthenticated?: boolean;
  onLogin?: () => void;
}

const CONTRACT_MODE_OPTIONS: Record<TradeType, { value: ContractMode; label: string }[]> = {
  'matches-differs': [
    { value: 'DIGITMATCH', label: 'Matches' },
    { value: 'DIGITDIFF', label: 'Differs' },
  ],
  'over-under': [
    { value: 'DIGITOVER', label: 'Over' },
    { value: 'DIGITUNDER', label: 'Under' },
  ],
  'even-odd': [
    { value: 'DIGITEVEN', label: 'Even' },
    { value: 'DIGITODD', label: 'Odd' },
  ],
};

function getPredictionText(contractMode: ContractMode): string {
  switch (contractMode) {
    case 'DIGITMATCH':
      return 'match';
    case 'DIGITDIFF':
      return 'differ from';
    case 'DIGITOVER':
      return 'be over';
    case 'DIGITUNDER':
      return 'be under';
    case 'DIGITEVEN':
      return 'be even';
    case 'DIGITODD':
      return 'be odd';
  }
}

function showDigitInPrediction(contractMode: ContractMode): boolean {
  return contractMode !== 'DIGITEVEN' && contractMode !== 'DIGITODD';
}

export function TradeControls({
  tradeType,
  contractMode,
  onContractModeChange,
  selectedDigit,
  isConnected,
  stake,
  onStakeChange,
  duration,
  onDurationChange,
  durationLimits,
  proposal,
  isProposalLoading,
  onBuy,
  isBuying,
  buyResult,
  buyError,
  onClearBuyResult,
  isAuthenticated,
  onLogin,
}: TradeControlsProps) {
  useEffect(() => {
    if (buyError) {
      toast.error('Purchase Failed', { description: buyError });
      onClearBuyResult();
    }
  }, [buyError, onClearBuyResult]);

  useEffect(() => {
    if (buyResult) {
      toast.success('Contract Purchased', {
        description: `Buy price: ${buyResult.buyPrice.toFixed(2)} USD | Payout: ${buyResult.payout.toFixed(2)} USD | Balance: ${buyResult.balanceAfter.toFixed(2)} USD`,
      });
      onClearBuyResult();
    }
  }, [buyResult, onClearBuyResult]);

  const modeOptions = CONTRACT_MODE_OPTIONS[tradeType];

  const handleQuickStakeAdd = (addAmount: number) => {
    const current = parseFloat(stake) || 0;
    onStakeChange((current + addAmount).toFixed(2));
  };

  const durationOptions = [1, 2, 3, 4, 5, 10];

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Contract Mode Toggle */}
      <ToggleGroup
        type="single"
        value={contractMode}
        onValueChange={(value: string) => {
          if (value) onContractModeChange(value as ContractMode);
        }}
        className="w-full gap-0.5 rounded-xl bg-card/60 p-1 border border-border"
      >
        {modeOptions.map(opt => (
          <ToggleGroupItem
            key={opt.value}
            value={opt.value}
            className="flex-1 rounded-lg text-xs font-mono font-bold text-muted-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-md transition-all"
          >
            {opt.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {/* Stake & Duration Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Stake Section */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="stake" className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
              Stake (USD)
            </Label>
          </div>
          <Input
            id="stake"
            type="number"
            value={stake}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onStakeChange(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (['e', 'E', '+', '-'].indexOf(e.key) !== -1) e.preventDefault();
            }}
            min={0}
            step="0.01"
            className="font-mono text-sm font-bold bg-card/60 border-border"
          />
          {/* Quick Stake Chips */}
          <div className="flex items-center gap-1 pt-1 overflow-x-auto">
            {[1, 5, 10, 25, 50].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleQuickStakeAdd(amt)}
                className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50 transition-colors"
              >
                +{amt}
              </button>
            ))}
          </div>
        </div>

        {/* Duration Section */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="duration" className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
              Duration (Ticks)
            </Label>
          </div>
          <Input
            id="duration"
            type="number"
            value={duration}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val)) onDurationChange(val);
            }}
            min={durationLimits.min}
            max={durationLimits.max}
            step={1}
            className="font-mono text-sm font-bold bg-card/60 border-border"
          />
          {/* Duration Pills */}
          <div className="flex items-center gap-1 pt-1 overflow-x-auto">
            {durationOptions.map((dur) => (
              <button
                key={dur}
                type="button"
                onClick={() => onDurationChange(dur)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors border ${
                  duration === dur
                    ? 'bg-primary/20 text-primary border-primary/40'
                    : 'bg-muted/60 hover:bg-muted text-muted-foreground border-border/50'
                }`}
              >
                {dur}t
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Prediction Summary & Payout Block */}
      <div className="rounded-xl border border-border p-3 bg-card/40 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
            Contract Prediction
          </p>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
            {duration} Ticks Duration
          </span>
        </div>
        <p className="text-xs sm:text-sm font-mono font-semibold text-foreground flex items-center gap-1.5">
          <span>Last digit will</span>
          <span className="text-primary font-bold uppercase">{getPredictionText(contractMode)}</span>
          {showDigitInPrediction(contractMode) && (
            <span className="w-5 h-5 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-xs font-mono font-bold">
              {selectedDigit}
            </span>
          )}
        </p>

        {(proposal || isProposalLoading) && (
          <div className="flex items-center justify-between pt-2 border-t border-border/60">
            <span className="text-xs font-mono text-muted-foreground">Potential Payout</span>
            {isProposalLoading ? (
              <Skeleton className="h-5 w-24 rounded" />
            ) : (
              <span className="text-base font-mono font-extrabold text-emerald-400">
                {proposal!.payout.toFixed(2)} USD
              </span>
            )}
          </div>
        )}
      </div>

      {/* High-Impact Buy Button */}
      <div className="max-lg:fixed max-lg:bottom-[calc(env(safe-area-inset-bottom)+2.5rem)] max-lg:left-3 max-lg:right-3 lg:static">
        <Button
          className={`w-full h-12 rounded-xl text-base font-mono font-bold tracking-wide transition-all duration-200 shadow-lg ${
            isBuying
              ? 'bg-amber-500 text-white animate-pulse'
              : proposal
              ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20 animate-pulse-subtle'
              : !isAuthenticated
              ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-md cursor-pointer'
              : 'bg-muted text-muted-foreground border border-border'
          }`}
          disabled={!isConnected || isBuying || (!!isAuthenticated && !proposal)}
          onClick={isAuthenticated ? onBuy : onLogin}
        >
          {isBuying
            ? 'PURCHASING CONTRACT...'
            : proposal
              ? `BUY CONTRACT @ ${proposal.askPrice.toFixed(2)} USD`
              : isAuthenticated
              ? 'GETTING PROPOSAL...'
              : 'LOG IN TO TRADE'}
        </Button>
      </div>

      {isAuthenticated && (
        <Button asChild variant="ghost" className="w-full text-xs font-mono text-muted-foreground hover:text-foreground">
          <Link href="/reports">View detailed trade history →</Link>
        </Button>
      )}
    </div>
  );
}
