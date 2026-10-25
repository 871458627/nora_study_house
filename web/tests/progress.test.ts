import { describe, expect, it } from 'vitest';
import { chineseLessons } from '../src/data/content/chinese';
import { lessonsForSubject } from '../src/data/content';
import { createInitialState, emptyDailyLog, type SyncState, type TaskOutcome } from '../src/core/model';
import { makeReviewTask } from '../src/core/plan';
import { applyFreePractice, applyTaskOutcome, feedPet } from '../src/core/progress';
import type { PlanTask } from '../src/data/types';

const lesson = chineseLessons[0];
const date = '2026-10-22';

function outcome(partial: Partial<TaskOutcome> = {}): TaskOutcome {
  return {
    correct: 3,
    total: 3,
    weakness: [{ pointId: lesson.review.points[0].id, correct: true }],
    wrongQuestionIds: [],
    correctQuestionIds: lesson.questions.map(question => question.id),
    ...partial,
  };
}

function withTask(state: SyncState, task: PlanTask, taskDate = date): SyncState {
  return {
    ...state,
    dailyPlans: {
      ...state.dailyPlans,
      [taskDate]: { tasks: [task], generatedAt: new Date().toISOString() },
    },
    dailyLogs: { ...state.dailyLogs, [taskDate]: emptyDailyLog(1) },
  };
}

