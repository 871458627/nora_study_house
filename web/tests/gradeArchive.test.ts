// 本机年级归档（docs/12 v1.2）：封存/取走/单副本语义，storage 注入。
import { describe, expect, it } from 'vitest';
import {
  getGradeArchive,
  listGradeArchiveKeys,
  saveGradeArchive,
  sliceIsNonEmpty,
  takeGradeArchive,
} from '../src/core/gradeArchive';

function memoryStore(): { getItem(n: string): string | null; setItem(n: string, v: string): void } {
  const map = new Map<string, string>();
  return { getItem: (n) => map.get(n) ?? null, setItem: (n, v) => void map.set(n, v) };
}

const slice = {
  lessons: { 'cn-u1-l1': { status: 'reviewed', mastery: 1, attempts: 1, correct: 1 } },
  pointers: { chinese: 1, math: 0, english: 0 },
  mistakes: [{ questionId: 'q1', lessonId: 'cn-u1-l1', wrongAt: '2026-10-26' }],
  weakness: {},
  dictationQueue: {},
};

describe('本机年级归档', () => {
  it('封存 → 只读获取 → 取走删除（单副本）', () => {
    const store = memoryStore();
    saveGradeArchive('g2s1', slice, store);
    expect(listGradeArchiveKeys(store)).toEqual(['g2s1']);
    const got = getGradeArchive('g2s1', store);
    expect(got?.lessons).toEqual(slice.lessons);
    const taken = takeGradeArchive('g2s1', store);
    expect(taken?.lessons).toEqual(slice.lessons);
    expect(takeGradeArchive('g2s1', store)).toBeNull();
    expect(listGradeArchiveKeys(store)).toEqual([]);
  });

  it('同键再次封存覆写（保留最新）', () => {
    const store = memoryStore();
    saveGradeArchive('g2s1', slice, store);
    const updated = { ...slice, lessons: { 'cn-u1-l2': { status: 'mastered', mastery: 3, attempts: 5, correct: 5 } } };
    saveGradeArchive('g2s1', updated, store);
    expect(getGradeArchive('g2s1', store)?.lessons).toEqual(updated.lessons);
  });

  it('损坏的存储内容按空处理，不抛错', () => {
    const bad = { getItem: () => '{broken', setItem: () => {} };
    expect(listGradeArchiveKeys(bad)).toEqual([]);
    expect(getGradeArchive('g2s1', bad)).toBeNull();
  });

  it('sliceIsNonEmpty：lessons/mistakes/weakness 任一非空即为真', () => {
    expect(sliceIsNonEmpty(slice)).toBe(true);
    expect(sliceIsNonEmpty({ lessons: {}, pointers: {}, mistakes: [], weakness: {}, dictationQueue: {} })).toBe(false);
  });
});
