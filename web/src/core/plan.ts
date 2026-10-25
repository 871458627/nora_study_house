import { dictationWordById, lessonAt, lessonsForSubject, lessonById } from '../data/content';
import type { DictationWord, Lesson, PlanTask, Question, SubjectId } from '../data/types';
import { addDays, diffDays, weekdayIndex } from './date';
import { currentLessonIndex, type SyncState } from './model';
import { generateOralQuestions, oralStageForLesson, oralSubtitle } from './oralMath';

const TASK_MINUTES = {
  review: 6,
  preview: 5,
  practice: 5,
  dictation: 3,
  oral: 3,
  words: 3,
  weak: 8,
} as const;

const SCHEDULED: SubjectId[] = ['chinese', 'math', 'english'];

export function scheduledSubjects(state: SyncState, date: string): SubjectId[] {
  const row = state.timetable[weekdayIndex(date)] ?? [];
  const seen = new Set<SubjectId>();
  for (const slot of row) {
    if (slot === 'chinese' || slot === 'math' || slot === 'english') seen.add(slot);
  }
  return SCHEDULED.filter(subject => seen.has(subject));
}

function reviewLesson(state: SyncState, subject: SubjectId): Lesson | undefined {
  const lessons = lessonsForSubject(subject);
  return lessons[currentLessonIndex(state, subject)];
}

function previewLesson(state: SyncState, subject: SubjectId): Lesson | undefined {
  const lessons = lessonsForSubject(subject);
  return lessons[currentLessonIndex(state, subject) + 1];
}

export function makeTaskId(date: string, kind: PlanTask['kind'], lessonId: string): string {
  return `${date}:${kind}:${lessonId}`;
}

export function makeReviewTask(date: string, lesson: Lesson, kind: 'review' | 'preview' | 'practice'): PlanTask {
  const label =
    kind === 'review' ? '复习' : kind === 'preview' ? '预习' : '巩固';
  const subtitle =
    kind === 'preview'
      ? `明天的课 · 知识卡 + 2 道题`
      : kind === 'review'
        ? `知识卡 + ${lesson.questions.length} 道题`
        : lesson.subject === 'math' && lesson.afterClass?.length
          ? `${lesson.afterClass.length} 道课后练习`
          : `到期复习 · ${lesson.questions.length} 道题`;
  return {
    id: makeTaskId(date, kind, lesson.id),
    kind,
    subject: lesson.subject,
    lessonId: lesson.id,
    title: `第 ${lesson.order} 课 · ${lesson.title}`,
    subtitle: `${label} · ${subtitle}`,
    minutes: TASK_MINUTES[kind],
  };
}

export function dictationWordsForPlan(state: SyncState, date: string, lesson: Lesson): DictationWord[] {
  const due = Object.values(state.dictationQueue)
    .filter(entry => entry.dueAt <= date)
    .map(entry => dictationWordById(entry.wordId))
    .filter((word): word is DictationWord => Boolean(word));
  const base = lesson.dictation ?? [];
  const unique = new Map<string, DictationWord>();
  for (const word of due.slice(0, 2)) unique.set(word.id, word);
  for (const word of base) {
    if (!unique.has(word.id)) unique.set(word.id, word);
  }
  return [...unique.values()].slice(0, 5);
}

export function makeDictationTask(state: SyncState, date: string, lesson: Lesson): PlanTask | null {
  const words = dictationWordsForPlan(state, date, lesson);
  if (!words.length) return null;
  return {
    id: makeTaskId(date, 'dictation', lesson.id),
    kind: 'dictation',
    subject: 'chinese',
    lessonId: lesson.id,
    title: `第 ${lesson.order} 课 · 生字听写`,
    subtitle: `${words.length} 个词语 · ${state.settings.dictationMode === 'type' ? '听音写字' : '听音选字'}`,
    minutes: TASK_MINUTES.dictation,
    wordIds: words.map(word => word.id),
  };
}

function makeWordsTask(date: string, lesson: Lesson): PlanTask | null {
  if (!lesson.words?.length) return null;
  return {
    id: makeTaskId(date, 'words', lesson.id),
    kind: 'words',
    subject: 'english',
    lessonId: lesson.id,
    title: `第 ${lesson.order} 课 · 单词卡`,
    subtitle: `${lesson.words.length} 个单词 · 点读 · 选义 · 句子排序`,
    minutes: TASK_MINUTES.words,
  };
}

