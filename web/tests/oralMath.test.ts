import { describe, expect, it } from 'vitest';
import { generateOralQuestions, type OralStage } from '../src/core/oralMath';

function operands(stem: string): number[] {
  return [...stem.matchAll(/\d+/g)].map(match => Number(match[0]));
}

function checkQuestions(stage: OralStage) {
  for (let seed = 0; seed < 400; seed += 1) {
    const questions = generateOralQuestions(`seed-${seed}`, 5, stage);
    expect(questions).toHaveLength(5);
    for (const question of questions) {
      const stem = question.stem;
      expect(stem).not.toContain('÷');
      expect(question.answer).toBeGreaterThanOrEqual(0);
      if (stem.includes('×')) {
        const factors = stem
          .split('×')[0]
          .trim()
          .split(/\s+/)
          .map(Number);
        expect(factors.length).toBe(1);
        expect(factors[0]).toBeGreaterThanOrEqual(2);
        expect(factors[0]).toBeLessThanOrEqual(9);
        const second = Number(stem.split('×')[1].split(/[+−=]/)[0].trim());
        expect(second).toBeGreaterThanOrEqual(2);
        expect(second).toBeLessThanOrEqual(9);
      } else if (stem.includes('+')) {
        const [a, b] = operands(stem);
        expect(a + b).toBeLessThanOrEqual(100);
      } else if (stem.includes('−')) {
        const [a, b] = operands(stem);
        expect(a).toBeLessThanOrEqual(100);
        expect(a - b).toBeGreaterThanOrEqual(0);
      }
    }
  }
}

describe('generateOralQuestions', () => {
  it('never generates division or sums over 100 at any stage', () => {
    checkQuestions('add-sub');
    checkQuestions('multiply');
    checkQuestions('mixed');
  });

  it('keeps add/sub free of multiplication before the times-table unit', () => {
    for (let seed = 0; seed < 100; seed += 1) {
      const questions = generateOralQuestions(`early-${seed}`, 5, 'add-sub');
      expect(questions.every(question => !question.stem.includes('×'))).toBe(true);
    }
  });

  it('is deterministic for the same seed and stage', () => {
    const first = generateOralQuestions('stable', 5, 'multiply');
    const second = generateOralQuestions('stable', 5, 'multiply');
    expect(first.map(question => question.stem)).toEqual(second.map(question => question.stem));
  });
});
