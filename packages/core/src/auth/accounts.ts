import type { AuthInfo, DerivAccount, OTPResponse } from '../types';
import {
  storeDerivAccounts,
  setActiveLoginId,
  setAccountType,
  clearAllAuthData,
} from './storage';
import { getApiBaseUrl } from '../config/urls';

/**
 * Fetch the list of trading accounts for the authenticated user.
 */
export async function fetchAccounts(
  authInfo: AuthInfo,
  clientId: string
): Promise<DerivAccount[]> {
  const response = await fetch(`${getApiBaseUrl()}/accounts`, {
    headers: {
      Authorization: `Bearer ${authInfo.access_token}`,
      'Deriv-App-ID': clientId,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch accounts (${response.status})`);
  }

  const data = await response.json();

  // Debug: log the raw API response so we can see exactly what /accounts returns
  console.log('[DollarZetu] /accounts raw response:', JSON.stringify(data, null, 2));

  const accounts: DerivAccount[] = data.data ?? [];

  console.log('[DollarZetu] accounts count:', accounts.length, accounts.map(a => `${a.account_id}(${a.account_type})`));

  storeDerivAccounts(accounts);

  if (accounts.length > 0) {
    const firstAccount = accounts[0];
    setActiveLoginId(firstAccount.account_id);
    setAccountType(firstAccount.account_type);
  }

  return accounts;
}

/**
 * Get a one-time WebSocket URL for an authenticated session.
 */
export async function getWebSocketOTP(
  accountId: string,
  authInfo: AuthInfo,
  clientId: string
): Promise<string> {
  const cleanClientId = clientId.trim().replace(/[\r\n]+/g, '');
  const response = await fetch(`${getApiBaseUrl()}/accounts/${accountId}/otp`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authInfo.access_token}`,
      'Deriv-App-ID': cleanClientId,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get WebSocket OTP (${response.status})`);
  }

  const data: OTPResponse = await response.json();
  let wsUrl = data.data.url;
  if (wsUrl.startsWith('http')) {
    wsUrl = wsUrl.replace(/^http/, 'ws');
  }
  return wsUrl;
}

/**
 * Perform logout: clear all auth data.
 * Caller is responsible for closing any open WebSocket connections and resetting UI.
 */
export function logout(): void {
  clearAllAuthData();
}
