import { BADGES } from '../data/defaults';
import { lessonById, lessonsForSubject } from '../data/content';
import type { Lesson, PlanTask } from '../data/types';
import { addDays, diffDays, rangeEndingAt } from './date';
import type {
  DailyLog,
  LessonProgress,
  SyncState,
  TaskOutcome,
} from './model';
import { emptyDailyLog, lessonProgress } from './model';
import { applyFeed, stageFromFedDays } from './pet';

function updateLessonRecord(
  state: SyncState,
  date: string,
  task: PlanTask,
  outcome: TaskOutcome,
): { lessons: Record<string, LessonProgress>; pointers: Record<PlanTask['subject'], number> } {
  const lessons = { ...state.lessons };
  const pointers = { ...state.pointers };
  if (task.kind !== 'review' && task.kind !== 'preview' && task.kind !== 'practice') {
    return { lessons, pointers };
  }
  const lesson = lessonById(task.lessonId);
  if (!lesson) return { lessons, pointers };

  const previous = lessonProgress(state, lesson.id);
  const rate = outcome.total > 0 ? outcome.correct / outcome.total : 0;
  let status = previous.status;
  let mastery = previous.mastery;
  let dueAt = previous.dueAt;

  if (task.kind === 'review') {
    if (rate >= 2 / 3) {
      status = 'reviewed';
      mastery = Math.max(1, mastery);
      dueAt = addDays(date, 1);
      const subjectLessons = lessonsForSubject(lesson.subject);
      const index = subjectLessons.findIndex(item => item.id === lesson.id);
      if (index >= 0) {
        pointers[lesson.subject] = Math.max(pointers[lesson.subject] ?? 0, index + 1);
      }
    }
  } else if (task.kind === 'preview') {
    if (status === 'new') status = 'previewed';
  } else {
    mastery = Math.max(0, mastery + (outcome.total > 0 && outcome.correct === outcome.total ? 1 : rate < 0.5 ? -1 : 0));
    if (mastery >= 3) {
      mastery = 3;
      status = 'mastered';
      dueAt = undefined;
    } else {
      if (status === 'new') status = 'reviewed';
      if (status !== 'mastered') {
        dueAt = addDays(date, mastery >= 2 ? 7 : 3);
      }
    }
  }

  lessons[lesson.id] = {
    status,
    mastery,
    lastAt: date,
    dueAt,
    attempts: previous.attempts + 1,
    correct: previous.correct + outcome.correct,
  };
  return { lessons, pointers };
}

function updateMistakes(
  state: SyncState,
  date: string,
  outcome: TaskOutcome,
): SyncState['mistakes'] {
  const map = new Map(state.mistakes.map(mistake => [mistake.questionId, mistake]));
  // 会话题目快照：口算等即时生成题不在任何课里，落库时带上完整题目供重做页直接渲染。
  const sessionQuestions = new Map((outcome.questions ?? []).map(question => [question.id, question]));
  for (const questionId of outcome.wrongQuestionIds) {
    const existing = map.get(questionId);
    if (existing) {
      map.set(questionId, { ...existing, wrongAt: date, resolvedAt: undefined });
      continue;
    }
    const lesson = lessonsForSubject('chinese')
      .concat(lessonsForSubject('math'), lessonsForSubject('english'))
      .find(item =>
        [...item.questions, ...(item.afterClass ?? [])].some(question => question.id === questionId),
      );
    if (lesson) {
      map.set(questionId, { questionId, lessonId: lesson.id, wrongAt: date });
    } else {
      const snapshot = sessionQuestions.get(questionId);
      if (snapshot) {
        // 非课本题（口算等）：lessonId 置空串 + 快照，错题本与重做页按快照渲染
        map.set(questionId, { questionId, lessonId: '', wrongAt: date, snapshot });
      }
    }
  }
  for (const questionId of outcome.correctQuestionIds ?? []) {
    const existing = map.get(questionId);
    if (existing && !existing.resolvedAt) {
      map.set(questionId, { ...existing, resolvedAt: date });
    }
  }
  return [...map.values()]
    .sort((a, b) => (a.wrongAt < b.wrongAt ? 1 : -1))
    .slice(0, 300);
}

function updateWeakness(state: SyncState, date: string, outcome: TaskOutcome): SyncState['weakness'] {
  const weakness = { ...state.weakness };
  for (const entry of outcome.weakness) {
    const previous = weakness[entry.pointId] ?? { wrong: 0, right: 0 };
    weakness[entry.pointId] = entry.correct
      ? { ...previous, right: previous.right + 1 }
      : { ...previous, wrong: previous.wrong + 1, lastWrongAt: date };
  }
  return weakness;
}

