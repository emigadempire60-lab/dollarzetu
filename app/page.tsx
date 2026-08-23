'use client';

import { useCallback } from 'react';
import { useDigitsTrading } from '../hooks/use-digits-trading';
import { useDerivWSContext } from '@/components/custom/deriv-ws-provider';
import { useLogoSrc } from '@/components/custom/logo-src-provider';
import { DigitsView } from '../components/digits-view';
import { useSignalReceiver } from '@/hooks/use-signal-receiver';
import { SignalReceiverWidget } from '@/components/signal-receiver-widget';
import type { TradeSignal } from '@/lib/signals';

export default function DigitsPage() {
  const logoSrc = useLogoSrc();
  const { ws, isConnected, isExhausted, auth } = useDerivWSContext();
  const { authState, accounts, activeAccount, login, loginWithToken, signUp, logout, switchAccount } = auth;

  const trading = useDigitsTrading({ ws, isConnected, isExhausted, isAuthenticated: !!auth.wsUrl, onAuthWSFailed: logout });

  // Handle incoming trade signal execution
  const handleExecuteSignal = useCallback(
    async (signal: TradeSignal, customStake?: number) => {
      if (signal.symbol) {
        trading.selectSymbol(signal.symbol);
      }

      if (signal.contractType) {
        if (['DIGITMATCH', 'DIGITDIFF'].includes(signal.contractType)) {
          trading.setTradeType('matches-differs');
        } else if (['DIGITOVER', 'DIGITUNDER'].includes(signal.contractType)) {
          trading.setTradeType('over-under');
        } else if (['DIGITEVEN', 'DIGITODD'].includes(signal.contractType)) {
          trading.setTradeType('even-odd');
        }
        trading.setContractMode(signal.contractType);
      }

      if (typeof signal.selectedDigit === 'number') {
        trading.setSelectedDigit(signal.selectedDigit);
      }

      if (signal.duration) {
        trading.setDuration(signal.duration);
      }

      const stakeVal = customStake || signal.recommendedStake;
      if (stakeVal) {
        trading.setStake(String(stakeVal));
      }

      // Small tick delay to allow proposal params state update
      await new Promise((resolve) => setTimeout(resolve, 350));
      await trading.buyContract();
    },
    [trading]
  );

  const signalReceiver = useSignalReceiver({
    onExecuteSignal: handleExecuteSignal,
    isAuthenticated: authState === 'authenticated',
  });

  return (
    <DigitsView
      authState={authState}
      accounts={accounts}
      activeAccount={activeAccount}
      onLogin={async (tok) => (tok ? loginWithToken(tok) : login())}
      onSignUp={signUp}
      onLogout={logout}
      onSwitchAccount={switchAccount}
      logoSrc={logoSrc}
      isConnected={trading.isConnected}
      isLoading={trading.isLoading}
      error={trading.error}
      symbols={trading.symbols}
      activeSymbol={trading.activeSymbol}
      selectSymbol={trading.selectSymbol}
      currentTick={trading.currentTick}
      lastDigit={trading.lastDigit}
      digitStats={trading.digitStats}
      pipSize={trading.pipSize}
      tickWindow={trading.tickWindow}
      setTickWindow={trading.setTickWindow}
      openPositions={trading.openPositions}
      sellContract={trading.sellContract}
      sellingId={trading.sellingId}
      tradeType={trading.tradeType}
      setTradeType={trading.setTradeType}
      contractMode={trading.contractMode}
      setContractMode={trading.setContractMode}
      selectedDigit={trading.selectedDigit}
      setSelectedDigit={trading.setSelectedDigit}
      stake={trading.stake}
      setStake={trading.setStake}
      duration={trading.duration}
      setDuration={trading.setDuration}
      durationLimits={trading.durationLimits}
      proposal={trading.proposal}
      isProposalLoading={trading.isProposalLoading}
      buyContract={trading.buyContract}
      isBuying={trading.isBuying}
      buyResult={trading.buyResult}
      buyError={trading.buyError}
      clearBuyResult={trading.clearBuyResult}
      signalWidget={
        <SignalReceiverWidget
          signals={signalReceiver.signals}
          isAutoTrade={signalReceiver.isAutoTrade}
          onToggleAutoTrade={signalReceiver.toggleAutoTrade}
          followerStake={signalReceiver.followerStake}
          onUpdateFollowerStake={signalReceiver.updateFollowerStake}
          isConnectedToFeed={signalReceiver.isConnectedToFeed}
          onManualCopy={(sig) => handleExecuteSignal(sig, parseFloat(signalReceiver.followerStake))}
          isAuthenticated={authState === 'authenticated'}
        />
      }
    />
  );
}
