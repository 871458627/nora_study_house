import { describe, expect, it } from 'vitest';
import { lessonById, lessonsForSubject } from '../src/data/content';
import { dateKey } from '../src/core/date';
import { createInitialState, type SyncState } from '../src/core/model';
import { generatePlan, questionsForTask } from '../src/core/plan';

function readyState(): SyncState {
  const state = createInitialState();
  return {
    ...state,
    onboarded: true,
    pet: { ...state.pet, lastDecayDate: '2026-10-22' },
  };
}

describe('generatePlan', () => {
  it('builds a stable, unique plan for a weekday', () => {
    const state = readyState();
    const tasks = generatePlan(state, '2026-10-22');
    const kinds = tasks.map(task => task.kind);
    expect(kinds.filter(kind => kind === 'review')).toHaveLength(2);
    expect(kinds).toContain('dictation');
    expect(kinds).toContain('oral');
    expect(kinds.filter(kind => kind === 'preview')).toHaveLength(3);
    expect(new Set(tasks.map(task => task.id)).size).toBe(tasks.length);
    expect(tasks.reduce((sum, task) => sum + task.minutes, 0)).toBeLessThanOrEqual(35);
    expect(tasks[0]?.lessonId).toBe('cn-u1-l1');
  });

  it('drops lower-priority tasks at a smaller daily cap', () => {
    const state: SyncState = {
      ...readyState(),
      settings: { ...readyState().settings, dailyMinutes: 15 },
    };
    const tasks = generatePlan(state, '2026-10-22');
    expect(tasks.length).toBeLessThan(5);
    expect(tasks.some(task => task.kind === 'preview')).toBe(false);
  });

  it('adds due consolidation tasks when time allows', () => {
    const state: SyncState = {
      ...readyState(),
      settings: { ...readyState().settings, dailyMinutes: 50 },
      pointers: { chinese: 1, math: 1, english: 0 },
      lessons: {
        'cn-u1-l1': { status: 'reviewed', mastery: 1, dueAt: '2026-10-22', attempts: 1, correct: 3 },
        'ma-u1-l1': { status: 'reviewed', mastery: 1, dueAt: '2026-10-22', attempts: 1, correct: 3 },
      },
    };
    const tasks = generatePlan(state, '2026-10-22');
    const practice = tasks.filter(task => task.kind === 'practice');
    expect(practice.map(task => task.lessonId)).toEqual(['cn-u1-l1', 'ma-u1-l1']);
    expect(tasks.reduce((sum, task) => sum + task.minutes, 0)).toBeLessThanOrEqual(50);
  });

  it('falls back to review, dictation and oral on an empty weekend', () => {
    const state = readyState();
    const tasks = generatePlan(state, '2026-10-25');
    expect(tasks.map(task => task.kind)).toEqual(['weak', 'dictation', 'oral']);
    expect(tasks[0].questionIds).toHaveLength(2);
  });

  it('uses the next lesson for preview and skips when exhausted', () => {
    const state = readyState();
    const tasks = generatePlan(state, '2026-10-22');
    const preview = tasks.find(task => task.kind === 'preview' && task.subject === 'chinese');
    const lessons = lessonsForSubject('chinese');
    expect(preview?.lessonId).toBe(lessons[1].id);
    const last = {
      ...state,
      pointers: { ...state.pointers, chinese: lessons.length - 1 },
    };
    const next = generatePlan(last, '2026-10-22');
    expect(next.some(task => task.kind === 'review' && task.subject === 'chinese')).toBe(true);
    expect(next.some(task => task.kind === 'preview' && task.subject === 'chinese')).toBe(false);
  });

  it('resolves question sets for each task kind', () => {
    const state = readyState();
    const tasks = generatePlan(state, '2026-10-22');
    for (const task of tasks) {
      if (task.kind === 'dictation' || task.kind === 'words') continue;
      const questions = questionsForTask(task);
      expect(questions.length).toBeGreaterThan(0);
      if (task.kind === 'weak') {
        expect(questions.map(question => question.id)).toEqual(task.questionIds);
      }
    }
    const mathPractice = tasks.find(task => task.kind === 'oral');
    expect(mathPractice && questionsForTask(mathPractice)).toHaveLength(5);
  });

  it('keeps dates local and deterministic', () => {
    expect(dateKey(new Date(2026, 9, 22))).toBe('2026-10-22');
    expect(lessonById('cn-u1-l1')?.title).toBe('小蝌蚪找妈妈');
  });
});
