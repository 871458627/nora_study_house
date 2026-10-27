// 口算错题进错题本（docs/01 BUG-1 修复回归）：
// 口算任务答错 → 错题本带快照（lessonId 空）→ 重做页可渲染 → 订正。
import { describe, expect, it } from 'vitest';
import { applyTaskOutcome, applyMistakeRedo } from '../src/core/progress';
import { generateOralQuestions } from '../src/core/oralMath';
import { normalizeState } from '../src/core/model';
import { todayKey } from '../src/core/date';

function baseState(): ReturnType<typeof normalizeState> {
  return normalizeState({ schemaVersion: 1, onboarded: true, profile: { nickname: 'x' } })!;
}

const task = { id: '2026-10-26:oral:ma-u1-l1', kind: 'oral' as const, subject: 'math' as const, lessonId: 'ma-u1-l1', title: '口算', subtitle: '', minutes: 3 };

describe('口算错题闭环', () => {
  it('答错口算 → 错题本带完整快照（lessonId 空）', () => {
    let state = baseState()!;
    state = { ...state, dailyPlans: { [todayKey()]: { tasks: [task], generatedAt: 'x' } } };
    const questions = generateOralQuestions(task.id, 5, 'add-sub');
    const wrong = questions[1]!; // 故意用第 2 题作为答错题
    state = applyTaskOutcome(state, todayKey(), task, {
      correct: 4,
      total: 5,
      questions,
      weakness: [],
      wrongQuestionIds: [wrong.id],
      correctQuestionIds: questions.filter(q => q.id !== wrong.id).map(q => q.id),
    });
    const mistake = state.mistakes.find(m => m.questionId === wrong.id);
    expect(mistake).toBeDefined();
    expect(mistake!.lessonId).toBe('');
    expect(mistake!.snapshot?.stem).toBe(wrong.stem);
    expect(mistake!.snapshot?.answer).toBe(wrong.answer);
  });

  it('快照错题重做全对 → 订正销账', () => {
    let state = baseState()!;
    state = { ...state, dailyPlans: { [todayKey()]: { tasks: [task], generatedAt: 'x' } } };
    const questions = generateOralQuestions(task.id, 5, 'add-sub');
    const wrong = questions[0]!;
    state = applyTaskOutcome(state, todayKey(), task, {
      correct: 4, total: 5, questions, weakness: [],
      wrongQuestionIds: [wrong.id],
      correctQuestionIds: questions.filter(q => q.id !== wrong.id).map(q => q.id),
    });
    expect(state.mistakes.some(m => m.questionId === wrong.id && !m.resolvedAt)).toBe(true);

    // 重做：全对
    state = applyMistakeRedo(state, todayKey(), {
      correct: 1, total: 1, questions: [wrong], weakness: [],
      wrongQuestionIds: [],
      correctQuestionIds: [wrong.id],
    });
    const done = state.mistakes.find(m => m.questionId === wrong.id);
    expect(done?.resolvedAt).toBe(todayKey());
    expect(state.freeLogs[todayKey()]?.sessions).toBe(1);
  });
});