describe('task progress', () => {
  it('passes a review, advances the pointer and schedules repetition', () => {
    const state = createInitialState();
    const task = makeReviewTask(date, lesson, 'review');
    const next = applyTaskOutcome(withTask(state, task), date, task, outcome());
    expect(next.pointers.chinese).toBe(1);
    const progress = next.lessons[lesson.id];
    expect(progress.status).toBe('reviewed');
    expect(progress.mastery).toBe(1);
    expect(progress.dueAt).toBe('2026-10-23');
    expect(next.rewards.stars).toBe(1);
    expect(next.rewards.food).toBe(2);
    expect(next.dailyLogs[date].done).toEqual([task.id]);
  });

  it('does not advance on a failed review', () => {
    const state = createInitialState();
    const task = makeReviewTask(date, lesson, 'review');
    const next = applyTaskOutcome(
      withTask(state, task),
      date,
      task,
      outcome({ correct: 1, total: 3, wrongQuestionIds: ['x'], weakness: [] }),
    );
    expect(next.pointers.chinese).toBe(0);
    expect(next.lessons[lesson.id]?.status).toBe('new');
    expect(next.dailyLogs[date].done).toHaveLength(1);
  });

  it('raises mastery through practice and masters at three', () => {
    const base: SyncState = {
      ...createInitialState(),
      pointers: { chinese: 1, math: 0, english: 0 },
      lessons: {
        [lesson.id]: {
          status: 'reviewed',
          mastery: 1,
          dueAt: '2026-10-22',
          attempts: 1,
          correct: 3,
        },
      },
    };
    const task = makeReviewTask(date, lesson, 'practice');
    const second = applyTaskOutcome(withTask(base, task), date, task, outcome());
    expect(second.lessons[lesson.id]?.mastery).toBe(2);
    expect(second.lessons[lesson.id]?.dueAt).toBe('2026-10-29');
    const nextDate = '2026-10-29';
    const third = applyTaskOutcome(withTask(second, task, nextDate), nextDate, task, outcome());
    expect(third.lessons[lesson.id]?.mastery).toBe(3);
    expect(third.lessons[lesson.id]?.status).toBe('mastered');
    expect(third.lessons[lesson.id]?.dueAt).toBeUndefined();
  });

  it('awards the meal and streak once when the whole plan is done', () => {
    const math = lessonsForSubject('math')[0];
    const tasks = [makeReviewTask(date, lesson, 'review'), makeReviewTask(date, math, 'review')];
    const base: SyncState = {
      ...createInitialState(),
      dailyPlans: { [date]: { tasks, generatedAt: new Date().toISOString() } },
      dailyLogs: { [date]: emptyDailyLog(2) },
    };
    const first = applyTaskOutcome(base, date, tasks[0], outcome());
    expect(first.rewards.meals).toBe(0);
    expect(first.rewards.streak).toBe(0);
    expect(first.dailyLogs[date].food).toBe(2);
    const second = applyTaskOutcome(first, date, tasks[1], outcome());
    expect(second.rewards.meals).toBe(1);
    expect(second.rewards.streak).toBe(1);
    expect(second.dailyLogs[date].allDone).toBe(true);
    const duplicate = applyTaskOutcome(second, date, tasks[1], outcome());
    expect(duplicate.rewards.meals).toBe(1);
    expect(duplicate.rewards.stars).toBe(2);
  });

  it('records and resolves mistakes, and updates weakness', () => {
    const state = createInitialState();
    const task = makeReviewTask(date, lesson, 'review');
    const point = lesson.review.points[0].id;
    const wrong = applyTaskOutcome(
      withTask(state, task),
      date,
      task,
      outcome({
        correct: 2,
        weakness: [{ pointId: point, correct: false }],
        wrongQuestionIds: [lesson.questions[0].id],
        correctQuestionIds: [],
      }),
    );
    expect(wrong.mistakes).toHaveLength(1);
    expect(wrong.weakness[point].wrong).toBe(1);
    const task2 = { ...task, id: `${task.id}:retry` };
    const fixed = applyTaskOutcome(
      withTask(wrong, task2),
      date,
      task2,
      outcome({ weakness: [{ pointId: point, correct: true }] }),
    );
    expect(fixed.mistakes[0].resolvedAt).toBe(date);
    expect(fixed.weakness[point].right).toBe(1);
  });

  it('requeues a wrong dictation word and clears it after two correct tries', () => {
    const word = lesson.dictation![0];
    const makeTask = (id: string): PlanTask => ({
      id,
      kind: 'dictation',
      subject: 'chinese',
      lessonId: lesson.id,
      title: '听写',
      subtitle: '',
      minutes: 3,
    });
    const firstTask = makeTask('d1');
    const first = applyTaskOutcome(
      withTask(createInitialState(), firstTask),
      date,
      firstTask,
      outcome({ dictation: [{ wordId: word.id, correct: false }] }),
    );
    expect(first.dictationQueue[word.id]?.dueAt).toBe('2026-10-23');

    const secondTask = makeTask('d2');
    const second = applyTaskOutcome(
      withTask(first, secondTask, '2026-10-23'),
      '2026-10-23',
      secondTask,
      outcome({ dictation: [{ wordId: word.id, correct: true }] }),
    );
    expect(second.dictationQueue[word.id]?.correct).toBe(1);

    const thirdTask = makeTask('d3');
    const third = applyTaskOutcome(
      withTask(second, thirdTask, '2026-10-26'),
      '2026-10-26',
      thirdTask,
      outcome({ dictation: [{ wordId: word.id, correct: true }] }),
    );
    expect(third.dictationQueue[word.id]).toBeUndefined();
  });

  it('does not award plan rewards for free textbook practice', () => {
    const state = createInitialState();
    const next = applyFreePractice(state, date, lesson, outcome());
    expect(next.rewards.stars).toBe(0);
    expect(next.lessons[lesson.id]?.attempts).toBe(1);
    expect(next.lessons[lesson.id]?.dueAt).toBeUndefined();
  });
});

describe('pet', () => {
  it('feeds once per day and advances the growth stage after 14 days', () => {
    let state = createInitialState();
    const first = feedPet({ ...state, rewards: { ...state.rewards, food: 2 } }, date, 'food');
    expect(first.ok).toBe(true);
    expect(first.state.pet.satiety).toBe(80);
    expect(first.state.pet.fedDays).toBe(1);
    const second = feedPet(first.state, date, 'food');
    expect(second.state.pet.fedDays).toBe(1);
    expect(second.state.pet.satiety).toBe(90);
    state = { ...second.state, pet: { ...second.state.pet, fedDays: 13 } };
    const third = feedPet(
      { ...state, rewards: { ...state.rewards, food: 1 } },
      '2026-10-23',
      'food',
    );
    expect(third.state.pet.fedDays).toBe(14);
    expect(third.state.pet.stage).toBe(1);
  });
});
