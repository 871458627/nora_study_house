import { describe, expect, it } from 'vitest';
import { createPinHash, failedAttempt, isPinLocked, isValidPin, verifyPin } from '../src/core/pin';
import { normalizeState, createInitialState } from '../src/core/model';

describe('PIN', () => {
  it('hashes and verifies a four digit PIN', async () => {
    const { pinHash, pinSalt } = await createPinHash('1234');
    expect(pinHash).toHaveLength(64);
    expect(await verifyPin('1234', pinHash, pinSalt)).toBe(true);
    expect(await verifyPin('4321', pinHash, pinSalt)).toBe(false);
    expect(isValidPin('1234')).toBe(true);
    expect(isValidPin('123')).toBe(false);
    expect(isValidPin('12a4')).toBe(false);
  });

  it('locks after five failures', () => {
    let failures = { count: 0 };
    const now = new Date('2026-10-22T12:00:00Z');
    for (let index = 0; index < 4; index += 1) {
      failures = failedAttempt(failures, now);
    }
    expect(failures.count).toBe(4);
    failures = failedAttempt(failures, now);
    expect(isPinLocked(failures, now)).toBe(true);
    expect(isPinLocked(failures, new Date('2026-10-22T12:05:01Z'))).toBe(false);
  });
});

describe('normalizeState', () => {
  it('accepts a current document and rejects unknown versions', () => {
    const state = createInitialState();
    const normalized = normalizeState(JSON.parse(JSON.stringify(state)));
    expect(normalized?.schemaVersion).toBe(1);
    expect(normalizeState({ schemaVersion: 99 })).toBeNull();
    expect(normalizeState(null)).toBeNull();
    expect(normalizeState('nope')).toBeNull();
  });

  it('repairs a malformed timetable and strips unknown slots', () => {
    const state = createInitialState();
    const raw = {
      ...state,
      timetable: [[...state.timetable[0], 'music']],
    };
    const normalized = normalizeState(raw)!;
    expect(normalized.timetable).toHaveLength(7);
    expect(normalized.timetable[0]).toHaveLength(6);
    expect(normalized.timetable[1]).toEqual(state.timetable[1]);
  });

  it('fills missing fields with safe defaults', () => {
    const normalized = normalizeState({ schemaVersion: 1 })!;
    expect(normalized.settings.dailyMinutes).toBe(35);
    expect(normalized.rewards.stars).toBe(0);
    expect(normalized.profile.nickname).toBe('小朋友');
    expect(normalized.dailyPlans).toEqual({});
  });
});
