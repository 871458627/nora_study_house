import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { clearLocalData } from '../src/core/storage';
import { clearOutbox } from '../src/app/securityEvents';
import { clearSession } from '../src/app/auth';

// 换账号清本机（2026-10-25）：退出登录选「清空本机数据」时，
// 学习数据缓存、设备态（PIN + 同步簿记）、审计队列、登录显示名
// 必须全部移除——否则下一账号登录会把上一家庭的数据推进自己的云端。
// node 环境没有 localStorage，这里用内存桩模拟真实键值行为。

type Store = Record<string, string>;

function makeStorageStub() {
  const store: Store = {};
  return {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => {
      store[k] = String(v);
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      Object.keys(store).forEach(k => delete store[k]);
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  };
}

const KEYS = {
  cache: 'xiaotao-sync-cache-v2',
  device: 'xiaotao-device-v2',
  outbox: 'xiaotao-security-events-outbox-v1',
  account: 'xiaotao-account-v1',
};

describe('换账号清本机 · 清理组合', () => {
  let original: PropertyDescriptor | undefined;

  beforeEach(() => {
    original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: makeStorageStub(),
    });
    globalThis.localStorage.setItem(KEYS.cache, '{"schemaVersion":1}');
    globalThis.localStorage.setItem(KEYS.device, '{"version":2}');
    globalThis.localStorage.setItem(KEYS.outbox, '[]');
    globalThis.localStorage.setItem(
      KEYS.account,
      JSON.stringify({ id: 'a1', username: 'family-a' }),
    );
  });

  afterEach(() => {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else delete (globalThis as Record<string, unknown>).localStorage;
  });

  it('clearLocalData 移除学习数据缓存与设备态（PIN/同步簿记一并重置）', () => {
    clearLocalData();
    expect(globalThis.localStorage.getItem(KEYS.cache)).toBeNull();
    expect(globalThis.localStorage.getItem(KEYS.device)).toBeNull();
  });

  it('clearOutbox 清空审计队列（上一家庭的事件不能带给下一账号）', () => {
    globalThis.localStorage.setItem(KEYS.outbox, '[{"type":"pin-reset"}]');
    clearOutbox();
    expect(globalThis.localStorage.getItem(KEYS.outbox)).toBeNull();
  });

  it('clearSession 清空内存 token 与登录显示名', () => {
    expect(globalThis.localStorage.getItem(KEYS.account)).not.toBeNull();
    clearSession();
    expect(globalThis.localStorage.getItem(KEYS.account)).toBeNull();
  });

  it('三项清理组合后，本机不再残留任何上一账号痕迹', () => {
    clearOutbox();
    clearLocalData();
    clearSession();
    const remain = [KEYS.cache, KEYS.device, KEYS.outbox, KEYS.account].filter(
      k => globalThis.localStorage.getItem(k) !== null,
    );
    expect(remain, '所有账号相关键都应被移除').toEqual([]);
  });
});
