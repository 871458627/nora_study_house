import { describe, expect, it } from 'vitest';
import { createInitialState } from '../src/core/model';
import { emptyDevice, inspectBackup, summarizeBackup, withoutDevicePin } from '../src/core/storage';

function sampleState() {
  return {
    ...createInitialState(),
    onboarded: true,
    profile: { nickname: '桃桃' },
    rewards: {
      ...createInitialState().rewards,
      stars: 42,
      food: 7,
      streak: 4,
    },
    pet: {
      ...createInitialState().pet,
      stage: 1 as const,
      fedDays: 16,
    },
    lessons: {
      'cn-u1-l1': { status: 'reviewed' as const, mastery: 2, attempts: 1, correct: 3 },
      'ma-u1-l1': { status: 'mastered' as const, mastery: 3, attempts: 2, correct: 6 },
    },
    dailyLogs: {
      '2026-10-21': {
        planned: 4,
        done: ['a', 'b', 'c'],
        minutes: 25,
        stars: 3,
        food: 4,
        dictationTotal: 5,
        dictationCorrect: 4,
        allDone: false,
      },
      '2026-10-22': {
        planned: 4,
        done: ['d'],
        minutes: 10,
        stars: 1,
        food: 1,
        dictationTotal: 0,
        dictationCorrect: 0,
        allDone: false,
      },
    },
    freeLogs: {
      '2026-10-22': {
        sessions: 2,
        questions: 9,
        correct: 6,
        dictationTotal: 5,
        dictationCorrect: 4,
      },
    },
  };
}

describe('inspectBackup', () => {
  it('reads the export time and state from a backup wrapper', () => {
    const inspected = inspectBackup(
      JSON.stringify({
        app: 'xiaotao-study-house',
        version: 2,
        exportedAt: '2026-10-20T08:30:00.000Z',
        state: sampleState(),
      }),
    );
    expect(inspected?.exportedAt).toBe('2026-10-20T08:30:00.000Z');
    expect(inspected?.state.profile.nickname).toBe('桃桃');
    expect(inspected?.state.rewards.stars).toBe(42);
  });

  it('accepts a raw state document without an export time', () => {
    const inspected = inspectBackup(JSON.stringify(sampleState()));
    expect(inspected).not.toBeNull();
    expect(inspected?.exportedAt).toBeUndefined();
    expect(inspected?.state.rewards.food).toBe(7);
  });

  it('rejects malformed or unrelated files', () => {
    expect(inspectBackup('not json')).toBeNull();
    expect(inspectBackup('null')).toBeNull();
    expect(inspectBackup(JSON.stringify({ hello: 'world' }))).toBeNull();
    expect(
      inspectBackup(JSON.stringify({ state: { ...sampleState(), schemaVersion: 99 } })),
    ).toBeNull();
  });
});

describe('summarizeBackup', () => {
  it('counts completed items, rewards and pet progress from the backup', () => {
    expect(summarizeBackup(sampleState())).toEqual({
      done: 4,
      stars: 42,
      food: 7,
      streak: 4,
      petStage: 1,
      petFedDays: 16,
      lessonCount: 2,
    });
  });
});

describe('withoutDevicePin', () => {
  it('clears the PIN and lockout but keeps sync revision and dirty work', () => {
    const device = {
      ...emptyDevice(),
      pinHash: 'old-hash',
      pinSalt: 'old-salt',
      failures: { count: 3 },
      revision: 12,
      dirty: true,
    };
    expect(withoutDevicePin(device)).toEqual({
      ...emptyDevice(),
      revision: 12,
      dirty: true,
    });
  });
});
