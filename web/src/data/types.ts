export type SubjectId = 'chinese' | 'math' | 'english';
export type SlotSubject = SubjectId | 'other' | null;
export type Timetable = SlotSubject[][];

export interface KnowledgePoint {
  id: string;
  text: string;
}

export type QuestionType = 'choice' | 'truefalse' | 'match' | 'order' | 'numeric';

export interface Question {
  id: string;
  type: QuestionType;
  knowledgePointIds: string[];
  stem: string;
  options?: string[];
  answerIndex?: number;
  pairs?: { left: string; right: string }[];
  items?: string[];
  answer?: number;
  explanation?: string;
}

export interface DictationWord {
  id: string;
  word: string;
  pinyin: string;
}

export interface EnglishWord {
  id: string;
  en: string;
  zh: string;
  sentence: string;
  sentenceZh: string;
}

export interface Lesson {
  id: string;
  subject: SubjectId;
  unitId: string;
  order: number;
  title: string;
  preview: { points: KnowledgePoint[] };
  review: { points: KnowledgePoint[]; mistakes: string[]; tip?: string };
  questions: Question[];
  dictation?: DictationWord[];
  afterClass?: Question[];
  words?: EnglishWord[];
}

export interface Unit {
  id: string;
  subject: SubjectId;
  order: number;
  title: string;
}

export interface SubjectMeta {
  id: SubjectId;
  name: string;
  short: string;
  edition: string;
  color: string;
  soft: string;
}

export type TaskKind =
  | 'review'
  | 'preview'
  | 'practice'
  | 'dictation'
  | 'oral'
  | 'words'
  | 'weak';

export interface PlanTask {
  id: string;
  kind: TaskKind;
  subject: SubjectId;
  lessonId: string;
  title: string;
  subtitle: string;
  minutes: number;
  wordIds?: string[];
  questionIds?: string[];
}

export interface AnswerRecord {
  questionId: string;
  correct: boolean;
  given: string;
}

export interface SessionResult {
  total: number;
  correct: number;
  answers: AnswerRecord[];
  wrongQuestionIds: string[];
  weakness: { pointId: string; correct: boolean }[];
}
