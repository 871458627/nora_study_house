import type { Lesson, SubjectId, SubjectMeta, Unit } from '../types';
import { chineseLessons, chineseUnits } from './chinese';
import { englishLessons, englishUnits } from './english';
import { mathLessons, mathUnits } from './math';

export const SUBJECTS: SubjectMeta[] = [
  {
    id: 'chinese',
    name: '语文',
    short: '语',
    edition: '统编版 · 二年级上册',
    color: '#BC4B0B',
    soft: '#FDEEDF',
  },
  {
    id: 'math',
    name: '数学',
    short: '数',
    edition: '人教版 · 二年级上册',
    color: '#0F6EB8',
    soft: '#E1F0FB',
  },
  {
    id: 'english',
    name: '英语',
    short: '英',
    edition: '北京出版社 · 英语（预备级）二年级上册 · 2024 版',
    color: '#23790A',
    soft: '#E3F5E0',
  },
];

export const SUBJECT_BY_ID = Object.fromEntries(
  SUBJECTS.map(subject => [subject.id, subject]),
) as Record<SubjectId, SubjectMeta>;

export const UNITS: Unit[] = [...chineseUnits, ...mathUnits, ...englishUnits].sort(
  (a, b) => a.subject.localeCompare(b.subject) || a.order - b.order,
);

export const LESSONS: Lesson[] = [...chineseLessons, ...mathLessons, ...englishLessons];

const lessonMap = new Map(LESSONS.map(lesson => [lesson.id, lesson]));
const unitMap = new Map(UNITS.map(unit => [unit.id, unit]));
const subjectLessonMap = new Map<SubjectId, Lesson[]>();

for (const subject of SUBJECTS) {
  subjectLessonMap.set(
    subject.id,
    LESSONS.filter(lesson => lesson.subject === subject.id).sort((a, b) => a.order - b.order),
  );
}

export function lessonById(id: string): Lesson | undefined {
  return lessonMap.get(id);
}

export function unitById(id: string): Unit | undefined {
  return unitMap.get(id);
}

export function unitsFor(subject: SubjectId): Unit[] {
  return UNITS.filter(unit => unit.subject === subject);
}

export function lessonsForSubject(subject: SubjectId): Lesson[] {
  return subjectLessonMap.get(subject) ?? [];
}

export function lessonAt(subject: SubjectId, index: number): Lesson | undefined {
  return lessonsForSubject(subject)[index];
}

export function nextLessonAfter(lessonId: string): Lesson | undefined {
  const lesson = lessonById(lessonId);
  if (!lesson) return undefined;
  return lessonsForSubject(lesson.subject).find(item => item.order === lesson.order + 1);
}

export function lessonIndex(lessonId: string): number {
  const lesson = lessonById(lessonId);
  if (!lesson) return -1;
  return lessonsForSubject(lesson.subject).findIndex(item => item.id === lesson.id);
}

export function lessonsInUnit(unitId: string): Lesson[] {
  return LESSONS.filter(lesson => lesson.unitId === unitId).sort((a, b) => a.order - b.order);
}

const wordsById = new Map(
  LESSONS.flatMap(lesson => (lesson.dictation ?? []).map(word => [word.id, word] as const)),
);

export function dictationWordById(id: string) {
  return wordsById.get(id);
}
