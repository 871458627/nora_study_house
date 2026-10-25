import { ACCESSORIES } from '../data/defaults';
import { lessonsForSubject } from '../data/content';
import type { Lesson, SubjectId, Timetable } from '../data/types';
import { todayKey } from './date';
import {
  createInitialState,
  type AppSettings,
  type SyncState,
  type TaskOutcome,
} from './model';
import { decayPet, stageFromFedDays } from './pet';
import { generatePlan } from './plan';
import { applyFreeDictation, applyFreePractice, applyTaskOutcome, feedPet } from './progress';

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
  | { type: 'review-dictation'; date: string; words: { wordId: string; correct: boolean }[] }
  | { type: 'feed'; date: string; kind: 'food' | 'meal' }
  | { type: 'equip'; slot: string; itemId: string | null };

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

    default:
      return state;
  }
}

export function initialState(): SyncState {
  return createInitialState();
}

/** Applies scheduled maintenance without a user action: pet decay and today's plan. */
export function prepareState(state: SyncState, date: string): SyncState {
  if (!state.onboarded) return state;
  const ticked = appReducer(state, { type: 'daily-tick', date });
  return appReducer(ticked, { type: 'ensure-plan', date });
}
