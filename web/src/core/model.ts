import { DEFAULT_PET_ID, PET_BY_ID } from '../data/pets';
import { DEFAULT_SETTINGS, DEFAULT_TIMETABLE } from '../data/defaults';
import type {
  Lesson,
  PlanTask,
  SubjectId,
  Timetable,
} from '../data/types';
import { isValidDateKey } from './date';

export type LessonStatus = 'new' | 'previewed' | 'reviewed' | 'mastered';

export interface LessonProgress {
  status: LessonStatus;
  mastery: number;
  lastAt?: string;
  dueAt?: string;
  attempts: number;
  correct: number;
}

export interface AppSettings {
  dailyMinutes: number;
  deadlineHour: number;
  dailyDrill: boolean;
  dictationMode: 'choice' | 'handwrite';
  ttsEnabled: boolean;
}

export interface Mistake {
  questionId: string;
  lessonId: string;
  wrongAt: string;
  resolvedAt?: string;
}

export interface WeaknessEntry {
  wrong: number;
  right: number;
  lastWrongAt?: string;
}

export interface DictationEntry {
  wordId: string;
  wrong: number;
  correct: number;
  dueAt: string;
}

export interface Rewards {
  stars: number;
  food: number;
  meals: number;
  streak: number;
  bestStreak: number;
  badges: string[];
  lastAllDoneDate?: string;
}

export interface PetState {
  satiety: number;
  stage: 0 | 1 | 2;
  fedDays: number;
  lastFedDate?: string;
  lastDecayDate?: string;
  unlocked: string[];
  equipped: Record<string, string>;
  /** 当前陪伴伙伴（宠物商城皮肤 id，src/data/pets.ts） */
  skin?: string;
  /** 已举行过进化仪式的最高阶段（激励体系：升级瞬间只庆祝一次） */
  stageSeen?: 0 | 1 | 2;
}

/** 宠物商城：已拥有的伙伴（星星兑换，FR-P1-01 的宠物部分） */
export interface ShopState {
  owned: string[];
}

/** 成长相册条目：进化瞬间与相遇纪念 */
export interface AlbumEntry {
  date: string;
  day: number;
  title: string;
}

/** 表扬信：家长区书写，孩子在小桃页信箱读 */
export interface PraiseNote {
  id: string;
  text: string;
  date: string;
  read: boolean;
}

export interface DailyLog {
  planned: number;
  done: string[];
  minutes: number;
  stars: number;
  food: number;
  dictationTotal: number;
  dictationCorrect: number;
  allDone: boolean;
}

export interface DailyPlan {
  tasks: PlanTask[];
  generatedAt: string;
}

/** Practice outside the daily plan: counted for records, never for rewards. */
export interface FreePracticeLog {
  sessions: number;
  questions: number;
  correct: number;
  dictationTotal: number;
  dictationCorrect: number;
}

export interface SyncState {
  schemaVersion: 1;
  onboarded: boolean;
  profile: { nickname: string };
  settings: AppSettings;
  timetable: Timetable;
  lessons: Record<string, LessonProgress>;
  pointers: Record<SubjectId, number>;
  mistakes: Mistake[];
  weakness: Record<string, WeaknessEntry>;
  dictationQueue: Record<string, DictationEntry>;
  rewards: Rewards;
  shop: ShopState;
  pet: PetState;
  /** 成长相册：进化等里程碑（激励体系，2026-10-25） */
  album: AlbumEntry[];
  /** 爸妈的表扬信（家长写、孩子读） */
  praise: PraiseNote[];
  dailyPlans: Record<string, DailyPlan>;
  dailyLogs: Record<string, DailyLog>;
  freeLogs: Record<string, FreePracticeLog>;
  updatedAt: string;
}

export interface TaskOutcome {
  correct: number;
  total: number;
  weakness: { pointId: string; correct: boolean }[];
  wrongQuestionIds: string[];
  correctQuestionIds?: string[];
  dictation?: { wordId: string; correct: boolean }[];
}

export const SCHEMA_VERSION = 1 as const;