function makeOralTask(state: SyncState, date: string): PlanTask {
  const lesson = reviewLesson(state, 'math');
  return {
    id: makeTaskId(date, 'oral', lesson?.id ?? 'math'),
    kind: 'oral',
    subject: 'math',
    lessonId: lesson?.id ?? '',
    title: '口算小练习',
    subtitle: oralSubtitle(oralStageForLesson(lesson?.id)),
    minutes: TASK_MINUTES.oral,
  };
}

export function buildWeakQuestions(state: SyncState): { questions: Question[] } {
  const selected: Question[] = [];
  const seen = new Set<string>();

  const unresolved = [...state.mistakes]
    .filter(mistake => !mistake.resolvedAt)
    .sort((a, b) => (a.wrongAt < b.wrongAt ? 1 : -1));

  for (const mistake of unresolved) {
    if (selected.length >= 3) break;
    const lesson = lessonById(mistake.lessonId);
    const question = lesson?.questions.find(item => item.id === mistake.questionId);
    if (question && !seen.has(question.id)) {
      seen.add(question.id);
      selected.push(question);
    }
  }

  const rankedPoints = Object.entries(state.weakness)
    .map(([id, entry]) => ({
      id,
      score: entry.wrong * 2 - entry.right,
      wrong: entry.wrong,
    }))
    .filter(entry => entry.wrong > 0 && entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(entry => entry.id);

  if (rankedPoints.length) {
    for (const subject of SCHEDULED) {
      for (const lesson of lessonsForSubject(subject)) {
        for (const question of lesson.questions) {
          if (selected.length >= 5) break;
          if (seen.has(question.id)) continue;
          if (question.knowledgePointIds.some(id => rankedPoints.includes(id))) {
            seen.add(question.id);
            selected.push(question);
          }
        }
      }
    }
  }

  if (!selected.length) {
    // Nothing recorded yet: revisit the first lesson that has not been mastered.
    for (const subject of SCHEDULED) {
      const lesson = lessonsForSubject(subject).find(item => state.lessons[item.id]?.status !== 'mastered');
      if (lesson?.questions.length) {
        selected.push(...lesson.questions.slice(0, 2));
        break;
      }
    }
  }

  return { questions: selected };
}

function makeWeakTask(state: SyncState, date: string): PlanTask | null {
  const { questions } = buildWeakQuestions(state);
  if (!questions.length) return null;
  const lesson = [...lessonsForSubject('chinese'), ...lessonsForSubject('math'), ...lessonsForSubject('english')]
    .find(item => item.questions.some(question => question.id === questions[0].id));
  if (!lesson) return null;
  return {
    id: makeTaskId(date, 'weak', lesson.id),
    kind: 'weak',
    subject: lesson.subject,
    lessonId: lesson.id,
    title: '薄弱点复习',
    subtitle: `${questions.length} 道题 · 来自错题本与薄弱知识点`,
    minutes: TASK_MINUTES.weak,
    questionIds: questions.map(question => question.id),
  };
}

/**
 * Builds an ordered daily plan. Plans are persisted by the reducer so they
 * stay stable while a child works through them during the day.
 */
export function generatePlan(state: SyncState, date: string): PlanTask[] {
  const tasks: PlanTask[] = [];
  const reviewLessonIds = new Set<string>();
  const previewLessonIds = new Set<string>();
  const todaySubjects = scheduledSubjects(state, date);

  for (const subject of todaySubjects) {
    const lesson = reviewLesson(state, subject);
    if (!lesson) continue;
    reviewLessonIds.add(lesson.id);
    tasks.push(makeReviewTask(date, lesson, 'review'));
    if (subject === 'chinese') {
      const dictation = makeDictationTask(state, date, lesson);
      if (dictation) tasks.push(dictation);
    } else if (subject === 'english') {
      const words = makeWordsTask(date, lesson);
      if (words) tasks.push(words);
    } else {
      tasks.push(makeOralTask(state, date));
    }
  }

  const tomorrowSubjects = todaySubjects.length ? scheduledSubjects(state, addDays(date, 1)) : [];
  for (const subject of tomorrowSubjects) {
    const lesson = previewLesson(state, subject);
    if (!lesson || reviewLessonIds.has(lesson.id)) continue;
    if (tasks.some(task => task.kind === 'preview' && task.lessonId === lesson.id)) continue;
    previewLessonIds.add(lesson.id);
    tasks.push(makeReviewTask(date, lesson, 'preview'));
  }

  const due = Object.entries(state.lessons)
    .filter(([id, progress]) =>
      progress.dueAt !== undefined &&
      progress.dueAt <= date &&
      progress.status !== 'mastered' &&
      !reviewLessonIds.has(id) &&
      !previewLessonIds.has(id) &&
      progress.status !== 'new',
    )
    .map(([id, progress]) => ({ lesson: lessonById(id), dueAt: progress.dueAt as string }))
    .filter((entry): entry is { lesson: Lesson; dueAt: string } => Boolean(entry.lesson))
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt) || a.lesson.order - b.lesson.order)
    .slice(0, 2);

  for (const entry of due) {
    tasks.push(makeReviewTask(date, entry.lesson, 'practice'));
  }

  const isSunday = weekdayIndex(date) === 6;
  if (isSunday && !tasks.some(task => task.kind === 'weak')) {
    const weak = makeWeakTask(state, date);
    if (weak) tasks.push(weak);
  }

  const hasScheduledWork = tasks.some(
    task => task.kind === 'review' || task.kind === 'preview' || task.kind === 'practice',
  );
  if (!hasScheduledWork) {
    const chinese = reviewLesson(state, 'chinese');
    if (!tasks.some(task => task.kind === 'weak')) {
      const weak = makeWeakTask(state, date);
      if (weak) tasks.push(weak);
    }
    if (!tasks.some(task => task.kind === 'dictation') && chinese) {
      const dictation = makeDictationTask(state, date, chinese);
      if (dictation) tasks.push(dictation);
    }
    if (!tasks.some(task => task.kind === 'oral')) {
      tasks.push(makeOralTask(state, date));
    }
  } else if (state.settings.dailyDrill && !tasks.some(task => task.kind === 'oral')) {
    tasks.push(makeOralTask(state, date));
  }

  const cap = state.settings.dailyMinutes;
  const kept: PlanTask[] = [];
  let total = 0;
  for (const task of tasks) {
    if (kept.length > 0 && total + task.minutes > cap) continue;
    kept.push(task);
    total += task.minutes;
  }
  return kept;
}

