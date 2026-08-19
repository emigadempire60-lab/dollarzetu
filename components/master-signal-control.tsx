'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { sendSignalToNetwork, type TradeSignal } from '@/lib/signals';
import type { ContractMode } from '@/lib/types';

const SYMBOLS_LIST = [
  { value: 'R_100', label: 'Volatility 100 Index' },
  { value: 'R_75', label: 'Volatility 75 Index' },
  { value: 'R_50', label: 'Volatility 50 Index' },
  { value: 'R_25', label: 'Volatility 25 Index' },
  { value: 'R_10', label: 'Volatility 10 Index' },
  { value: '1HZ100V', label: 'Volatility 100 (1s) Index' },
  { value: '1HZ75V', label: 'Volatility 75 (1s) Index' },
  { value: '1HZ50V', label: 'Volatility 50 (1s) Index' },
  { value: '1HZ25V', label: 'Volatility 25 (1s) Index' },
  { value: '1HZ10V', label: 'Volatility 10 (1s) Index' },
];

const CONTRACT_MODES: { value: ContractMode; label: string }[] = [
  { value: 'DIGITMATCH', label: 'Matches (DIGITMATCH)' },
  { value: 'DIGITDIFF', label: 'Differs (DIGITDIFF)' },
  { value: 'DIGITOVER', label: 'Over (DIGITOVER)' },
  { value: 'DIGITUNDER', label: 'Under (DIGITUNDER)' },
  { value: 'DIGITEVEN', label: 'Even (DIGITEVEN)' },
  { value: 'DIGITODD', label: 'Odd (DIGITODD)' },
];

export function MasterSignalControl() {
  const [symbol, setSymbol] = useState<string>('R_100');
  const [contractType, setContractType] = useState<ContractMode>('DIGITMATCH');
  const [selectedDigit, setSelectedDigit] = useState<number>(7);
  const [duration, setDuration] = useState<number>(5);
  const [recommendedStake, setRecommendedStake] = useState<string>('10');
  const [masterName, setMasterName] = useState<string>('Master Guide');
  const [note, setNote] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sentSignals, setSentSignals] = useState<TradeSignal[]>([]);

  const handleBroadcast = async () => {
    setIsSending(true);
    const selectedSymbolObj = SYMBOLS_LIST.find((s) => s.value === symbol);

    const newSignal: TradeSignal = {
      id: `sig_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: Date.now(),
      symbol,
      symbolDisplayName: selectedSymbolObj?.label || symbol,
      contractType,
      selectedDigit: Number(selectedDigit),
      duration: Number(duration) || 5,
      recommendedStake: parseFloat(recommendedStake) || 10,
      masterName: masterName || 'Master Guide',
      note: note.trim(),
    };

    try {
      const res = await sendSignalToNetwork(newSignal);
      if (res.success) {
        setSentSignals((prev) => [newSignal, ...prev]);
        toast.success(`🚀 Signal Broadcasted Successfully!`, {
          description: `Sent ${newSignal.contractType} on ${newSignal.symbolDisplayName} to all follower clients.`,
        });
        setNote('');
      } else {
        toast.error(`Broadcast failed: ${res.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      toast.error(`Broadcast error: ${err?.message || 'Server error'}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="border-border bg-card/90 shadow-xl">
      <CardHeader className="py-3 px-4 border-b border-border">
        <CardTitle className="text-sm font-mono font-bold uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-2">
            📡 Master Signal Broadcaster
          </span>
          <span className="text-xs font-normal text-muted-foreground">
            {sentSignals.length} Signals Dispatched
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 space-y-4 font-mono text-xs">
        {/* Master Guide Name */}
        <div className="space-y-1">
          <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Guide / Master Name</label>
          <Input
            value={masterName}
            onChange={(e) => setMasterName(e.target.value)}
            placeholder="e.g. Master Trader"
            className="font-mono text-xs bg-background border-border"
          />
        </div>

        {/* Symbol & Contract Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Synthetic Index</label>
            <Select value={symbol} onValueChange={setSymbol}>
              <SelectTrigger className="font-mono text-xs bg-background border-border">
                <SelectValue placeholder="Select Symbol" />
              </SelectTrigger>
              <SelectContent>
                {SYMBOLS_LIST.map((s) => (
                  <SelectItem key={s.value} value={s.value} className="font-mono text-xs">
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Contract Type</label>
            <Select value={contractType} onValueChange={(val) => setContractType(val as ContractMode)}>
              <SelectTrigger className="font-mono text-xs bg-background border-border">
                <SelectValue placeholder="Select Contract" />
              </SelectTrigger>
              <SelectContent>
                {CONTRACT_MODES.map((c) => (
                  <SelectItem key={c.value} value={c.value} className="font-mono text-xs">
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Digit Selection & Duration & Stake */}
        <div className="grid grid-cols-3 gap-3">
          {contractType !== 'DIGITEVEN' && contractType !== 'DIGITODD' && (
            <div className="space-y-1">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Target Digit</label>
              <Select
                value={String(selectedDigit)}
                onValueChange={(val) => setSelectedDigit(Number(val))}
              >
                <SelectTrigger className="font-mono text-xs bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                    <SelectItem key={d} value={String(d)} className="font-mono text-xs">
                      Digit {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Ticks</label>
            <Input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              min="1"
              max="10"
              className="font-mono text-xs text-center bg-background border-border"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Rec. Stake ($)</label>
            <Input
              type="number"
              value={recommendedStake}
              onChange={(e) => setRecommendedStake(e.target.value)}
              min="1"
              className="font-mono text-xs text-right bg-background border-border"
            />
          </div>
        </div>

        {/* Optional Commentary Note */}
        <div className="space-y-1">
          <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Optional Commentary / Note</label>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. High probability streak on digit 7"
            className="font-mono text-xs bg-background border-border"
          />
        </div>

        {/* Broadcast Action Button */}
        <Button
          onClick={handleBroadcast}
          disabled={isSending}
          className="w-full font-mono font-bold py-6 text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-950/40"
        >
          {isSending ? '⏳ Dispatching Signal...' : '🚀 BROADCAST SIGNAL TO ALL FOLLOWERS'}
        </Button>
      </CardContent>
    </Card>
  );
}
