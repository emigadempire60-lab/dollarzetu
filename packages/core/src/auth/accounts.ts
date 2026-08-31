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
 * The REST /accounts endpoint may only return platform-specific (e.g. demo) accounts.
 * We augment the list by also calling the Deriv WebSocket authorize API which
 * returns ALL linked accounts (real + demo) for the authenticated user.
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
  const restAccounts: DerivAccount[] = data.data ?? [];

  // Augment with all linked accounts via Deriv WebSocket authorize
  const allAccounts = await fetchAllAccountsViaWS(authInfo.access_token, clientId, restAccounts);

  storeDerivAccounts(allAccounts);

  if (allAccounts.length > 0) {
    const firstAccount = allAccounts[0];
    setActiveLoginId(firstAccount.account_id);
    setAccountType(firstAccount.account_type);
  }

  return allAccounts;
}

/**
 * Use the Deriv WebSocket authorize call to get all linked accounts (real + demo).
 * Merges with any accounts already known from the REST API (preserving balances etc.).
 */
async function fetchAllAccountsViaWS(
  accessToken: string,
  clientId: string,
  knownAccounts: DerivAccount[]
): Promise<DerivAccount[]> {
  return new Promise((resolve) => {
    const cleanClientId = clientId.trim().replace(/[\r\n]+/g, '');
    // Use the public Deriv WS endpoint
    const wsUrl = `wss://ws.derivws.com/websockets/v3?app_id=${cleanClientId}`;
    let ws: WebSocket;

    const timeout = setTimeout(() => {
      // On timeout fall back to REST-only accounts
      try { ws?.close(); } catch { /* ignore */ }
      resolve(knownAccounts);
    }, 8000);

    try {
      ws = new WebSocket(wsUrl);
    } catch {
      clearTimeout(timeout);
      resolve(knownAccounts);
      return;
    }

    ws.onopen = () => {
      ws.send(JSON.stringify({ authorize: accessToken }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string);
        if (msg.msg_type !== 'authorize' || msg.error) {
          clearTimeout(timeout);
          ws.close();
          resolve(knownAccounts);
          return;
        }

        const authorize = msg.authorize;
        // authorize.account_list contains all linked accounts
        const accountList: Array<{
          loginid: string;
          is_virtual: number;
          currency: string;
          balance?: number;
        }> = authorize.account_list ?? [];

        if (accountList.length === 0) {
          clearTimeout(timeout);
          ws.close();
          resolve(knownAccounts);
          return;
        }

        // Build merged accounts list
        const knownMap = new Map(knownAccounts.map(a => [a.account_id, a]));
        const merged: DerivAccount[] = accountList.map(a => {
          const existing = knownMap.get(a.loginid);
          return existing ?? {
            account_id: a.loginid,
            account_type: a.is_virtual === 1 ? 'demo' : 'real',
            currency: (a.currency ?? 'USD').toUpperCase(),
            balance: String(a.balance ?? '0'),
            group: '',
            status: 'active',
          };
        });

        clearTimeout(timeout);
        ws.close();
        resolve(merged);
      } catch {
        clearTimeout(timeout);
        ws.close();
        resolve(knownAccounts);
      }
    };

    ws.onerror = () => {
      clearTimeout(timeout);
      resolve(knownAccounts);
    };
  });
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
