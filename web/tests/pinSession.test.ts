import { describe, expect, it } from 'vitest';
import {
  PIN_UNLOCK_KEY,
  clearPinUnlock,
  isPinUnlocked,
  pinUnlockRemainingSeconds,
  pinUnlockStore,
  rememberPinUnlock,
  type KvStore,
} from '../src/core/pinSession';

function memoryStore(initial: Record<string, string> = {}): KvStore {
  const data = new Map(Object.entries(initial));
  return {
    getItem: key => (data.has(key) ? (data.get(key) as string) : null),
    setItem: (key, value) => void data.set(key, value),
    removeItem: key => void data.delete(key),
  };
}

describe('共享家长解锁', () => {
  it('解锁后 10 分钟内保持有效，超时自动失效', () => {
    const store = memoryStore();
    const now = new Date('2026-10-22T09:00:00.000Z').getTime();
    expect(isPinUnlocked(store, now)).toBe(false);

    rememberPinUnlock(store, now);
    expect(isPinUnlocked(store, now + 9 * 60_000)).toBe(true);
    expect(pinUnlockRemainingSeconds(store, now + 9 * 60_000)).toBe(60);
    expect(isPinUnlocked(store, now + 11 * 60_000)).toBe(false);
    expect(store.getItem(PIN_UNLOCK_KEY)).toBeNull();
  });

  it('清除 PIN 或损坏的值都会让解锁失效', () => {
    const store = memoryStore();
    const now = Date.now();
    rememberPinUnlock(store, now);
    clearPinUnlock(store);
    expect(isPinUnlocked(store, now)).toBe(false);

    store.setItem(PIN_UNLOCK_KEY, 'not-a-number');
    expect(isPinUnlocked(store, now)).toBe(false);
    expect(store.getItem(PIN_UNLOCK_KEY)).toBeNull();
  });

  it('没有 sessionStorage 时退回内存存储，不会抛错', () => {
    const store = pinUnlockStore();
    store.setItem('probe', '1');
    expect(store.getItem('probe')).toBe('1');
    store.removeItem('probe');
    expect(store.getItem('probe')).toBeNull();
  });
});
