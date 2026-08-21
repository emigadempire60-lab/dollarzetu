declare const process: { env: Record<string, string | undefined> };

type DerivEnv = 'production' | 'preview';

function getEnv(): DerivEnv {
  if (typeof globalThis !== 'undefined' && typeof process !== 'undefined') {
    const env = process.env.NEXT_PUBLIC_DERIV_ENV;
    if (env === 'preview') return 'preview';
  }
  return 'production';
}

const URLS = {
  production: {
    authBase: 'https://oauth.deriv.com/oauth2',
    apiBase: 'https://api.derivws.com/trading/v1/options',
    publicWs: 'wss://api.derivws.com/trading/v1/options/ws/public',
    appBuilder: 'https://developers.deriv.com',
  },
  preview: {
    authBase: 'https://staging-oauth.deriv.com/oauth2',
    apiBase: 'https://staging-api.derivws.com/trading/v1/options',
    publicWs: 'wss://staging-api.derivws.com/trading/v1/options/ws/public',
    appBuilder: 'https://staging-developers.deriv.com',
  },
} as const;

export function getAuthBaseUrl(): string {
  return URLS[getEnv()].authBase;
}

export function getApiBaseUrl(): string {
  return URLS[getEnv()].apiBase;
}

export function getPublicWsUrl(): string {
  const envAppId = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_DERIV_APP_ID : null;
  const appId = (envAppId && /^\d+$/.test(envAppId.trim())) ? envAppId.trim() : '1089';
  return `wss://ws.derivws.com/websockets/v3?app_id=${appId}`;
}

/**
 * Base URL of the app-builder BFF (deriv-api-v2). Used to call its runtime
 * affiliate-resolution proxy. Derived from NEXT_PUBLIC_DERIV_ENV so no extra
 * env var is needed in the assembled app.
 */
export function getAppBuilderBaseUrl(): string {
  return URLS[getEnv()].appBuilder;
}
