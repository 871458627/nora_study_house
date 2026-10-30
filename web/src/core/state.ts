import { ACCESSORIES } from '../data/defaults';
import { PET_BY_ID } from '../data/pets';
import { lessonsForSubject } from '../data/content';
import { SPORTS_ITEMS, SPORTS_MAX_CUSTOM_ITEMS, type SportsItem } from '../data/sports';
import type { Lesson, SubjectId, Timetable } from '../data/types';
import { todayKey } from './date';
import {
  createInitialState,
  type AppSettings,
  type SyncState,
  type TaskOutcome,
} from './model';
import { decayPet, stageFromFedDays, STAGES } from './pet';
import { archiveState } from './archive';
import { generatePlan } from './plan';
import { applyFreeDictation, applyFreePractice, applyMistakeRedo, applyTaskOutcome, feedPet } from './progress';
import { findSportsItem, sportsCheckinDelta } from './sports';

export type AppAction =
  | { type: 'replace'; state: SyncState }
  | {
      type: 'onboard';
      date?: string;
      nickname: string;
      dailyMinutes: number;
      timetable?: Timetable;
    }
  | { type: 'update-settings'; patch: Partial<AppSettings> }
  | { type: 'update-timetable'; timetable: Timetable }
  | { type: 'update-nickname'; nickname: string }
  | { type: 'set-pointer'; subject: SubjectId; index: number }
  | { type: 'daily-tick'; date?: string }
  | { type: 'ensure-plan'; date?: string }
  | { type: 'complete-task'; date: string; taskId: string; outcome: TaskOutcome }
  | { type: 'free-practice'; date: string; lesson: Lesson; outcome: TaskOutcome }
  | { type: 'redo-mistake'; date: string; outcome: TaskOutcome }
  | { type: 'review-dictation'; date: string; words: { wordId: string; correct: boolean }[] }
  | { type: 'feed'; date: string; kind: 'food' | 'meal' }
  | { type: 'equip'; slot: string; itemId: string | null }
  | { type: 'shop-buy'; petId: string }
  | { type: 'shop-equip'; petId: string }
  | { type: 'mark-stage-seen'; date: string }
  | { type: 'praise-add'; text: string; date: string }
  | { type: 'praise-read' }
  | { type: 'praise-remove'; id: string }
  | { type: 'sports-checkin'; date: string; itemId: string; value: number }
  | { type: 'sports-custom-add'; item: SportsItem }
  | { type: 'sports-custom-remove'; id: string };

function withPlan(state: SyncState, date: string): SyncState {
  if (state.dailyPlans[date]) return state;
  const tasks = generatePlan(state, date);
  return {
    ...state,
    dailyPlans: {
      ...state.dailyPlans,
      [date]: { tasks, generatedAt: new Date().toISOString() },
    },
  };
}

