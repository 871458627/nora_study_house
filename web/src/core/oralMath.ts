import { lessonById } from '../data/content';
import type { Question } from '../data/types';
import { seededRandom } from './grading';

export type OralStage = 'add-sub' | 'multiply' | 'mixed' | 'divide' | 'mixed-div';

function numeric(stem: string, answer: number, id: string): Question {
  return {
    id,
    type: 'numeric',
    knowledgePointIds: [],
    stem,
    answer,
    explanation: `答案是 ${answer}。`,
  };
}

/**
 * Grade 2 first semester only covers addition/subtraction within 100 and the
 * 2-9 times tables. Multiplication appears once the class reaches the
 * times-table unit, and 乘加 joins after that unit.
 */
export function oralStageForLesson(lessonId: string | undefined): OralStage {
  const order = lessonId ? (lessonById(lessonId)?.order ?? 0) : 0;
  if (order >= 13) return 'mixed';
  if (order >= 10) return 'multiply';
  return 'add-sub';
}

export function oralSubtitle(stage: OralStage): string {
  if (stage === 'mixed-div') return '5 道题 · 表内除法、乘法与 100 以内加减';
  if (stage === 'divide') return '5 道题 · 表内除法';
  if (stage === 'mixed') return '5 道题 · 表内乘法、乘加与 100 以内加减';
  if (stage === 'multiply') return '5 道题 · 表内乘法与 100 以内加减';
  return '5 道题 · 100 以内加减';
}

/**
 * Generates five deterministic oral-math questions for a seed.
 * No division: that belongs to the second semester.
 */
export function generateOralQuestions(seed: string, count = 5, stage: OralStage = 'mixed'): Question[] {
  const random = seededRandom(`oral:${seed}`);
  const questions: Question[] = [];
  const used = new Set<string>();
  const modes =
    stage === 'add-sub'
      ? [2, 3]
      : stage === 'multiply'
        ? [0, 2, 3]
        : stage === 'mixed'
          ? [0, 2, 3, 4]
          : stage === 'divide'
            ? [5]
            : [5, 0, 2, 3];

  for (let index = 0; index < count; index += 1) {
    let attempt = 0;
    while (attempt < 60) {
      attempt += 1;
      const mode = modes[Math.floor(random() * modes.length)];
      let stem = '';
      let answer = 0;

      if (mode === 0) {
        const a = 2 + Math.floor(random() * 8);
        const b = 2 + Math.floor(random() * 8);
        stem = `${a} × ${b} = ?`;
        answer = a * b;
      } else if (mode === 5) {
        // 表内除法：由乘积反推商（被除数 = 积，除数与商为乘数），确保整除。
        const a = 2 + Math.floor(random() * 8);
        const b = 2 + Math.floor(random() * 8);
        const product = a * b;
        const dividend = a > b ? product : product; // 展示 积 ÷ 小乘数 = 大乘数
        const divisor = Math.min(a, b);
        const quotient = Math.max(a, b);
        stem = `${dividend} ÷ ${divisor} = ?`;
        answer = quotient;
        void dividend;
      } else if (mode === 2) {
        const a = 12 + Math.floor(random() * 68);
        const b = 2 + Math.floor(random() * Math.min(40, 100 - a - 1));
        stem = `${a} + ${b} = ?`;
        answer = a + b;
      } else if (mode === 3) {
        const a = 35 + Math.floor(random() * 60);
        const b = 4 + Math.floor(random() * Math.min(30, a - 2));
        stem = `${a} − ${b} = ?`;
        answer = a - b;
      } else {
        const a = 2 + Math.floor(random() * 7);
        const b = 2 + Math.floor(random() * 7);
        const c = 1 + Math.floor(random() * 9);
        stem = `${a} × ${b} + ${c} = ?`;
        answer = a * b + c;
      }

      if (used.has(stem)) continue;
      used.add(stem);
      questions.push(numeric(stem, answer, `oral-${seed}-${index + 1}`));
      break;
    }
  }

  return questions;
}
