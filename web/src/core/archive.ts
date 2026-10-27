import type { DailyLog, SyncState } from '../data/../core/model';
import { addDays } from './date';

/**
 * 状态归档（docs/02 §5.1 落地，2026-10-26）：
 * dailyPlans/dailyLogs 按天无限增长，整包 CAS 同步会在约 4 个月撞上 256KB 上限。
 * 归档规则：
 *   - 120 天前的 dailyPlans 整条丢弃（历史计划无处展示，唯一消费方是当天续做）；
 *   - 120 天前的 dailyLogs 聚合进 state.archivedTotals（累计口径不丢），
 *     近 120 天完整保留——周报最长 30 天、热力图 84 天，均不受影响。
 * 纯函数且幂等：无变化时返回原引用，调用方（prepareState）零成本跳过。
 */

const KEEP_DAYS = 120;

export interface ArchivedTotals {
  days: number;
  done: number;
  minutes: number;
  stars: number;
  food: number;
}

export function emptyArchivedTotals(): ArchivedTotals {
  return { days: 0, done: 0, minutes: 0, stars: 0, food: 0 };
}

function cutoff(today: string): string {
  return addDays(today, -KEEP_DAYS);
}

function logIsEmpty(log: DailyLog): boolean {
  return log.done.length === 0 && log.minutes === 0 && log.stars === 0 && log.food === 0;
}

/** 归档主入口：返回新 state 或原引用（无过期数据时）。 */
export function archiveState(state: SyncState, today: string): SyncState {
  const edge = cutoff(today);
  let changed = false;

  const nextPlans: SyncState['dailyPlans'] = {};
  for (const [key, plan] of Object.entries(state.dailyPlans)) {
    if (key < edge) {
      changed = true;
      continue;
    }
    nextPlans[key] = plan;
  }

  const totals: ArchivedTotals = { ...state.archivedTotals };
  const nextLogs: SyncState['dailyLogs'] = {};
  for (const [key, log] of Object.entries(state.dailyLogs)) {
    if (key < edge) {
      if (!logIsEmpty(log)) {
        totals.days += 1;
        totals.done += log.done.length;
        totals.minutes += log.minutes;
        totals.stars += log.stars;
        totals.food += log.food;
      }
      changed = true;
      continue;
    }
    nextLogs[key] = log;
  }
  // 已归档天数去重语义由调用侧保证（每次归档只处理新落入窗口外的天）。

  if (!changed) return state;
  return {
    ...state,
    dailyPlans: nextPlans,
    dailyLogs: nextLogs,
    archivedTotals: totals,
    updatedAt: new Date().toISOString(),
  };
}

/** 累计口径（记录页"累计"卡）：近窗明细 + 已归档合计。 */
export function lifetimeTotals(state: SyncState): ArchivedTotals {
  const archived = state.archivedTotals ?? emptyArchivedTotals();
  let days = archived.days;
  let done = archived.done;
  let minutes = archived.minutes;
  let stars = archived.stars;
  let food = archived.food;
  for (const log of Object.values(state.dailyLogs)) {
    if (log.done.length > 0 || log.minutes > 0) days += 1;
    done += log.done.length;
    minutes += log.minutes;
    stars += log.stars;
    food += log.food;
  }
  return { days, done, minutes, stars, food };
}
