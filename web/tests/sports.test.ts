/**
 * 运动打卡核心规则（docs/06 §3.11）：奖励结算（首打卡桃粮 / 达标星 / 每日
 * 星上限 / 连续 7 天大餐）、只增不扣、streak 推进与断签、自定义项目增删、
 * normalizeState 对旧数据（无 sports 字段）与畸形数据的安全归一。
 */
import { describe, expect, it } from 'vitest';
import { appReducer } from '../src/core/state';
import { createInitialState, normalizeState } from '../src/core/model';
import { SPORTS_DAILY_STAR_CAP, SPORTS_ITEMS } from '../src/data/sports';
import {
  findSportsItem,
  sportsCheckinDelta,
  sportsDayStatus,
  sportsMetCount,
} from '../src/core/sports';

const TODAY = '2026-10-25';
const [rope, run, situp, reach] = SPORTS_ITEMS;

function settled(sports: ReturnType<typeof createInitialState>['sports']) {
  return sports;
}

describe('运动打卡奖励结算', () => {
  it('当日首次打卡 +1 桃粮，达标 +1 星，streak 从 1 起', () => {
    const delta = sportsCheckinDelta(createInitialState().sports, TODAY, rope, 300);
    expect(delta).not.toBeNull();
    expect(delta!.foodGain).toBe(1);
    expect(delta!.starGain).toBe(1);
    expect(delta!.justMet).toBe(true);
    expect(delta!.sports.streak).toBe(1);
    expect(delta!.sports.bestStreak).toBe(1);
    expect(delta!.sports.lastCheckDate).toBe(TODAY);
    settled(delta!.sports);
  });

  it('未达标也发首打卡桃粮，但不发星', () => {
    const delta = sportsCheckinDelta(createInitialState().sports, TODAY, rope, 100);
    expect(delta!.foodGain).toBe(1);
    expect(delta!.starGain).toBe(0);
    expect(delta!.justMet).toBe(false);
  });

  it('同日多次打卡：不重复发首打卡桃粮，第二项达标再 +1 星，streak 不动', () => {
    let sports = createInitialState().sports;
    const first = sportsCheckinDelta(sports, TODAY, rope, 100)!;
    sports = first.sports;
    const second = sportsCheckinDelta(sports, TODAY, run, 15)!;
    expect(second.foodGain).toBe(0);
    expect(second.starGain).toBe(1);
    expect(second.sports.streak).toBe(1);
    expect(second.mealGain).toBe(0);
  });

  it(`每日星星上限 ${SPORTS_DAILY_STAR_CAP} 颗`, () => {
    let sports = createInitialState().sports;
    let stars = 0;
    for (const [item, value] of [
      [rope, 300],
      [run, 15],
      [situp, 40],
      [reach, 10],
    ] as const) {
      const delta = sportsCheckinDelta(sports, TODAY, item, value)!;
      sports = delta.sports;
      stars += delta.starGain;
    }
    expect(stars).toBe(SPORTS_DAILY_STAR_CAP);
    expect(sportsMetCount(sports, TODAY)).toBe(4);
  });

  it('数值未变化返回 null', () => {
    let sports = createInitialState().sports;
    sports = sportsCheckinDelta(sports, TODAY, rope, 300)!.sports;
    expect(sportsCheckinDelta(sports, TODAY, rope, 300)).toBeNull();
  });

  it('只增不扣：已达标改低不回收星，记录照改', () => {
    let sports = createInitialState().sports;
    sports = sportsCheckinDelta(sports, TODAY, rope, 300)!.sports;
    const lower = sportsCheckinDelta(sports, TODAY, rope, 100)!;
    expect(lower.starGain).toBe(0);
    expect(lower.foodGain).toBe(0);
    expect(lower.sports.logs[TODAY][rope.id]).toBe(100);
    expect(lower.justMet).toBe(false);
  });

  it('从不达标补到达标补发星', () => {
    let sports = createInitialState().sports;
    sports = sportsCheckinDelta(sports, TODAY, rope, 100)!.sports;
    const fixed = sportsCheckinDelta(sports, TODAY, rope, 320)!;
    expect(fixed.starGain).toBe(1);
    expect(fixed.foodGain).toBe(0);
  });

  it('打卡数值必须大于 0：0 值不产生记录、不发奖励，已有记录也不许改回 0', () => {
    const base = createInitialState().sports;
    expect(sportsCheckinDelta(base, TODAY, rope, 0)).toBeNull();
    let sports = createInitialState().sports;
    sports = sportsCheckinDelta(sports, TODAY, rope, 300)!.sports;
    expect(sportsCheckinDelta(sports, TODAY, rope, 0)).toBeNull();
    expect(sports.logs[TODAY][rope.id]).toBe(300);
  });
});

