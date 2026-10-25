import { describe, expect, it } from 'vitest';
import { chineseLessons } from '../src/data/content/chinese';
import { createInitialState, normalizeState } from '../src/core/model';
import { applyFreeDictation } from '../src/core/progress';

const lesson = chineseLessons[0];
const word = lesson.dictation![0];
const date = '2026-10-23';

describe('free dictation review', () => {
  it('updates the due queue and the free ledger without rewards', () => {
    const base = {
      ...createInitialState(),
      dictationQueue: {
        [word.id]: { wordId: word.id, wrong: 1, correct: 0, dueAt: '2026-10-22' },
      },
    };
    const next = applyFreeDictation(base, date, [{ wordId: word.id, correct: true }]);
    expect(next.dictationQueue[word.id]?.correct).toBe(1);
    expect(next.dictationQueue[word.id]?.dueAt).toBe('2026-10-26');
    expect(next.freeLogs[date]).toEqual({
      sessions: 1,
      questions: 0,
      correct: 0,
      dictationTotal: 1,
      dictationCorrect: 1,
    });
    expect(next.rewards.stars).toBe(0);
    expect(next.dailyLogs[date]).toBeUndefined();
    expect(normalizeState(JSON.parse(JSON.stringify(next)))?.freeLogs[date]?.dictationCorrect).toBe(1);
  });

  it('does nothing for an empty review', () => {
    const base = createInitialState();
    expect(applyFreeDictation(base, date, [])).toBe(base);
  });
});
