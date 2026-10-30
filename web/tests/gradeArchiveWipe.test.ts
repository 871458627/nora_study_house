// 退出换账号 · 年级归档清理（缺陷清单 H2 回归）：
// 归档键 xiaotao-grade-archives-v1 不分家庭，wipe 不清的话下一账号在同机
// 走本机切换通道会直接恢复上一家庭的进度——恰是换账号功能要防的串号。
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { clearGradeArchives, saveGradeArchive, takeGradeArchive } from '../src/core/gradeArchive';

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
  };
}

const SLICE = {
  lessons: { 'cn-u1-l1': { status: 'reviewed', mastery: 1, attempts: 2, correct: 2 } },
  pointers: { chinese: 1, math: 0, english: 0 },
  mistakes: [{ questionId: 'q1', lessonId: 'cn-u1-l1', wrongAt: '2026-10-25' }],
  weakness: { p1: { wrong: 1, right: 1 } },
  dictationQueue: {},
};

let original: PropertyDescriptor | undefined;

beforeEach(() => {
  original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: makeStorageStub(),
  });
});

afterEach(() => {
  if (original) Object.defineProperty(globalThis, 'localStorage', original);
  else delete (globalThis as Record<string, unknown>).localStorage;
});

describe('wipe 清空年级归档（缺陷清单 H2）', () => {
  it('家庭 A 封存的归档，clearGradeArchives 后家庭 B 读不到', () => {
    saveGradeArchive('g2s1', SLICE);
    expect(takeGradeArchive('g2s1')).not.toBeNull(); // 归档在

    // 模拟 wipe：saveGradeArchive 重新写入后清空
    saveGradeArchive('g2s1', SLICE);
    clearGradeArchives();
    expect(takeGradeArchive('g2s1')).toBeNull();
  });

  it('清空后本机切换通道走「全新开始」，不会恢复上一家庭进度', () => {
    saveGradeArchive('g3s1', SLICE);
    clearGradeArchives();
    expect(takeGradeArchive('g3s1')).toBeNull();
    expect(listGradeArchiveKeysIfAny()).toEqual([]);
  });
});

function listGradeArchiveKeysIfAny(): string[] {
  const raw = globalThis.localStorage?.getItem('xiaotao-grade-archives-v1');
  if (!raw) return [];
  return Object.keys(JSON.parse(raw) as Record<string, unknown>);
}
