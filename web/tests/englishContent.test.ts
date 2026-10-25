import { describe, expect, it } from 'vitest';
import { isResponseCorrect } from '../src/core/grading';
import { englishLessons, englishUnits } from '../src/data/content/english';

/**
 * The child's book is 北京出版社《英语（预备级）二年级上册》, 2024 年经北京市教材委员会
 * 审核通过的版本。上一版内容用的是旧教材（Unit 1 What day is today? …），这份测试把
 * 单元名、课时数和 Lesson 编号钉死，防止内容再退回旧版或在改动中退化。
 */
const EXPECTED_UNITS = [
  "Unit 1 · It's Time to Get Up",
  'Unit 2 · Ways to Go to School',
  'Unit 3 · We Like Sports',
  'Unit 4 · My Week',
  'Unit 5 · My Weekend',
  'Unit 6 · Animals Are Fun',
];

/** 下标 0 是 Lesson 1；课次号就是数组位置，界面统一显示成「第 N 课」。 */
const EXPECTED_LESSONS = [
  "It's Seven O'clock",
  'Please Go to Bed Early',
  'Fun Time · 第 1 单元复习',
  'How Do You Go to School?',
  'I Go to School on an Elephant Today',
  'Fun Time · 第 2 单元复习',
  'Sports Are Fun',
  'A Super Player',
  'Fun Time · 第 3 单元复习',
  'What Day Is It Today?',
  'A Nice Week',
  'Fun Time · 第 4 单元复习',
  'This Is My Happy Weekend',
  'Sunday Is a Big Day',
  'Fun Time · 第 5 单元复习',
  'The Animals in a Park',
  'A Fun Race',
  'Fun Time · 第 6 单元复习',
];

function spellable(word: string): boolean {
  if (!/^[A-Za-z]{3,8}$/.test(word)) return false;
  const letters = [...word.toLowerCase()];
  return new Set(letters).size === letters.length;
}

function sentenceTokens(sentence: string): string[] {
  return sentence.replace(/[.!?]+$/, '').trim().split(/\s+/);
}

describe('English content matches the 2024 textbook', () => {
  it('has the six units of this edition, in order', () => {
    expect(englishUnits.map(unit => unit.title)).toEqual(EXPECTED_UNITS);
    expect(englishUnits.map(unit => unit.order)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('has 18 lessons numbered Lesson 1-18, three per unit', () => {
    expect(englishLessons).toHaveLength(18);
    expect(englishLessons.map(lesson => lesson.title)).toEqual(EXPECTED_LESSONS);
    expect(englishLessons.map(lesson => lesson.order)).toEqual(
      Array.from({ length: 18 }, (_, index) => index + 1),
    );
    for (const unit of englishUnits) {
      const lessons = englishLessons.filter(lesson => lesson.unitId === unit.id);
      expect(lessons).toHaveLength(3);
      // Every third lesson is the unit's Fun Time period.
      expect(lessons[2].title).toContain('Fun Time');
    }
  });

  it('gives every lesson knowledge points, questions and words', () => {
    for (const lesson of englishLessons) {
      expect(lesson.preview.points.length).toBeGreaterThanOrEqual(2);
      expect(lesson.review.points.length).toBeGreaterThanOrEqual(2);
      expect(lesson.questions.length).toBeGreaterThanOrEqual(3);
      expect(lesson.words?.length).toBeGreaterThanOrEqual(5);
      expect(lesson.review.tip).toBeTruthy();
    }
  });

  it('keeps the daily word round buildable for every lesson', () => {
    for (const lesson of englishLessons) {
      const words = lesson.words ?? [];
      const spellCount = words.filter(word => spellable(word.en)).length;
      const sentenceCount = words.filter(word => {
        const tokens = sentenceTokens(word.sentence);
        return tokens.length >= 3 && new Set(tokens).size === tokens.length;
      }).length;
      expect(spellCount, `${lesson.title} 拼写题不足`).toBeGreaterThanOrEqual(2);
      expect(sentenceCount, `${lesson.title} 排序句不足`).toBeGreaterThanOrEqual(2);
    }
  });

  it('grades every authored question correct with its authored answer', () => {
    for (const lesson of englishLessons) {
      for (const question of lesson.questions) {
        const intended: number | number[] | null =
          question.type === 'choice' || question.type === 'truefalse'
            ? (question.answerIndex ?? null)
            : question.type === 'numeric'
              ? (question.answer ?? null)
              : question.type === 'order'
                ? (question.items ?? []).map((_, index) => index)
                : (question.pairs ?? []).map((_, index) => index);
        expect(isResponseCorrect(question, intended), `${question.id} 判不了对错`).toBe(true);
      }
    }
  });

  it('keeps ids unique and choice answers inside their options', () => {
    const wordIds = new Set(englishLessons.flatMap(lesson => (lesson.words ?? []).map(word => word.id)));
    const questionIds = new Set(englishLessons.flatMap(lesson => lesson.questions.map(question => question.id)));
    expect(wordIds.size).toBe(englishLessons.reduce((sum, lesson) => sum + (lesson.words?.length ?? 0), 0));
    expect(questionIds.size).toBe(englishLessons.reduce((sum, lesson) => sum + lesson.questions.length, 0));

    for (const lesson of englishLessons) {
      for (const question of lesson.questions) {
        expect(question.knowledgePointIds.length).toBeGreaterThan(0);
        if (question.type === 'choice' || question.type === 'truefalse') {
          expect(question.options?.length).toBeGreaterThanOrEqual(2);
          expect(question.answerIndex).toBeGreaterThanOrEqual(0);
          expect((question.answerIndex ?? 0) < (question.options?.length ?? 0)).toBe(true);
        }
        if (question.type === 'order') {
          expect(question.items?.length).toBeGreaterThanOrEqual(2);
        }
        if (question.type === 'match') {
          expect(question.pairs?.length).toBeGreaterThanOrEqual(3);
        }
      }
    }
  });
});