export function createInitialState(): SyncState {
  return {
    schemaVersion: SCHEMA_VERSION,
    onboarded: false,
    profile: { nickname: '小朋友' },
    settings: { ...DEFAULT_SETTINGS },
    timetable: DEFAULT_TIMETABLE.map(row => [...row]),
    lessons: {},
    pointers: { chinese: 0, math: 0, english: 0 },
    mistakes: [],
    weakness: {},
    dictationQueue: {},
    rewards: {
      stars: 0,
      food: 0,
      meals: 0,
      streak: 0,
      bestStreak: 0,
      badges: [],
    },
    shop: { owned: [] },
    album: [],
    praise: [],
    pet: {
      satiety: 70,
      stage: 0,
      fedDays: 0,
      unlocked: [],
      equipped: {},
      skin: 'xiaotao',
      stageSeen: 0,
    },
    dailyPlans: {},
    dailyLogs: {},
    freeLogs: {},
    updatedAt: new Date().toISOString(),
  };
}

export function emptyDailyLog(planned: number): DailyLog {
  return {
    planned,
    done: [],
    minutes: 0,
    stars: 0,
    food: 0,
    dictationTotal: 0,
    dictationCorrect: 0,
    allDone: false,
  };
}

export function lessonProgress(state: SyncState, lessonId: string): LessonProgress {
  return state.lessons[lessonId] ?? { status: 'new', mastery: 0, attempts: 0, correct: 0 };
}

export function currentLessonIndex(state: SyncState, subject: SubjectId): number {
  return Math.max(0, state.pointers[subject] ?? 0);
}

