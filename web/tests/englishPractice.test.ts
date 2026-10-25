import { describe, expect, it } from 'vitest';
import { buildWordPractice } from '../src/features/words/WordsSession';
import { isResponseCorrect } from '../src/core/grading';
import { englishLessons } from '../src/data/content/english';

const lesson = englishLessons[0];

describe('English word and sentence practice', () => {
  it('covers word meaning, spelling and a full sentence', () => {
    const questions = buildWordPractice(lesson.words ?? []);
    expect(questions.length).toBeGreaterThanOrEqual(7);
    expect(questions.every(question => question.type !== 'match')).toBe(true);
    const spelling = questions.filter(question => question.id.startsWith('spelling-'));
    expect(spelling.length).toBeGreaterThanOrEqual(2);
    const sentences = questions.filter(question => question.id.startsWith('sentence-'));
    expect(sentences.length).toBeGreaterThanOrEqual(2);
    for (const question of sentences) {
      expect(question.type).toBe('order');
      expect(question.items?.length).toBeGreaterThan(2);
      expect(isResponseCorrect(question, question.items!.map((_, index) => index))).toBe(true);
    }
  });

  it('grades every generated question with its intended answer', () => {
    const questions = buildWordPractice(lesson.words ?? []);
    for (const question of questions) {
      if (question.type === 'choice') {
        expect(isResponseCorrect(question, question.answerIndex ?? null)).toBe(true);
      } else if (question.type === 'order') {
        expect(isResponseCorrect(question, question.items!.map((_, index) => index))).toBe(true);
      }
    }
  });
});