describe('连续打卡 streak', () => {
  const dayWith = (date: string): ReturnType<typeof createInitialState>['sports'] => ({
    ...createInitialState().sports,
    streak: 1,
    bestStreak: 1,
    lastCheckDate: date,
    logs: { [date]: { rope: 10 } },
  });

  it('昨天打过 → 今天 streak+1', () => {
    const delta = sportsCheckinDelta(dayWith('2026-10-24'), TODAY, run, 15)!;
    expect(delta.sports.streak).toBe(2);
    expect(delta.firstCheckOfDay).toBe(true);
  });

  it('断签超过一天 → streak 归 1', () => {
    const delta = sportsCheckinDelta(dayWith('2026-10-20'), TODAY, run, 15)!;
    expect(delta.sports.streak).toBe(1);
  });

  it('连续满 7 天发 1 份大餐', () => {
    const sports = {
      ...dayWith('2026-10-24'),
      streak: 6,
      bestStreak: 6,
    };
    const delta = sportsCheckinDelta(sports, TODAY, run, 15)!;
    expect(delta.sports.streak).toBe(7);
    expect(delta.mealGain).toBe(1);
  });

  it('非当日首次打卡不推进 streak、不发大餐', () => {
    const sports = dayWith(TODAY);
    const delta = sportsCheckinDelta(sports, TODAY, run, 15)!;
    expect(delta.firstCheckOfDay).toBe(false);
    expect(delta.sports.streak).toBe(1);
    expect(delta.mealGain).toBe(0);
  });
});

describe('sportsDayStatus 展示推导', () => {
  it('按现值推导今日奖励，星星封顶', () => {
    let sports = createInitialState().sports;
    for (const [item, value] of [
      [rope, 300],
      [run, 15],
      [situp, 40],
      [reach, 10],
    ] as const) {
      sports = sportsCheckinDelta(sports, TODAY, item, value)!.sports;
    }
    const status = sportsDayStatus(sports, TODAY);
    expect(status.checkedCount).toBe(4);
    expect(status.metCount).toBe(4);
    expect(status.foodEarned).toBe(1);
    expect(status.starEarned).toBe(SPORTS_DAILY_STAR_CAP);
  });

  it('自定义项目参与统计', () => {
    const sports = {
      ...createInitialState().sports,
      customItems: [{ id: 'custom-swim', name: '游泳', unit: '米', goal: 200, step: 10 }],
      logs: { [TODAY]: { 'custom-swim': 200 } },
    };
    expect(sportsMetCount(sports, TODAY)).toBe(1);
    expect(findSportsItem(sports, 'custom-swim')?.name).toBe('游泳');
  });
});