export function learnedLessonCount(state: SyncState, lessons: Lesson[]): number {
  return lessons.filter(lesson => state.lessons[lesson.id]?.status === 'mastered').length;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const ALLOWED_SLOTS = new Set(['chinese', 'math', 'english', 'other', null]);

function normalizeTimetable(value: unknown): Timetable {
  if (!Array.isArray(value) || value.length !== 7) {
    return DEFAULT_TIMETABLE.map(row => [...row]);
  }
  return Array.from({ length: 7 }, (_, dayIndex) => {
    const row = value[dayIndex];
    if (!Array.isArray(row) || row.length !== 6) {
      return [...DEFAULT_TIMETABLE[dayIndex]];
    }
    return Array.from({ length: 6 }, (_, slot) => {
      const item = row[slot];
      return ALLOWED_SLOTS.has(item as string | null) ? (item as Timetable[number][number]) : null;
    });
  });
}

function normalizePlanTasks(value: unknown): PlanTask[] {
  if (!Array.isArray(value)) return [];
  return value.filter((task): task is PlanTask => {
    if (!isRecord(task)) return false;
    return (
      typeof task.id === 'string' &&
      typeof task.kind === 'string' &&
      typeof task.subject === 'string' &&
      typeof task.lessonId === 'string' &&
      typeof task.title === 'string' &&
      typeof task.subtitle === 'string' &&
      typeof task.minutes === 'number'
    );
  });
}

function normalizePlans(value: unknown): Record<string, DailyPlan> {
  if (!isRecord(value)) return {};
  const plans: Record<string, DailyPlan> = {};
  for (const [key, plan] of Object.entries(value)) {
    if (!isValidDateKey(key) || !isRecord(plan)) continue;
    const tasks = normalizePlanTasks(plan.tasks);
    plans[key] = {
      tasks,
      generatedAt: typeof plan.generatedAt === 'string' ? plan.generatedAt : new Date().toISOString(),
    };
  }
  return plans;
}

function normalizeLogs(value: unknown): Record<string, DailyLog> {
  if (!isRecord(value)) return {};
  const logs: Record<string, DailyLog> = {};
  for (const [key, log] of Object.entries(value)) {
    if (!isValidDateKey(key) || !isRecord(log)) continue;
    logs[key] = {
      planned: Number.isFinite(log.planned) ? Number(log.planned) : 0,
      done: Array.isArray(log.done) ? log.done.filter((id): id is string => typeof id === 'string') : [],
      minutes: Number.isFinite(log.minutes) ? Number(log.minutes) : 0,
      stars: Number.isFinite(log.stars) ? Number(log.stars) : 0,
      food: Number.isFinite(log.food)
        ? Number(log.food)
        : Number.isFinite(log.stars)
          ? Number(log.stars)
          : 0,
      dictationTotal: Number.isFinite(log.dictationTotal) ? Number(log.dictationTotal) : 0,
      dictationCorrect: Number.isFinite(log.dictationCorrect) ? Number(log.dictationCorrect) : 0,
      allDone: log.allDone === true,
    };
  }
  return logs;
}

function normalizeFreeLogs(value: unknown): Record<string, FreePracticeLog> {
  if (!isRecord(value)) return {};
  const logs: Record<string, FreePracticeLog> = {};
  const count = (raw: unknown) => {
    const number = Number(raw);
    return Number.isFinite(number) && number > 0 ? Math.round(number) : 0;
  };
  for (const [key, log] of Object.entries(value)) {
    if (!isValidDateKey(key) || !isRecord(log)) continue;
    logs[key] = {
      sessions: count(log.sessions),
      questions: count(log.questions),
      correct: count(log.correct),
      dictationTotal: count(log.dictationTotal),
      dictationCorrect: count(log.dictationCorrect),
    };
  }
  return logs;
}

/**
 * Accepts a locally cached or cloud document and returns a safe state.
 * Returns null when the document is not a v1 family state.
 */
function normalizeAlbum(source: unknown[]): AlbumEntry[] {
  const entries: AlbumEntry[] = [];
  for (const raw of source) {
    if (!isRecord(raw)) continue;
    if (entries.length >= 30) break;
    const date = raw.date;
    const title = typeof raw.title === 'string' ? raw.title.slice(0, 40) : '';
    if (!isValidDateKey(date) || !title) continue;
    entries.push({ date, day: Math.max(0, Number(raw.day) || 0), title });
  }
  return entries;
}

function normalizePraise(source: unknown[]): PraiseNote[] {
  const notes: PraiseNote[] = [];
  for (const raw of source) {
    if (!isRecord(raw)) continue;
    if (notes.length >= 20) break;
    const id = typeof raw.id === 'string' ? raw.id : '';
    const text = typeof raw.text === 'string' ? raw.text.slice(0, 80) : '';
    if (!id || !text || !isValidDateKey(raw.date)) continue;
    notes.push({ id, text, date: raw.date, read: raw.read === true });
  }
  return notes;
}

export function normalizeState(value: unknown): SyncState | null {
  if (!isRecord(value) || value.schemaVersion !== SCHEMA_VERSION) return null;
  const base = createInitialState();
  const profile = isRecord(value.profile) ? value.profile : {};
  const settings = isRecord(value.settings) ? value.settings : {};
  const rewards = isRecord(value.rewards) ? value.rewards : {};
  const pet = isRecord(value.pet) ? value.pet : {};
  const shop = isRecord(value.shop) ? value.shop : {};
  const album = Array.isArray(value.album) ? value.album : [];
  const praise = Array.isArray(value.praise) ? value.praise : [];
  const lessonsSource = isRecord(value.lessons) ? value.lessons : {};
  const lessons: Record<string, LessonProgress> = {};
  for (const [id, raw] of Object.entries(lessonsSource)) {
    if (!isRecord(raw)) continue;
    lessons[id] = {
      status: ['new', 'previewed', 'reviewed', 'mastered'].includes(String(raw.status))
        ? (raw.status as LessonStatus)
        : 'new',
      mastery: Math.min(3, Math.max(0, Number(raw.mastery) || 0)),
      lastAt: typeof raw.lastAt === 'string' ? raw.lastAt : undefined,
      dueAt: isValidDateKey(raw.dueAt) ? raw.dueAt : undefined,
      attempts: Number(raw.attempts) || 0,
      correct: Number(raw.correct) || 0,
    };
  }
  const dictationSource = isRecord(value.dictationQueue) ? value.dictationQueue : {};
  const dictationQueue: Record<string, DictationEntry> = {};
  for (const [id, raw] of Object.entries(dictationSource)) {
    if (!isRecord(raw) || !isValidDateKey(raw.dueAt)) continue;
    dictationQueue[id] = {
      wordId: typeof raw.wordId === 'string' ? raw.wordId : id,
      wrong: Number(raw.wrong) || 0,
      correct: Number(raw.correct) || 0,
      dueAt: raw.dueAt,
    };
  }
  const weaknessSource = isRecord(value.weakness) ? value.weakness : {};
  const weakness: Record<string, WeaknessEntry> = {};
  for (const [id, raw] of Object.entries(weaknessSource)) {
    if (!isRecord(raw)) continue;
    weakness[id] = {
      wrong: Number(raw.wrong) || 0,
      right: Number(raw.right) || 0,
      lastWrongAt: typeof raw.lastWrongAt === 'string' ? raw.lastWrongAt : undefined,
    };
  }
  const mistakes = Array.isArray(value.mistakes)
    ? value.mistakes.filter((item): item is Mistake => {
        return (
          isRecord(item) &&
          typeof item.questionId === 'string' &&
          typeof item.lessonId === 'string' &&
          typeof item.wrongAt === 'string'
        );
      })
    : [];
  const pointersSource = isRecord(value.pointers) ? value.pointers : {};
  const pointers = {
    chinese: Math.max(0, Number(pointersSource.chinese) || 0),
    math: Math.max(0, Number(pointersSource.math) || 0),
    english: Math.max(0, Number(pointersSource.english) || 0),
  };
  return {
    ...base,
    onboarded: value.onboarded === true,
    profile: {
      nickname:
        typeof profile.nickname === 'string' && profile.nickname.trim()
          ? profile.nickname.trim().slice(0, 12)
          : base.profile.nickname,
    },
    settings: {
      dailyMinutes: [15, 25, 35, 50].includes(Number(settings.dailyMinutes))
        ? Number(settings.dailyMinutes)
        : base.settings.dailyMinutes,
      deadlineHour:
        Number.isFinite(settings.deadlineHour) && Number(settings.deadlineHour) >= 15 && Number(settings.deadlineHour) <= 23
          ? Number(settings.deadlineHour)
          : base.settings.deadlineHour,
      dailyDrill: settings.dailyDrill === true,
      dictationMode: settings.dictationMode === 'handwrite' ? 'handwrite' : 'choice',
      ttsEnabled: settings.ttsEnabled !== false,
    },
    timetable: normalizeTimetable(value.timetable),
    lessons,
    pointers,
    mistakes,
    weakness,
    dictationQueue,
    rewards: {
      stars: Math.max(0, Number(rewards.stars) || 0),
      food: Math.max(0, Number(rewards.food) || 0),
      meals: Math.max(0, Number(rewards.meals) || 0),
      streak: Math.max(0, Number(rewards.streak) || 0),
      bestStreak: Math.max(0, Number(rewards.bestStreak) || 0),
      badges: Array.isArray(rewards.badges)
        ? rewards.badges.filter((id): id is string => typeof id === 'string')
        : [],
      lastAllDoneDate: isValidDateKey(rewards.lastAllDoneDate) ? rewards.lastAllDoneDate : undefined,
    },
    pet: {
      satiety: Math.min(100, Math.max(0, Number(pet.satiety) || 0)),
      stage: ([0, 1, 2].includes(Number(pet.stage)) ? Number(pet.stage) : 0) as 0 | 1 | 2,
      fedDays: Math.max(0, Number(pet.fedDays) || 0),
      lastFedDate: isValidDateKey(pet.lastFedDate) ? pet.lastFedDate : undefined,
      lastDecayDate: isValidDateKey(pet.lastDecayDate) ? pet.lastDecayDate : undefined,
      unlocked: Array.isArray(pet.unlocked)
        ? pet.unlocked.filter((id): id is string => typeof id === 'string')
        : [],
      equipped: isRecord(pet.equipped)
        ? Object.fromEntries(
            Object.entries(pet.equipped).filter(
              (entry): entry is [string, string] => typeof entry[1] === 'string',
            ),
          )
        : {},
      skin:
        typeof pet.skin === 'string' && PET_BY_ID[pet.skin] ? pet.skin : DEFAULT_PET_ID,
      stageSeen: ([0, 1, 2].includes(Number(pet.stageSeen))
        ? Number(pet.stageSeen)
        : undefined) as 0 | 1 | 2 | undefined,
    },
    shop: {
      owned: Array.isArray(shop.owned)
        ? Array.from(
            new Set(shop.owned.filter((id): id is string => typeof id === 'string' && !!PET_BY_ID[id])),
          )
        : [],
    },
    album: normalizeAlbum(album),
    praise: normalizePraise(praise),
    dailyPlans: normalizePlans(value.dailyPlans),
    dailyLogs: normalizeLogs(value.dailyLogs),
    freeLogs: normalizeFreeLogs(value.freeLogs),
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : new Date().toISOString(),
  };
}
