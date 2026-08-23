'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Activity, Key } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useDerivWSContext } from './deriv-ws-provider';
import type { AuthState, DerivAccount } from '@deriv/core';

interface HeaderProps {
  authState: AuthState;
  accounts: DerivAccount[];
  activeAccount: DerivAccount | null;
  onLogin: (token?: string) => Promise<void>;
  onLogout: () => void;
  onSwitchAccount: (accountId: string) => Promise<void>;
  /** When provided, a Sign up button is rendered to the right of the Log in button. */
  onSignUp?: () => Promise<void>;
  /** Logo source URL or data URL. When omitted, a placeholder badge is shown until
   *  the user provides a logo via the app builder (passed as a data URL via PREVIEW_BRANDING). */
  logoSrc?: string;
  /** App name used to derive the fallback logo letter when no logoSrc is provided.
   *  Falls back to NEXT_PUBLIC_DERIV_APP_NAME env var, then 'Deriv Trading'. */
  appName?: string;
  /** Optional controls rendered to the left of the login/logout button (e.g. a theme toggle). */
  actions?: React.ReactNode;
}

function formatBalance(balance: number | string): string {
  const num = typeof balance === 'number' ? balance : parseFloat(balance);
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function AccountLabel({ type }: { type: 'demo' | 'real' }) {
  const isReal = type === 'real';
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider',
        isReal
          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
      )}
    >
      {type}
    </span>
  );
}

export function Header({
  authState,
  accounts,
  activeAccount,
  onLogin,
  onLogout,
  onSwitchAccount,
  onSignUp,
  logoSrc,
  appName,
  actions,
}: HeaderProps) {
  const { isConnected, isExhausted, balanceInfo, auth } = useDerivWSContext();
  const [logoError, setLogoError] = useState(false);
  const [accountSwitcherOpen, setAccountSwitcherOpen] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [tokenPopoverOpen, setTokenPopoverOpen] = useState(false);
  
  const logoLetter = (appName ?? process.env.NEXT_PUBLIC_DERIV_APP_NAME ?? 'Deriv Trading')
    .trim()
    .charAt(0)
    .toUpperCase() || 'D';
  
  const isAuthenticated = authState === 'authenticated';
  const isAuthenticating = authState === 'authenticating';

  // Use live balance if available from WebSocket, fallback to REST account balance
  const currentBalance = balanceInfo?.balance ?? (activeAccount ? Number(activeAccount.balance) : 0);
  const currentCurrency = balanceInfo?.currency ?? activeAccount?.currency ?? 'USD';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-3 sm:px-4 py-2.5 border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="flex items-center gap-3">
        {!logoSrc || logoError ? (
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-base shadow-sm">
            {logoLetter}
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoSrc}
            alt="App Logo"
            className="h-8 w-auto object-contain"
            onError={() => setLogoError(true)}
          />
        )}
        <div className="flex items-center gap-2">
          <h1 className="text-base font-bold tracking-tight text-foreground hidden sm:block">
            {process.env.NEXT_PUBLIC_DERIV_APP_NAME ?? 'Deriv Trading'}
          </h1>

          {/* Connection Status Pill */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted/40 border border-border text-[11px] font-mono">
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                isConnected
                  ? 'bg-emerald-500 animate-pulse'
                  : isExhausted
                  ? 'bg-rose-500'
                  : 'bg-amber-500 animate-ping'
              )}
            />
            <span className="text-muted-foreground font-medium">
              {isConnected ? 'LIVE' : isExhausted ? 'DISCONNECTED' : 'CONNECTING'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {actions}

        {/* Link to Admin / Monitor */}
        <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex text-xs font-mono text-muted-foreground hover:text-foreground">
          <Link href="/admin" className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-primary" />
            <span>Monitor</span>
          </Link>
        </Button>

        {isAuthenticated && activeAccount && (
          <Popover open={accountSwitcherOpen} onOpenChange={setAccountSwitcherOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg border border-border/80 bg-card/60 px-3 py-1.5 hover:bg-muted/50 transition-colors">
                <div className="text-left flex items-center gap-2">
                  <AccountLabel type={activeAccount.account_type} />
                  <p className="text-sm font-mono font-bold text-foreground">
                    {formatBalance(currentBalance)} <span className="text-xs font-normal text-muted-foreground">{currentCurrency}</span>
                  </p>
                </div>
                <svg
                  className={cn(
                    'w-3.5 h-3.5 text-muted-foreground transition-transform',
                    accountSwitcherOpen && 'rotate-180'
                  )}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-2 bg-card border-border">
              <div className="space-y-1">
                {accounts.map((account) => (
                  <button
                    key={account.account_id}
                    onClick={() => {
                      onSwitchAccount(account.account_id);
                      setAccountSwitcherOpen(false);
                    }}
                    className={cn(
                      'w-full text-left rounded-lg px-3 py-2.5 transition-colors flex items-center justify-between',
                      account.account_id === activeAccount.account_id
                        ? 'bg-primary/10 border border-primary/20'
                        : 'hover:bg-muted/50'
                    )}
                  >
                    <div>
                      <AccountLabel type={account.account_type} />
                      <p className="text-sm font-mono font-bold text-foreground mt-1">
                        {formatBalance(account.balance)} {account.currency}
                      </p>
                    </div>
                    {account.account_id === activeAccount.account_id && (
                      <span className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {isAuthenticated ? (
          <Button variant="outline" size="sm" onClick={onLogout} className="text-xs font-mono">
            Logout
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Popover open={tokenPopoverOpen} onOpenChange={setTokenPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs font-mono gap-1 text-muted-foreground hover:text-foreground">
                  <Key className="w-3.5 h-3.5" />
                  <span>API Token</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="end">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold leading-none">Connect with API Token</h4>
                  <p className="text-xs text-muted-foreground">
                    Paste your Deriv API Token (from Deriv Account Settings &gt; API Token) to connect your account instantly.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      placeholder="Paste token..."
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      className="text-xs font-mono h-8"
                    />
                    <Button
                      size="sm"
                      className="text-xs h-8"
                      disabled={!tokenInput.trim() || isAuthenticating}
                      onClick={async () => {
                        if (tokenInput.trim()) {
                          await onLogin(tokenInput.trim());
                          setTokenPopoverOpen(false);
                          setTokenInput('');
                        }
                      }}
                    >
                      Connect
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="sm" onClick={() => onLogin()} disabled={isAuthenticating} className="text-xs font-mono">
              {isAuthenticating ? 'Logging in...' : 'Log in'}
            </Button>
            {onSignUp && (
              <Button size="sm" onClick={onSignUp} disabled={isAuthenticating} className="text-xs font-mono font-bold bg-primary text-primary-foreground">
                Sign up
              </Button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
