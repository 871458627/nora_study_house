import { diffDays, rangeEndingAt } from './date';
import type { SportsState } from './model';
import {
  SPORTS_DAILY_STAR_CAP,
  SPORTS_ITEMS,
  type SportsItem,
} from '../data/sports';

/**
 * 运动打卡纯逻辑（docs/06 §3.11）：达标判定、奖励结算与连续天数。
 * 奖励口径（2026-10-25 用户确认）：
 *  - 每日首次打卡（任意项目）+1 桃粮；
 *  - 每个达标项目 +1 星，每日上限 SPORTS_DAILY_STAR_CAP；
 *  - 连续打卡每满 7 天 +1 大餐；
 *  - 只增不扣：当日改数值不回收已发奖励。
 */

export { SPORTS_DAILY_STAR_CAP, SPORTS_MAX_CUSTOM_ITEMS } from '../data/sports';
export type { SportsItem } from '../data/sports';

export function sportsItemsFor(sports: SportsState): SportsItem[] {
  return [...SPORTS_ITEMS, ...sports.customItems];
}

export function findSportsItem(sports: SportsState, itemId: string): SportsItem | null {
  return sportsItemsFor(sports).find(item => item.id === itemId) ?? null;
}

export function isGoalMet(item: SportsItem, value: number): boolean {
  return value >= item.goal;
}

/** 当日已有多少个达标项目（按 logs 现值统计）。 */
export function sportsMetCount(sports: SportsState, date: string, items?: SportsItem[]): number {
  const entries = sports.logs[date] ?? {};
  const catalog = items ?? sportsItemsFor(sports);
  return catalog.reduce((count, item) => {
    const value = entries[item.id];
    return count + (value !== undefined && isGoalMet(item, value) ? 1 : 0);
  }, 0);
}

export interface SportsDayStatus {
  checkedCount: number;
  metCount: number;
  /** 当日经运动打卡已到账的奖励（按规则推导，供展示） */
  foodEarned: number;
  starEarned: number;
}

export function sportsDayStatus(
  sports: SportsState,
  date: string,
  items?: SportsItem[],
): SportsDayStatus {
  const catalog = items ?? sportsItemsFor(sports);
  const entries = sports.logs[date] ?? {};
  const checkedCount = catalog.filter(item => entries[item.id] !== undefined).length;
  const metCount = sportsMetCount(sports, date, catalog);
  const issuedList = sports.starItemsIssued[date];
  return {
    checkedCount,
    metCount,
    foodEarned: checkedCount > 0 ? 1 : 0,
    // 有发星记录（新数据）按记录展示；旧缓存（无记录）按当前达标数推导
    starEarned: issuedList !== undefined ? issuedList.length : Math.min(metCount, SPORTS_DAILY_STAR_CAP),
  };
}

export interface SportsCheckinDelta {
  sports: SportsState;
  foodGain: number;
  starGain: number;
  mealGain: number;
  firstCheckOfDay: boolean;
  justMet: boolean;
}

/**
 * 结算一次打卡：返回下一份 sports 与奖励增量；数值没变化时返回 null
 * （调用方据此跳过 dispatch）。streak 只在当日首次打卡时推进。
 */
export function sportsCheckinDelta(
  sports: SportsState,
  date: string,
  item: SportsItem,
  nextValue: number,
): SportsCheckinDelta | null {
  const dayEntries = sports.logs[date] ?? {};
  const prevValue = dayEntries[item.id];
  if (prevValue === nextValue) return null;
  // 打卡数值必须大于 0：0 值不产生记录、不触发任何奖励（防白嫖首打卡桃粮），
  // 已有记录也不允许改回 0（清零走删除项目，不在这里）。
  if (nextValue <= 0) return null;

  const firstCheckOfDay = prevValue === undefined && Object.keys(dayEntries).length === 0;
  const wasMet = prevValue !== undefined && isGoalMet(item, prevValue);
  const justMet = !wasMet && isGoalMet(item, nextValue);

  // 星上限：当日已达标数（不含本次）达到上限后不再发放
  // 发星以「当日已发项目」为准（缺陷清单 M9）：达标数会随数值改小而回落，
  // 只数当前达标项可被「达标→跌破→再达标」反复刷星；同一项目重复领取不发。
  const issuedList = sports.starItemsIssued[date] ?? [];
  const starGain = justMet && !issuedList.includes(item.id) && issuedList.length < SPORTS_DAILY_STAR_CAP ? 1 : 0;

  let streak = sports.streak;
  let bestStreak = sports.bestStreak;
  let lastCheckDate = sports.lastCheckDate;
  let mealGain = 0;
  if (firstCheckOfDay) {
    const consecutive =
      lastCheckDate !== undefined && diffDays(date, lastCheckDate) === 1;
    streak = consecutive ? streak + 1 : 1;
    bestStreak = Math.max(bestStreak, streak);
    lastCheckDate = date;
    mealGain = streak > 0 && streak % 7 === 0 ? 1 : 0;
  }

  return {
    sports: {
      ...sports,
      logs: { ...sports.logs, [date]: { ...dayEntries, [item.id]: nextValue } },
      starItemsIssued:
        starGain > 0
          ? { ...(sports.starItemsIssued ?? {}), [date]: [...issuedList, item.id] }
          : sports.starItemsIssued,
      streak,
      bestStreak,
      lastCheckDate,
    },
    foodGain: firstCheckOfDay ? 1 : 0,
    starGain,
    mealGain,
    firstCheckOfDay,
    justMet,
  };
}

/** 近 N 天的打卡概况（记录页 7 天格子用）。 */
export function sportsRecentDays(
  sports: SportsState,
  today: string,
  days = 7,
): { date: string; checkedCount: number }[] {
  return rangeEndingAt(today, days).map(date => {
    const entries = sports.logs[date] ?? {};
    return { date, checkedCount: Object.keys(entries).length };
  });
}

/** 某项目的历史最高纪录（记录页「最高纪录」用）。 */
export function sportsBestForItem(
  sports: SportsState,
  itemId: string,
): { value: number; date: string } | null {
  let best: { value: number; date: string } | null = null;
  for (const [date, entries] of Object.entries(sports.logs)) {
    const value = entries[itemId];
    if (value === undefined) continue;
    if (!best || value > best.value) best = { value, date };
  }
  return best;
}
