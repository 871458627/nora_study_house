// 短文阅读录入（docs/06 §3.13）：reading-practice 动作计入 freeLogs
// （自由练习口径：记录 sessions/questions/correct，不给星星）。
import { describe, expect, it } from 'vitest';
import { appReducer, initialState } from '../src/core/state';

describe('reading-practice 录入', () => {
  it('计入 freeLogs 的 sessions/questions/correct', () => {
    const next = appReducer(initialState(), {
      type: 'reading-practice',
      date: '2026-10-30',
      correct: 1,
      total: 2,
    });
    const log = next.freeLogs['2026-10-30'];
    expect(log.sessions).toBe(1);
    expect(log.questions).toBe(2);
    expect(log.correct).toBe(1);
    expect(next.rewards.stars).toBe(0); // 自由练习口径：不给星星
  });

  it('数值越界被夹紧（0-10）', () => {
    const next = appReducer(initialState(), {
      type: 'reading-practice',
      date: '2026-10-30',
      correct: 99,
      total: -5,
    });
    const log = next.freeLogs['2026-10-30'];
    expect(log.correct).toBe(10); // 夹紧到上限
    expect(log.questions).toBe(0); // 夹紧到下限
  });
});
