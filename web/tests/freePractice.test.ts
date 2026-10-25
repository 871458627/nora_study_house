import { describe, expect, it } from 'vitest';
import { chineseLessons } from '../src/data/content/chinese';
import { createInitialState, normalizeState, type TaskOutcome } from '../src/core/model';
import { applyFreePractice } from '../src/core/progress';

const lesson = chineseLessons[0];
const date = '2026-10-22';

function freeOutcome(partial: Partial<TaskOutcome> = {}): TaskOutcome {
  return {
    correct: 2,
    total: 3,
    weakness: [],
    wrongQuestionIds: [],
    dictation: [
      { wordId: lesson.dictation![0].id, correct: false },
      { wordId: lesson.dictation![1].id, correct: true },
    ],
    ...partial,
  };
}

describe('free practice ledger', () => {
  it('records sessions, questions and dictation without plan rewards', () => {
    const next = applyFreePractice(createInitialState(), date, lesson, freeOutcome());
    expect(next.freeLogs[date]).toEqual({
      sessions: 1,
      questions: 3,
      correct: 2,
      dictationTotal: 2,
      dictationCorrect: 1,
    });
    expect(next.rewards.stars).toBe(0);
    expect(next.dailyLogs[date]).toBeUndefined();
  });

  it('accumulates multiple free sessions on the same day', () => {
    const first = applyFreePractice(createInitialState(), date, lesson, freeOutcome());
    const second = applyFreePractice(
      first,
      date,
      lesson,
      freeOutcome({ correct: 3, total: 3, dictation: undefined }),
    );
    expect(second.freeLogs[date].sessions).toBe(2);
    expect(second.freeLogs[date].questions).toBe(6);
    expect(second.freeLogs[date].correct).toBe(5);
    expect(second.freeLogs[date].dictationTotal).toBe(2);
  });

  it('keeps the ledger through normalizeState', () => {
    const next = applyFreePractice(createInitialState(), date, lesson, freeOutcome());
    const normalized = normalizeState(JSON.parse(JSON.stringify(next)));
    expect(normalized?.freeLogs[date]?.sessions).toBe(1);
    expect(normalized?.freeLogs[date]?.dictationCorrect).toBe(1);
    expect(normalizeState({ schemaVersion: 1 })?.freeLogs).toEqual({});
  });
});