function updateDictation(
  state: SyncState,
  date: string,
  results: { wordId: string; correct: boolean }[] | undefined,
): SyncState['dictationQueue'] {
  if (!results?.length) return state.dictationQueue;
  const queue = { ...state.dictationQueue };
  for (const word of results) {
    const existing = queue[word.wordId];
    if (word.correct) {
      if (!existing) continue;
      const correct = existing.correct + 1;
      if (correct >= 2) {
        delete queue[word.wordId];
      } else {
        queue[word.wordId] = {
          ...existing,
          correct,
          dueAt: addDays(date, existing.wrong > 0 ? 3 : 7),
        };
      }
    } else {
      queue[word.wordId] = {
        wordId: word.wordId,
        wrong: (existing?.wrong ?? 0) + 1,
        correct: 0,
        dueAt: addDays(date, 1),
      };
    }
  }
  return queue;
}

function newlyEarnedBadges(state: SyncState, date: string, dictationPerfect: boolean): string[] {
  const earned = new Set(state.rewards.badges);
  const next: string[] = [];
  const add = (id: string) => {
    if (!earned.has(id)) {
      earned.add(id);
      next.push(id);
    }
  };

  if (Object.values(state.dailyLogs).some(log => log.done.length > 0)) add('first-step');
  if (state.rewards.streak >= 3) add('streak3');
  if (state.rewards.streak >= 7) add('streak7');
  if (state.rewards.streak >= 14) add('streak14');
  if (state.rewards.streak >= 30) add('streak30');
  const mastered = Object.values(state.lessons).filter(progress => progress.status === 'mastered').length;
  if (mastered >= 10) add('master10');
  if (dictationPerfect) add('dictation100');
  if (state.pet.fedDays >= 7) add('foodie');
  const allSubjects = (['chinese', 'math', 'english'] as const).every(subject =>
    lessonsForSubject(subject).some(lesson => {
      const progress = state.lessons[lesson.id];
      return progress?.status === 'reviewed' || progress?.status === 'mastered';
    }),
  );
  if (allSubjects) add('allround');
  if (rangeEndingAt(date, 7).every(day => state.dailyLogs[day]?.allDone === true)) {
    add('perfect-week');
  }
  return next;
}

function applyBadgeUnlocks(state: SyncState, badgeIds: string[]): SyncState['pet'] {
  if (!badgeIds.length) return state.pet;
  const unlocked = new Set(state.pet.unlocked);
  for (const badgeId of badgeIds) {
    const badge = BADGES.find(item => item.id === badgeId);
    if (badge?.accessory) unlocked.add(badge.accessory);
  }
  return { ...state.pet, unlocked: [...unlocked] };
}

function updateStreak(state: SyncState, date: string): SyncState['rewards'] {
  const rewards = state.rewards;
  const last = rewards.lastAllDoneDate;
  if (last === date) return rewards;
  if (last && diffDays(date, last) < 0) return rewards;
  const streak = last && diffDays(date, last) === 1 ? rewards.streak + 1 : 1;
  return {
    ...rewards,
    streak,
    bestStreak: Math.max(rewards.bestStreak, streak),
    lastAllDoneDate: date,
  };
}

export function applyTaskOutcome(
  state: SyncState,
  date: string,
  task: PlanTask,
  outcome: TaskOutcome,
): SyncState {
  const plan = state.dailyPlans[date];
  const tasks = plan?.tasks ?? [];
  const baseLog = state.dailyLogs[date] ?? emptyDailyLog(tasks.length);
  if (baseLog.done.includes(task.id)) return state;

  const { lessons, pointers } = updateLessonRecord(state, date, task, outcome);
  const dictationQueue = updateDictation(state, date, outcome.dictation);
  const mistakes = updateMistakes(state, date, outcome);
  const weakness = updateWeakness(state, date, outcome);
  const perfect = outcome.total > 0 && outcome.correct === outcome.total;
  const dictationWordResults = outcome.dictation ?? [];
  const dictationPerfect =
    dictationWordResults.length > 0 && dictationWordResults.every(word => word.correct);

  const log: DailyLog = {
    ...baseLog,
    planned: Math.max(baseLog.planned, tasks.length),
    done: [...baseLog.done, task.id],
    minutes: baseLog.minutes + task.minutes,
    stars: baseLog.stars + 1,
    food: baseLog.food + 1 + (perfect ? 1 : 0),
    dictationTotal: baseLog.dictationTotal + dictationWordResults.length,
    dictationCorrect: baseLog.dictationCorrect + dictationWordResults.filter(word => word.correct).length,
  };

  const allDone = log.planned > 0 && log.done.length >= log.planned;
  log.allDone = baseLog.allDone || allDone;

  let rewards: SyncState['rewards'] = {
    ...state.rewards,
    stars: state.rewards.stars + 1,
    food: state.rewards.food + 1 + (perfect ? 1 : 0),
  };

  if (allDone && !baseLog.allDone) {
    rewards = { ...rewards, meals: rewards.meals + 1 };
    rewards = updateStreak({ ...state, rewards }, date);
  }

  let next: SyncState = {
    ...state,
    lessons,
    pointers,
    dictationQueue,
    mistakes,
    weakness,
    rewards,
    dailyLogs: { ...state.dailyLogs, [date]: log },
    updatedAt: new Date().toISOString(),
  };

  const newBadges = newlyEarnedBadges(next, date, dictationPerfect);
  if (newBadges.length) {
    next = {
      ...next,
      rewards: { ...next.rewards, badges: [...next.rewards.badges, ...newBadges] },
    };
    next = { ...next, pet: applyBadgeUnlocks(next, newBadges) };
  }

  return next;
}

