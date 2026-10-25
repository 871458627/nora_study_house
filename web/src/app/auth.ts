/**
 * Parent-account auth against the self-hosted API (docs/02 §3.1).
 * The access token lives in memory only: it is never written to
 * localStorage, sessionStorage, SyncState or backups (docs/02 §5.3).
 * All auth side effects stay in this app-layer module so core/ stays pure.
 */

export interface AuthAccount {
  id: string;
  username: string;
}

export interface AuthSession {
  account: AuthAccount | null;
  familyId: string;
  accessToken: string;
}

export class AuthError extends Error {
  code: string;
  status: number;

  constructor(code: string, status = 0) {
    super(code);
    this.name = 'AuthError';
    this.code = code;
    this.status = status;
  }
}

/** Remembered username for display only — never holds a token. */
const ACCOUNT_KEY = 'xiaotao-account-v1';

let accessToken: string | null = null;
let account: AuthAccount | null = null;

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function readStoredAccount(): AuthAccount | null {
  try {
    const raw = storage()?.getItem(ACCOUNT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || parsed === null) return null;
    const record = parsed as Record<string, unknown>;
    if (typeof record.id !== 'string' || typeof record.username !== 'string') return null;
    return { id: record.id, username: record.username };
  } catch {
    return null;
  }
}

function rememberAccount(next: AuthAccount | null): void {
  account = next;
  const store = storage();
  if (!store) return;
  try {
    if (!next) store.removeItem(ACCOUNT_KEY);
    else store.setItem(ACCOUNT_KEY, JSON.stringify(next));
  } catch {
    // Private-browsing mode: the session then only lives in memory.
  }
}

account = readStoredAccount();

export function getAccessToken(): string | null {
  return accessToken;
}

export function currentAccount(): AuthAccount | null {
  return account;
}

export function clearSession(): void {
  accessToken = null;
  rememberAccount(null);
}

interface AuthPayload {
  ok?: boolean;
  account?: { id?: unknown; username?: unknown };
  familyId?: unknown;
  accessToken?: unknown;
  error?: { code?: unknown };
}

async function authRequest(path: string, body?: unknown): Promise<AuthPayload> {
  const hasBody = body !== undefined;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  let response: Response;
  try {
    response = await fetch(path, {
      method: 'POST',
      credentials: 'same-origin',
      signal: controller.signal,
      headers: {
        ...(hasBody ? { 'content-type': 'application/json' } : {}),
        accept: 'application/json',
      },
      ...(hasBody ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new AuthError('offline', 0);
  } finally {
    clearTimeout(timer);
  }
  let payload: AuthPayload | null = null;
  try {
    payload = (await response.json()) as AuthPayload;
  } catch {
    payload = null;
  }
  if (!response.ok || !payload?.ok) {
    const code =
      payload && typeof payload.error === 'object' && typeof payload.error?.code === 'string'
        ? payload.error.code
        : response.status === 429
          ? 'rate_limited'
          : 'auth_failed';
    throw new AuthError(code, response.status);
  }
  return payload;
}

function adoptPayload(payload: AuthPayload): AuthSession {
  if (typeof payload.accessToken !== 'string' || typeof payload.familyId !== 'string') {
    throw new AuthError('invalid_response', 0);
  }
  accessToken = payload.accessToken;
  const raw = payload.account;
  if (
    typeof raw === 'object' &&
    raw !== null &&
    typeof raw.id === 'string' &&
    typeof raw.username === 'string'
  ) {
    rememberAccount({ id: raw.id, username: raw.username });
  }
  return { account, familyId: payload.familyId, accessToken: payload.accessToken };
}

export async function register(username: string, password: string): Promise<AuthSession> {
  return adoptPayload(await authRequest('/api/v1/auth/register', { username, password }));
}

export async function login(username: string, password: string): Promise<AuthSession> {
  return adoptPayload(await authRequest('/api/v1/auth/login', { username, password }));
}

/** Silent renewal via the httpOnly refresh cookie; no request body (docs/02 §3.1). */
export async function refreshSession(): Promise<AuthSession> {
  return adoptPayload(await authRequest('/api/v1/auth/refresh'));
}

/**
 * Best-effort revoke of the refresh cookie (logout endpoint to be provided
 * by the v2 backend); local session state is cleared regardless of outcome.
 */
export async function logout(): Promise<void> {
  try {
    await authRequest('/api/v1/auth/logout');
  } catch {
    // Offline or endpoint not implemented yet: still drop the local session.
  }
  clearSession();
}
