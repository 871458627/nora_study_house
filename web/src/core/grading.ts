import type { Question, SessionResult } from '../data/types';

export function seededRandom(seed: string): () => number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  let state = hash >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleWithSeed<T>(items: readonly T[], seed: string): T[] {
  const random = seededRandom(seed);
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}

export type ResponseValue = number | number[] | null;

export function isResponseCorrect(question: Question, response: ResponseValue): boolean {
  if (response === null) return false;
  if (question.type === 'choice' || question.type === 'truefalse') {
    return typeof response === 'number' && response === question.answerIndex;
  }
  if (question.type === 'numeric') {
    return typeof response === 'number' && Number.isFinite(response) && response === question.answer;
  }
  if (question.type === 'order') {
    if (!Array.isArray(response)) return false;
    const count = question.items?.length ?? 0;
    return response.length === count && response.every((value, index) => value === index);
  }
  if (question.type === 'match') {
    if (!Array.isArray(response)) return false;
    const count = question.pairs?.length ?? 0;
    return response.length === count && response.every((value, index) => value === index);
  }
  return false;
}

export function gradeSession(
  questions: Question[],
  responses: ResponseValue[],
): SessionResult {
  const answers = questions.map((question, index) => {
    const response = responses[index] ?? null;
    return {
      questionId: question.id,
      correct: isResponseCorrect(question, response),
      given: Array.isArray(response) ? response.join(',') : String(response ?? ''),
    };
  });

  const weakness = new Map<string, boolean>();
  const wrongQuestionIds: string[] = [];
  questions.forEach((question, index) => {
    const correct = answers[index]?.correct ?? false;
    if (!correct) wrongQuestionIds.push(question.id);
    for (const pointId of question.knowledgePointIds) {
      weakness.set(pointId, (weakness.get(pointId) ?? true) && correct);
    }
  });

  return {
    total: questions.length,
    correct: answers.filter(answer => answer.correct).length,
    answers,
    wrongQuestionIds,
    weakness: [...weakness.entries()].map(([pointId, correct]) => ({ pointId, correct })),
  };
}

/** Shuffle only the visible order; the response records right-column indexes. */
export function matchRightOrder(question: Question): number[] {
  const count = question.pairs?.length ?? 0;
  return shuffleWithSeed(
    Array.from({ length: count }, (_, index) => index),
    `${question.id}:right`,
  );
}

export function orderDisplayItems(question: Question): string[] {
  return shuffleWithSeed(question.items ?? [], `${question.id}:order`);
}

export function answerText(question: Question): string {
  if (question.type === 'choice' || question.type === 'truefalse') {
    return question.options?.[question.answerIndex ?? -1] ?? '';
  }
  if (question.type === 'numeric') return String(question.answer ?? '');
  if (question.type === 'order') return (question.items ?? []).join(' → ');
  if (question.type === 'match') {
    return (question.pairs ?? []).map(pair => `${pair.left}—${pair.right}`).join('；');
  }
  return '';
}
