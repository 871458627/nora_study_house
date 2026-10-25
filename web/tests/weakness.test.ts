import { describe, expect, it } from 'vitest';
import { chineseLessons } from '../src/data/content/chinese';
import { gradeSession, type ResponseValue } from '../src/core/grading';
import type { Question } from '../src/data/types';

const lesson = chineseLessons[0];

function correctResponse(question: Question): ResponseValue {
  if (question.type === 'choice' || question.type === 'truefalse') return question.answerIndex ?? 0;
  if (question.type === 'numeric') return question.answer ?? 0;
  if (question.type === 'order') return (question.items ?? []).map((_, index) => index);
  if (question.type === 'match') return (question.pairs ?? []).map((_, index) => index);
  return null;
}

describe('question knowledge points', () => {
  it('binds each question to a small, specific set of points', () => {
    for (const item of chineseLessons) {
      for (const question of item.questions) {
        expect(question.knowledgePointIds.length).toBeGreaterThanOrEqual(1);
        expect(question.knowledgePointIds.length).toBeLessThanOrEqual(2);
      }
    }
    const firstLessonPoints = lesson.questions.map(question => question.knowledgePointIds.join(','));
    expect(new Set(firstLessonPoints).size).toBeGreaterThan(1);
  });

  it('two wrong questions create at most two weakness rows', () => {
    const responses = lesson.questions.map((question, index) =>
      index < 2 ? null : correctResponse(question),
    );
    const result = gradeSession(lesson.questions, responses);
    expect(result.wrongQuestionIds).toHaveLength(2);
    const wrongPoints = result.weakness.filter(entry => !entry.correct);
    expect(wrongPoints).toHaveLength(2);
  });
});
