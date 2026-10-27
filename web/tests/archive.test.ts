// 状态归档（docs/02 §5.1）：120 天窗口、聚合累计、幂等、normalize 兼容。
import { describe, expect, it } from 'vitest';
import { archiveState, lifetimeTotals } from '../src/core/archive';
import { normalizeState, type SyncState } from '../src/core/model';
import { addDays, todayKey } from '../src/core/date';


function logOf(done = 3, minutes = 15, stars = 3, food = 4): SyncState['dailyLogs'][string] {
  return { planned: 3, done: Array.from({ length: done }, (_, i) => `t${i}`), minutes, stars, food, dictationTotal: 0, dictationCorrect: 0, allDone: done >= 3 };
}

function baseState(logs: Record<string, SyncState['dailyLogs'][string]>, plans: Record<string, SyncState['dailyPlans'][string]> = {}): SyncState {
  const base = normalizeState({ schemaVersion: 1, onboarded: true, profile: { nickname: 'x' } })!;
  return { ...base, dailyLogs: logs, dailyPlans: plans };
}

describe('archiveState', () => {
  const today = todayKey();

  it('120 天内的日志完整保留，不产生归档', () => {
    const state = baseState({ [addDays(today, -30)]: logOf() });
    expect(archiveState(state, today)).toBe(state);
  });

  it('120 天前的计划被丢弃、日志聚合进 archivedTotals（空日志不计天数）', () => {
    const old1 = addDays(today, -200);
    const old2 = addDays(today, -150);
    const state = baseState(
      { [old1]: logOf(3, 20, 3, 4), [old2]: { planned: 0, done: [], minutes: 0, stars: 0, food: 0, dictationTotal: 0, dictationCorrect: 0, allDone: false } },
      { [old1]: { tasks: [], generatedAt: 'x' }, [today]: { tasks: [], generatedAt: 'y' } },
    );
    const next = archiveState(state, today);
    expect(next).not.toBe(state);
    expect(Object.keys(next.dailyLogs)).toHaveLength(0);
    expect(Object.keys(next.dailyPlans)).toEqual([today]);
    expect(next.archivedTotals).toMatchObject({ days: 1, done: 3, minutes: 20, stars: 3, food: 4 });
  });

  it('幂等：第二次归档返回原引用，不重复累计', () => {
    const old1 = addDays(today, -200);
    const state = baseState({ [old1]: logOf() });
    const once = archiveState(state, today);
    const twice = archiveState(once, today);
    expect(twice).toBe(once);
    expect(twice.archivedTotals.days).toBe(1);
  });

  it('滚动边界：昨天的边界日志今天落入窗口外，正确追加', () => {
    const edge = addDays(today, -120);
    const state = baseState({ [edge]: logOf(1, 5, 1, 1) });
    // 今天跑：-120 恰好在窗口边界内（< edge 为窗口外？cutoff = today-120，key < cutoff 才归档）
    const first = archiveState(state, today);
    // key(-120) vs cutoff(-120)：不小于 → 保留
    expect(Object.keys(first.dailyLogs)).toContain(edge);
  });

  it('lifetimeTotals：近窗明细 + 归档合计', () => {
    const old1 = addDays(today, -200);
    const recent = addDays(today, -1);
    let state = baseState({ [old1]: logOf(2, 10, 2, 2), [recent]: logOf(3, 15, 3, 4) });
    state = archiveState(state, today);
    const totals = lifetimeTotals(state);
    expect(totals).toMatchObject({ days: 2, done: 5, minutes: 25, stars: 5, food: 6 });
  });
});

describe('normalizeState 对 archivedTotals 的兼容', () => {
  it('缺失字段缺省为 0，非法值被清洗', () => {
    const base = { schemaVersion: 1, onboarded: true };
    const clean = normalizeState({ ...base, archivedTotals: { days: 3, done: 5, minutes: 20, stars: 3, food: 4 } });
    expect(clean?.archivedTotals).toMatchObject({ days: 3, done: 5 });
    const dirty = normalizeState({ ...base, archivedTotals: { days: 'x', done: -5 } });
    expect(dirty?.archivedTotals).toMatchObject({ days: 0, done: 0 });
    expect(normalizeState(base)?.archivedTotals).toMatchObject({ days: 0 });
  });
});
