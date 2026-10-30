// 每周数学错题复盘（2026-10-26 需求）：周日计划追加复盘任务、抽本周错题（含口算快照题）。
import { describe, expect, it } from 'vitest';
import { generatePlan } from '../src/core/plan';
import { applyTaskOutcome, applyMistakeRedo } from '../src/core/progress';
import { normalizeState, type SyncState } from '../src/core/model';
import { generateOralQuestions } from '../src/core/oralMath';
import { addDays, todayKey } from '../src/core/date';

// 找一个周日
function findSunday(): string {
  const d = todayKey();
  for (let i = 0; i < 7; i += 1) {
    const day = addDays(d, i);
    if (new Date(day + 'T00:00:00').getDay() === 0) return day;
  }
  return d;
}

function setupWithMathMistakes(): SyncState {
  let state = normalizeState({ schemaVersion: 1, onboarded: true, profile: { nickname: 'x' } })!;
  const task = { id: '2026-10-26:oral:ma-u1-l1', kind: 'oral' as const, subject: 'math' as const, lessonId: 'ma-u1-l1', title: '口算', subtitle: '', minutes: 3 };
  const questions = generateOralQuestions(task.id, 5, 'add-sub');
  const wrong = questions[0]!;
  state = applyTaskOutcome(state, todayKey(), task, {
    correct: 4, total: 5, questions, weakness: [],
    wrongQuestionIds: [wrong.id],
    correctQuestionIds: questions.filter(q => q.id !== wrong.id).map(q => q.id),
  });
  // 再加一道课本数学错题
  state = applyTaskOutcome(state, todayKey(), task, {
    correct: 4, total: 5, questions, weakness: [],
    wrongQuestionIds: [wrong.id + '-x'], // 不存在的题：不会入库，仅保持状态
    correctQuestionIds: [],
  });
  return state;
}

describe('每周数学错题复盘', () => {
  it('周日计划包含“数学错题复盘”且题目来自本周错题（含快照）', () => {
    const state = setupWithMathMistakes();
    const sunday = findSunday();
    const tasks = generatePlan(state, sunday);
    const review = tasks.find(t => t.title === '数学错题复盘');
    expect(review).toBeDefined();
    expect(review!.questionIds!.length).toBeGreaterThan(0);
    expect(review!.questionIds!.length).toBeLessThanOrEqual(10);
  });

  it('非周日不生成复盘任务', () => {
    const state = setupWithMathMistakes();
    // 找一个非周日
    let day = todayKey();
    for (let i = 0; i < 7; i += 1) {
      const d = addDays(day, i);
      if (new Date(d + 'T00:00:00').getDay() !== 0) { day = d; break; }
    }
    const tasks = generatePlan(state, day);
    expect(tasks.find(t => t.title === '数学错题复盘')).toBeUndefined();
  });

  it('复盘答题全对 → 错题订正（applyMistakeRedo 通道）', () => {
    let state = setupWithMathMistakes();
    const wrong = state.mistakes.find(m => !m.resolvedAt)!;
    state = applyMistakeRedo(state, todayKey(), {
      correct: 1, total: 1, questions: wrong.snapshot ? [wrong.snapshot] : [], weakness: [],
      wrongQuestionIds: [],
      correctQuestionIds: wrong.snapshot ? [wrong.snapshot.id] : [],
    });
    expect(state.mistakes.find(m => m.questionId === wrong.questionId)?.resolvedAt).toBeTruthy();
  });
});
