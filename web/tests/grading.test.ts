import { describe, expect, it } from 'vitest';
import { chineseLessons } from '../src/data/content/chinese';
import { gradeSession, isResponseCorrect, matchRightOrder, shuffleWithSeed } from '../src/core/grading';

const lesson = chineseLessons[0];
const [choiceQuestion, orderQuestion, trueFalseQuestion] = lesson.questions;

describe('grading', () => {
  it('checks objective question types', () => {
    expect(isResponseCorrect(choiceQuestion, choiceQuestion.answerIndex ?? 0)).toBe(true);
    expect(isResponseCorrect(choiceQuestion, 99)).toBe(false);
    expect(isResponseCorrect(trueFalseQuestion, trueFalseQuestion.answerIndex ?? 0)).toBe(true);
    expect(isResponseCorrect(orderQuestion, [0, 1, 2, 3])).toBe(true);
    expect(isResponseCorrect(orderQuestion, [1, 0, 2, 3])).toBe(false);
    expect(isResponseCorrect(orderQuestion, [0, 1])).toBe(false);
  });

  it('checks numeric answers strictly', () => {
    const numeric = { id: 'n', type: 'numeric' as const, knowledgePointIds: [], stem: '2+3', answer: 5 };
    expect(isResponseCorrect(numeric, 5)).toBe(true);
    expect(isResponseCorrect(numeric, 55)).toBe(false);
    expect(isResponseCorrect(numeric, null)).toBe(false);
  });

  it('checks match responses by left-row order', () => {
    const match = {
      id: 'm',
      type: 'match' as const,
      knowledgePointIds: [],
      stem: '配对',
      pairs: [
        { left: 'a', right: '1' },
        { left: 'b', right: '2' },
      ],
    };
    expect(isResponseCorrect(match, [0, 1])).toBe(true);
    expect(isResponseCorrect(match, [1, 0])).toBe(false);
  });

  it('builds a deterministic shuffled right column', () => {
    const match = {
      id: 'm2',
      type: 'match' as const,
      knowledgePointIds: [],
      stem: '配对',
      pairs: [
        { left: 'a', right: '1' },
        { left: 'b', right: '2' },
        { left: 'c', right: '3' },
      ],
    };
    expect(matchRightOrder(match)).toEqual(matchRightOrder(match));
    expect([...matchRightOrder(match)].sort()).toEqual([0, 1, 2]);
    expect(shuffleWithSeed([1, 2, 3, 4], 'seed')).toEqual(shuffleWithSeed([1, 2, 3, 4], 'seed'));
  });

  it('grades a whole session and groups weakness by point', () => {
    const questions = chineseLessons[0].questions;
    const responses = questions.map((question, index) => {
      if (question.type === 'order') return [0, 1, 2, 3];
      if (question.type === 'numeric') return question.answer ?? null;
      return index === 0 ? (question.answerIndex ?? 0) : 99;
    });
    const result = gradeSession(questions, responses);
    expect(result.total).toBe(3);
    expect(result.correct).toBe(2);
    expect(result.wrongQuestionIds).toHaveLength(1);
    expect(result.weakness.some(entry => entry.correct === false)).toBe(true);
  });
});