export function appReducer(state: SyncState, action: AppAction): SyncState {
  switch (action.type) {
    case 'replace':
      return action.state;

    case 'onboard': {
      const date = action.date ?? todayKey();
      const base: SyncState = {
        ...state,
        onboarded: true,
        profile: { nickname: action.nickname.trim().slice(0, 12) || '小朋友' },
        settings: { ...state.settings, dailyMinutes: action.dailyMinutes },
        timetable: action.timetable ?? state.timetable,
        pet: { ...state.pet, lastDecayDate: date },
        album:
          state.album.length === 0
            ? [
                {
                  date,
                  day: 0,
                  title: `和${action.nickname.trim().slice(0, 12) || '小朋友'}相遇`,
                },
              ]
            : state.album,
        updatedAt: new Date().toISOString(),
      };
      return withPlan(base, date);
    }

    case 'update-settings':
      return {
        ...state,
        settings: { ...state.settings, ...action.patch },
        updatedAt: new Date().toISOString(),
      };

    case 'update-timetable':
      return {
        ...state,
        timetable: action.timetable,
        updatedAt: new Date().toISOString(),
      };

    case 'update-nickname':
      return {
        ...state,
        profile: { nickname: action.nickname.trim().slice(0, 12) || '小朋友' },
        updatedAt: new Date().toISOString(),
      };

    case 'set-pointer': {
      const lastIndex = Math.max(0, lessonsForSubject(action.subject).length - 1);
      const index = Math.min(lastIndex, Math.max(0, Math.trunc(action.index) || 0));
      if (index === state.pointers[action.subject]) return state;
      return {
        ...state,
        pointers: { ...state.pointers, [action.subject]: index },
        updatedAt: new Date().toISOString(),
      };
    }

    case 'daily-tick': {
      if (!state.onboarded) return state;
      const date = action.date ?? todayKey();
      const pet = decayPet(state.pet, date);
      const stage = stageFromFedDays(pet.fedDays);
      if (
        pet.lastDecayDate === state.pet.lastDecayDate &&
        pet.satiety === state.pet.satiety &&
        stage === state.pet.stage
      ) {
        return state;
      }
      return { ...state, pet: { ...pet, stage }, updatedAt: new Date().toISOString() };
    }

    case 'ensure-plan': {
      if (!state.onboarded) return state;
      const date = action.date ?? todayKey();
      if (state.dailyPlans[date]) return state;
      return withPlan(state, date);
    }

    case 'complete-task': {
      const task = state.dailyPlans[action.date]?.tasks.find(item => item.id === action.taskId);
      if (!task) return state;
      return applyTaskOutcome(state, action.date, task, action.outcome);
    }

    case 'free-practice':
      return applyFreePractice(state, action.date, action.lesson, action.outcome);
    case 'redo-mistake':
      return applyMistakeRedo(state, action.date, action.outcome);

    case 'review-dictation':
      return applyFreeDictation(state, action.date, action.words);

    case 'feed': {
      const result = feedPet(state, action.date, action.kind);
      return result.state;
    }

    case 'equip': {
      const accessory = ACCESSORIES.find(item => item.id === action.itemId);
      if (action.itemId && (!accessory || !state.pet.unlocked.includes(accessory.id))) {
        return state;
      }
      const equipped = { ...state.pet.equipped };
      if (!action.itemId || equipped[action.slot] === action.itemId) {
        delete equipped[action.slot];
      } else {
        equipped[action.slot] = action.itemId;
      }
      return {
        ...state,
        pet: { ...state.pet, equipped },
        updatedAt: new Date().toISOString(),
      };
    }

    case 'shop-buy': {
      // 星级不足 / 重复拥有 / 未知商品 → 返回原 state（FR-P1-01 口径）
      const skin = PET_BY_ID[action.petId];
      if (!skin || state.shop.owned.includes(action.petId)) return state;
      if (state.rewards.stars < skin.price) return state;
      return {
        ...state,
        rewards: { ...state.rewards, stars: state.rewards.stars - skin.price },
        shop: { owned: [...state.shop.owned, action.petId] },
        pet: { ...state.pet, skin: action.petId },
        updatedAt: new Date().toISOString(),
      };
    }

    case 'mark-stage-seen': {
      // 升级瞬间只庆祝一次：记录已见阶段并写入成长相册
      const stage = state.pet.stage;
      const seen = state.pet.stageSeen ?? 0;
      if (stage <= seen) return state;
      const stageName = STAGES[stage].name;
      return {
        ...state,
        pet: { ...state.pet, stageSeen: stage },
        album: [
          ...state.album,
          { date: action.date, day: state.pet.fedDays, title: `长成${stageName}啦` },
        ].slice(-30),
        updatedAt: new Date().toISOString(),
      };
    }

    case 'praise-add': {
      const text = action.text.trim().slice(0, 80);
      if (!text) return state;
      const note = {
        id: `p${Date.now().toString(36)}`,
        text,
        date: action.date,
        read: false,
      };
      return {
        ...state,
        praise: [note, ...state.praise].slice(0, 20),
        updatedAt: new Date().toISOString(),
      };
    }

    case 'praise-read': {
      if (state.praise.every(note => note.read)) return state;
      return {
        ...state,
        praise: state.praise.map(note => ({ ...note, read: true })),
        updatedAt: new Date().toISOString(),
      };
    }

    case 'praise-remove': {
      if (!state.praise.some(note => note.id === action.id)) return state;
      return {
        ...state,
        praise: state.praise.filter(note => note.id !== action.id),
        updatedAt: new Date().toISOString(),
      };
    }

    case 'shop-equip': {
      // 0 价初始伙伴恒可装备；其余须在已拥有集合内
      const target = PET_BY_ID[action.petId];
      if (!target || (target.price > 0 && !state.shop.owned.includes(action.petId))) return state;
      if (state.pet.skin === action.petId) return state;
      return {
        ...state,
        pet: { ...state.pet, skin: action.petId },
        updatedAt: new Date().toISOString(),
      };
    }

    case 'sports-checkin': {
      // 运动打卡（docs/06 §3.11）：奖励结算在 core/sports 纯函数里，只增不扣
      const item = findSportsItem(state.sports, action.itemId);
      if (!item) return state;
      const value = Math.max(0, Math.min(100000, Math.round(action.value)));
      const delta = sportsCheckinDelta(state.sports, action.date, item, value);
      if (!delta) return state;
      return {
        ...state,
        sports: delta.sports,
        rewards: {
          ...state.rewards,
          food: state.rewards.food + delta.foodGain,
          stars: state.rewards.stars + delta.starGain,
          meals: state.rewards.meals + delta.mealGain,
        },
        updatedAt: new Date().toISOString(),
      };
    }

    case 'sports-custom-add': {
      const raw = action.item;
      const item: SportsItem = {
        id: raw.id.trim().slice(0, 40),
        name: raw.name.trim().slice(0, 12),
        unit: raw.unit.trim().slice(0, 6),
        goal: Math.max(1, Math.min(100000, Math.round(raw.goal))),
        step: Math.max(1, Math.min(1000, Math.round(raw.step) || 1)),
      };
      if (!item.id || !item.name || !item.unit) return state;
      if (state.sports.customItems.length >= SPORTS_MAX_CUSTOM_ITEMS) return state;
      // 不得与内置项目同名/同 id（撞名会让 remove 误清、find 命中错项，缺陷清单 低8）
      if (SPORTS_ITEMS.some(b => b.id === item.id || b.name === item.name)) return state;
      // 同 id 或同名已存在 → 忽略（幂等）
      if (
        state.sports.customItems.some(
          existing => existing.id === item.id || existing.name === item.name,
        )
      ) {
        return state;
      }
      return {
        ...state,
        sports: { ...state.sports, customItems: [...state.sports.customItems, item] },
        updatedAt: new Date().toISOString(),
      };
    }

    case 'sports-custom-remove': {
      if (!state.sports.customItems.some(item => item.id === action.id)) return state;
      // 连历史记录一并清理，避免孤儿条目
      const logs: typeof state.sports.logs = {};
      for (const [date, entries] of Object.entries(state.sports.logs)) {
        const rest = Object.fromEntries(
          Object.entries(entries).filter(([itemId]) => itemId !== action.id),
        );
        if (Object.keys(rest).length > 0) logs[date] = rest;
      }
      return {
        ...state,
        sports: {
          ...state.sports,
          customItems: state.sports.customItems.filter(item => item.id !== action.id),
          logs,
        },
        updatedAt: new Date().toISOString(),
      };
    }

    default:
      return state;
  }
}

export function initialState(): SyncState {
  return createInitialState();
}

/** Applies scheduled maintenance without a user action: pet decay, today's plan, state archival. */
export function prepareState(state: SyncState, date: string): SyncState {
  if (!state.onboarded) return state;
  const ticked = appReducer(state, { type: 'daily-tick', date });
  const planned = appReducer(ticked, { type: 'ensure-plan', date });
  // 状态归档（docs/02 §5.1）：120 天前的计划/日志清理与聚合，幂等无变化时原引用返回。
  return archiveState(planned, date);
}
