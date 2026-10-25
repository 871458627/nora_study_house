import { describe, expect, it } from 'vitest';
import { lessonsForSubject } from '../src/data/content';
import { createInitialState, type SyncState } from '../src/core/model';
import { appReducer } from '../src/core/state';
import { generatePlan, questionsForTask } from '../src/core/plan';

function readyState(): SyncState {
  const state = createInitialState();
  return {
    ...state,
    onboarded: true,
    pet: { ...state.pet, lastDecayDate: '2026-10-22' },
  };
}

describe('set-pointer', () => {
  it('moves the current lesson without clearing existing progress', () => {
    const state: SyncState = {
      ...readyState(),
      lessons: {
        'cn-u1-l1': { status: 'reviewed', mastery: 2, attempts: 2, correct: 5 },
      },
    };
    const next = appReducer(state, { type: 'set-pointer', subject: 'chinese', index: 3 });
    expect(next.pointers.chinese).toBe(3);
    expect(next.lessons['cn-u1-l1'].mastery).toBe(2);
  });

  it('clamps the pointer to the available lessons', () => {
    const lessons = lessonsForSubject('math');
    const high = appReducer(readyState(), { type: 'set-pointer', subject: 'math', index: 999 });
    const low = appReducer(readyState(), { type: 'set-pointer', subject: 'math', index: -5 });
    expect(high.pointers.math).toBe(lessons.length - 1);
    expect(low.pointers.math).toBe(0);
  });
});

describe('plan with a parent-set current lesson', () => {
  it('reviews the chosen lesson and previews the next one', () => {
    const chinese = lessonsForSubject('chinese');
    const state = appReducer(readyState(), { type: 'set-pointer', subject: 'chinese', index: 4 });
    const tasks = generatePlan(state, '2026-10-22');
    const review = tasks.find(task => task.kind === 'review' && task.subject === 'chinese');
    const preview = tasks.find(task => task.kind === 'preview' && task.subject === 'chinese');
    expect(review?.lessonId).toBe(chinese[4].id);
    expect(preview?.lessonId).toBe(chinese[5].id);
  });

  it('keeps oral math inside the current math unit', () => {
    const early = generatePlan(readyState(), '2026-10-22');
    const earlyOral = early.find(task => task.kind === 'oral');
    expect(earlyOral?.subtitle).toContain('100 以内加减');
    expect(earlyOral?.subtitle).not.toContain('乘法');
    const earlyQuestions = earlyOral ? questionsForTask(earlyOral) : [];
    expect(earlyQuestions.length).toBe(5);
    expect(earlyQuestions.every(question => !question.stem.includes('×'))).toBe(true);

    const later = appReducer(readyState(), { type: 'set-pointer', subject: 'math', index: 9 });
    const laterTasks = generatePlan(later, '2026-10-22');
    const laterOral = laterTasks.find(task => task.kind === 'oral');
    expect(laterOral?.subtitle).toContain('表内乘法');
    const laterQuestions = laterOral ? questionsForTask(laterOral) : [];
    expect(laterQuestions.length).toBe(5);
    expect(laterQuestions.every(question => !question.stem.includes('÷'))).toBe(true);
  });
});