describe('appReducer 运动动作', () => {
  it('sports-checkin 把奖励结算进 rewards', () => {
    const next = appReducer(createInitialState(), {
      type: 'sports-checkin',
      date: TODAY,
      itemId: rope.id,
      value: 300,
    });
    expect(next.rewards.food).toBe(1);
    expect(next.rewards.stars).toBe(1);
    expect(next.rewards.meals).toBe(0);
    expect(next.sports.logs[TODAY][rope.id]).toBe(300);
  });

  it('未知项目 / 数值未变 / 数值为 0 → 原状态返回', () => {
    const base = createInitialState();
    expect(
      appReducer(base, { type: 'sports-checkin', date: TODAY, itemId: 'nope', value: 1 }),
    ).toBe(base);
    const after = appReducer(base, { type: 'sports-checkin', date: TODAY, itemId: rope.id, value: 10 });
    expect(
      appReducer(after, { type: 'sports-checkin', date: TODAY, itemId: rope.id, value: 10 }),
    ).toBe(after);
    expect(
      appReducer(base, { type: 'sports-checkin', date: TODAY, itemId: rope.id, value: 0 }),
    ).toBe(base);
  });

  it('自定义项目：添加 → 打卡 → 删除并清理历史', () => {
    let state = createInitialState();
    state = appReducer(state, {
      type: 'sports-custom-add',
      item: { id: 'custom-swim', name: '游泳', unit: '米', goal: 200, step: 10 },
    });
    state = appReducer(state, {
      type: 'sports-checkin',
      date: TODAY,
      itemId: 'custom-swim',
      value: 200,
    });
    expect(state.rewards.food).toBe(1);
    expect(state.sports.logs[TODAY]['custom-swim']).toBe(200);

    state = appReducer(state, { type: 'sports-custom-remove', id: 'custom-swim' });
    expect(state.sports.customItems).toHaveLength(0);
    expect(state.sports.logs[TODAY]).toBeUndefined();
  });

  it('自定义项目上限 5 个、同名幂等', () => {
    let state = createInitialState();
    for (let index = 0; index < 5; index += 1) {
      state = appReducer(state, {
        type: 'sports-custom-add',
        item: { id: `custom-${index}`, name: `项目${index}`, unit: '次', goal: 10, step: 1 },
      });
    }
    const capped = appReducer(state, {
      type: 'sports-custom-add',
      item: { id: 'custom-x', name: '项目x', unit: '次', goal: 10, step: 1 },
    });
    expect(capped).toBe(state);
    const dup = appReducer(state, {
      type: 'sports-custom-add',
      item: { id: 'custom-other', name: '项目0', unit: '次', goal: 10, step: 1 },
    });
    expect(dup).toBe(state);
  });
});

describe('normalizeState 运动数据兼容', () => {
  it('旧数据没有 sports 字段 → 空结构', () => {
    const old: Record<string, unknown> = JSON.parse(JSON.stringify(createInitialState()));
    delete old.sports;
    const normalized = normalizeState(old);
    expect(normalized).not.toBeNull();
    expect(normalized!.sports).toEqual({ logs: {}, customItems: [], streak: 0, bestStreak: 0 });
  });

  it('畸形运动数据被安全过滤', () => {
    const state = normalizeState({
      ...createInitialState(),
      sports: {
        logs: {
          'not-a-date': { rope: 1 },
          [TODAY]: { rope: 'abc', jj: -5, run: 12.7 },
        },
        customItems: [{ id: 'swim', name: '游泳', unit: '米', goal: 200, step: 0 }, 'bad'],
        streak: -3,
        lastCheckDate: 'yesterday',
      },
    });
    expect(state).not.toBeNull();
    expect(state!.sports.logs[TODAY]).toEqual({ run: 13 });
    expect(state!.sports.logs['not-a-date']).toBeUndefined();
    expect(state!.sports.customItems).toEqual([
      { id: 'custom-swim', name: '游泳', unit: '米', goal: 200, step: 1 },
    ]);
    expect(state!.sports.streak).toBe(0);
    expect(state!.sports.lastCheckDate).toBeUndefined();
  });

  it('合法数据完整往返', () => {
    const source = {
      ...createInitialState(),
      sports: {
        logs: { [TODAY]: { rope: 300 } },
        customItems: [{ id: 'custom-swim', name: '游泳', unit: '米', goal: 200, step: 10 }],
        streak: 9,
        bestStreak: 12,
        lastCheckDate: TODAY,
      },
    };
    const normalized = normalizeState(source);
    expect(normalized!.sports).toEqual(source.sports);
  });
});