/** Accumulates the day's free-practice ledger; never touches rewards or plans. */
function recordFreeLog(
  state: SyncState,
  date: string,
  patch: { sessions?: number; questions?: number; correct?: number; dictationTotal?: number; dictationCorrect?: number },
): SyncState['freeLogs'] {
  const previous = state.freeLogs[date] ?? {
    sessions: 0,
    questions: 0,
    correct: 0,
    dictationTotal: 0,
    dictationCorrect: 0,
  };
  return {
    ...state.freeLogs,
    [date]: {
      sessions: previous.sessions + (patch.sessions ?? 0),
      questions: previous.questions + (patch.questions ?? 0),
      correct: previous.correct + (patch.correct ?? 0),
      dictationTotal: previous.dictationTotal + (patch.dictationTotal ?? 0),
      dictationCorrect: previous.dictationCorrect + (patch.dictationCorrect ?? 0),
    },
  };
}

/**
 * Textbook practice outside the daily plan: records attempts, mistakes,
 * weakness, dictation queue and a separate daily ledger. It never grants
 * stars or food, never touches the plan log and never advances mastery.
 */
export function applyFreePractice(
  state: SyncState,
  date: string,
  lesson: Lesson,
  outcome: TaskOutcome,
): SyncState {
  const previous = lessonProgress(state, lesson.id);
  const lessons: Record<string, LessonProgress> = {
    ...state.lessons,
    [lesson.id]: {
      ...previous,
      attempts: previous.attempts + 1,
      correct: previous.correct + outcome.correct,
      lastAt: date,
    },
  };
  const words = outcome.dictation ?? [];
  return {
    ...state,
    lessons,
    mistakes: updateMistakes(state, date, outcome),
    weakness: updateWeakness(state, date, outcome),
    dictationQueue: updateDictation(state, date, words),
    freeLogs: recordFreeLog(state, date, {
      sessions: 1,
      questions: outcome.total,
      correct: outcome.correct,
      dictationTotal: words.length,
      dictationCorrect: words.filter(word => word.correct).length,
    }),
    updatedAt: new Date().toISOString(),
  };
}

/** 快照错题重做（口算等）：只做订正与练习计数，不挂任何课。 */
export function applyMistakeRedo(
  state: SyncState,
  date: string,
  outcome: TaskOutcome,
): SyncState {
  if (outcome.total === 0) return state;
  return {
    ...state,
    mistakes: updateMistakes(state, date, outcome),
    freeLogs: recordFreeLog(state, date, {
      sessions: 1,
      questions: outcome.total,
      correct: outcome.correct,
    }),
    updatedAt: new Date().toISOString(),
  };
}

/** Rehearses words that are due, without claiming a plan task or a reward. */
export function applyFreeDictation(
  state: SyncState,
  date: string,
  words: { wordId: string; correct: boolean }[],
): SyncState {
  if (!words.length) return state;
  return {
    ...state,
    dictationQueue: updateDictation(state, date, words),
    freeLogs: recordFreeLog(state, date, {
      sessions: 1,
      dictationTotal: words.length,
      dictationCorrect: words.filter(word => word.correct).length,
    }),
    updatedAt: new Date().toISOString(),
  };
}

export function feedPet(
  state: SyncState,
  date: string,
  kind: 'food' | 'meal',
): { state: SyncState; ok: boolean } {
  const available = kind === 'food' ? state.rewards.food : state.rewards.meals;
  if (available <= 0) return { state, ok: false };
  const rewards = {
    ...state.rewards,
    food: kind === 'food' ? state.rewards.food - 1 : state.rewards.food,
    meals: kind === 'meal' ? state.rewards.meals - 1 : state.rewards.meals,
  };
  const pet = applyFeed(state.pet, date, kind);
  return {
    ok: true,
    state: {
      ...state,
      rewards,
      pet: {
        ...pet,
        stage: stageFromFedDays(pet.fedDays),
        unlocked: pet.unlocked,
      },
      updatedAt: new Date().toISOString(),
    },
  };
}