export function planProgress(state: SyncState, date: string): { planned: number; done: number; minutes: number } {
  const plan = state.dailyPlans[date];
  const log = state.dailyLogs[date];
  return {
    planned: plan?.tasks.length ?? 0,
    done: log?.done.length ?? 0,
    minutes: log?.minutes ?? 0,
  };
}

export function taskById(state: SyncState, date: string, taskId: string): PlanTask | undefined {
  return state.dailyPlans[date]?.tasks.find(task => task.id === taskId);
}

export function questionsForTask(task: PlanTask): Question[] {
  if (task.kind === 'weak') {
    const ids = task.questionIds ?? [];
    const all = [...lessonsForSubject('chinese'), ...lessonsForSubject('math'), ...lessonsForSubject('english')];
    return ids
      .map(id => all.flatMap(lesson => lesson.questions).find(question => question.id === id))
      .filter((question): question is Question => Boolean(question));
  }
  if (task.kind === 'oral') {
    return generateOralQuestions(task.id, 5, oralStageForLesson(task.lessonId));
  }
  const lesson = lessonById(task.lessonId);
  if (!lesson) return [];
  if (task.kind === 'preview') return lesson.questions.slice(0, 2);
  if (task.kind === 'practice' && lesson.subject === 'math' && lesson.afterClass?.length) {
    return lesson.afterClass;
  }
  return lesson.questions;
}

export function wordIdsForTask(task: PlanTask): DictationWord[] {
  if (task.kind === 'dictation') {
    return (task.wordIds ?? [])
      .map(id => dictationWordById(id))
      .filter((word): word is DictationWord => Boolean(word));
  }
  const lesson = lessonById(task.lessonId);
  return lesson?.dictation ?? [];
}

export function lessonsDueSoon(state: SyncState, date: string): Lesson[] {
  return Object.entries(state.lessons)
    .filter(([, progress]) => progress.dueAt && diffDays(progress.dueAt, date) >= 0 && progress.dueAt <= addDays(date, 2))
    .map(([id]) => lessonById(id))
    .filter((lesson): lesson is Lesson => Boolean(lesson));
}

export function lessonPointerFor(state: SyncState, subject: SubjectId): Lesson | undefined {
  return lessonAt(subject, currentLessonIndex(state, subject));
}
