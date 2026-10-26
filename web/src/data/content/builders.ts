import type {
  DictationWord,
  EnglishWord,
  KnowledgePoint,
  Question,
} from '../types';

export const point = (id: string, text: string): KnowledgePoint => ({ id, text });

export type QuestionSeed = Omit<Question, 'id' | 'knowledgePointIds'> & {
  /** Optional indexes into the lesson's point list for this exact question. */
  pointIndexes?: number[];
};

export const choice = (
  stem: string,
  options: string[],
  answerIndex: number,
  explanation?: string,
): QuestionSeed => ({ type: 'choice', stem, options, answerIndex, explanation });

export const truefalse = (stem: string, answer: boolean, explanation?: string): QuestionSeed => ({
  type: 'truefalse',
  stem,
  options: ['对', '错'],
  answerIndex: answer ? 0 : 1,
  explanation,
});

export const match = (
  stem: string,
  pairs: { left: string; right: string }[],
  explanation?: string,
): QuestionSeed => ({ type: 'match', stem, pairs, explanation });

export const order = (stem: string, items: string[], explanation?: string): QuestionSeed => ({
  type: 'order',
  stem,
  items,
  explanation,
});

export const numeric = (stem: string, answer: number, explanation?: string): QuestionSeed => ({
  type: 'numeric',
  stem,
  answer,
  explanation,
});

export const dictationWord = (id: string, word: string, pinyin: string): DictationWord => ({
  id,
  word,
  pinyin,
});

export const englishWord = (
  id: string,
  en: string,
  zh: string,
  sentence: string,
  sentenceZh: string,
): EnglishWord => ({ id, en, zh, sentence, sentenceZh });

export interface LessonSeed {
  id: string;
  unitId: string;
  order: number;
  title: string;
  preview: string[];
  review: string[];
  mistakes?: string[];
  tip?: string;
  questions: QuestionSeed[];
  dictation?: DictationWord[];
  afterClass?: QuestionSeed[];
  words?: EnglishWord[];
  category?: 'text' | 'recognition';
  textbookNo?: number;
}

export function buildQuestions(lessonId: string, kpIds: string[], seeds: QuestionSeed[]): Question[] {
  return seeds.map((seed, index) => {
    const { pointIndexes, ...question } = seed;
    const mapped = pointIndexes
      ?.map(pointIndex => kpIds[pointIndex])
      .filter((pointId): pointId is string => Boolean(pointId));
    return {
      ...question,
      id: `${lessonId}-q${index + 1}`,
      // Spread questions across the lesson's points unless the seed names its
      // own focus. No question claims the whole lesson.
      knowledgePointIds:
        mapped && mapped.length > 0 ? mapped : kpIds.length ? [kpIds[index % kpIds.length]] : [],
    };
  });
}

export function buildPoints(lessonId: string, kind: 'p' | 'r', texts: string[]): KnowledgePoint[] {
  return texts.map((text, index) => point(`${lessonId}-${kind}${index + 1}`, text));
}
