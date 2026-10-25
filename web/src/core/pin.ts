export interface PinFailures {
  count: number;
  lockedUntil?: string;
}

export const MAX_PIN_FAILURES = 5;
export const LOCK_MINUTES = 5;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function randomSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

export async function hashPin(pin: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${pin}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return bytesToHex(new Uint8Array(digest));
}

export async function createPinHash(pin: string): Promise<{ pinHash: string; pinSalt: string }> {
  const pinSalt = randomSalt();
  const pinHash = await hashPin(pin, pinSalt);
  return { pinHash, pinSalt };
}

export async function verifyPin(pin: string, pinHash: string, pinSalt: string): Promise<boolean> {
  const candidate = await hashPin(pin, pinSalt);
  return candidate === pinHash;
}

export function isPinLocked(failures: PinFailures, now = new Date()): boolean {
  if (!failures.lockedUntil) return false;
  return new Date(failures.lockedUntil).getTime() > now.getTime();
}

export function failedAttempt(failures: PinFailures, now = new Date()): PinFailures {
  if (isPinLocked(failures, now)) return failures;
  const count = failures.count + 1;
  if (count >= MAX_PIN_FAILURES) {
    return {
      count: 0,
      lockedUntil: new Date(now.getTime() + LOCK_MINUTES * 60_000).toISOString(),
    };
  }
  return { count, lockedUntil: undefined };
}

export function lockRemainingMinutes(failures: PinFailures, now = new Date()): number {
  if (!failures.lockedUntil) return 0;
  const remaining = new Date(failures.lockedUntil).getTime() - now.getTime();
  return Math.max(0, Math.ceil(remaining / 60_000));
}

export function isValidPin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

export const PIN_KEY = 'xiaotao-device-v2';
export const CACHE_KEY = 'xiaotao-sync-cache-v2';
