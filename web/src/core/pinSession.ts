/**
 * Parent PIN unlock is shared for one browser session (P2-07): after a parent
 * unlocks the weekly report, opening settings should not ask again. The unlock
 * lives in sessionStorage only — it expires after 10 minutes, disappears when
 * the tab closes, and is never synced to another device.
 */
export interface KvStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const PIN_UNLOCK_KEY = 'xiaotao-pin-unlock-until';
export const PIN_UNLOCK_MINUTES = 10;

/** Storage adapter that degrades to a no-op when sessionStorage is missing. */
export function pinUnlockStore(): KvStore {
  const fallback = new Map<string, string>();
  const host: KvStore = {
    getItem: key => fallback.get(key) ?? null,
    setItem: (key, value) => void fallback.set(key, value),
    removeItem: key => void fallback.delete(key),
  };
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) return window.sessionStorage;
  } catch {
    // Private mode or blocked storage: fall back to the in-memory store.
  }
  return host;
}

/** Timestamp (ms) until which the parent area stays unlocked, or null. */
export function pinUnlockUntil(store: KvStore): number | null {
  const raw = store.getItem(PIN_UNLOCK_KEY);
  if (!raw) return null;
  const until = Number(raw);
  if (!Number.isFinite(until) || until <= 0) {
    store.removeItem(PIN_UNLOCK_KEY);
    return null;
  }
  return until;
}

export function isPinUnlocked(store: KvStore, now = Date.now()): boolean {
  const until = pinUnlockUntil(store);
  if (until === null) return false;
  if (until <= now) {
    store.removeItem(PIN_UNLOCK_KEY);
    return false;
  }
  return true;
}

export function rememberPinUnlock(store: KvStore, now = Date.now(), minutes = PIN_UNLOCK_MINUTES): void {
  store.setItem(PIN_UNLOCK_KEY, String(now + minutes * 60_000));
}

export function clearPinUnlock(store: KvStore): void {
  store.removeItem(PIN_UNLOCK_KEY);
}

export function pinUnlockRemainingSeconds(store: KvStore, now = Date.now()): number {
  const until = pinUnlockUntil(store);
  if (until === null || until <= now) return 0;
  return Math.ceil((until - now) / 1000);
}
