import type { Lesson, SubjectId, SubjectMeta, Unit } from '../types';
import type { Grade, Semester } from '../../core/model';
// g2s1 = 现有二上内容（原 chinese/math/english 文件）；g2s2 = 二下新包。
import { chineseLessons, chineseUnits } from './chinese';
import { englishLessons, englishUnits } from './english';
import { mathLessons, mathUnits } from './math';
import { chineseLessons2S2, chineseUnits2S2 } from './packs/g2s2/chinese';
import { englishLessons2S2, englishUnits2S2 } from './packs/g2s2/english';
import { mathLessons2S2, mathUnits2S2 } from './packs/g2s2/math';
import type { OralStage } from '../../core/oralMath';

/** 年级学期键（docs/12）：g<年级>s<1|2>。 */
export type GradeKey = `g${Grade}s${1 | 2}`;

interface SubjectPack {
  units: Unit[];
  lessons: Lesson[];
  edition: Record<SubjectId, string>;
  color: Record<SubjectId, { color: string; soft: string }>;
  /** 口算档位（仅数学包关心）；缺省回落到 plan.ts 的二上课序规则。 */
  oralStage?: (lessonOrder: number) => OralStage;
}

const BASE_COLORS: Record<SubjectId, { color: string; soft: string }> = {
  chinese: { color: '#C46A00', soft: '#FFF2E0' },
  math: { color: '#0071E3', soft: '#E5F1FC' },
  english: { color: '#1E8E3E', soft: '#E6F6EC' },
};

// g2s1：二上（既有内容原样平移为第一个内置包）
const PACK_G2S1: SubjectPack = {
  units: [...chineseUnits, ...mathUnits, ...englishUnits],
  lessons: [...chineseLessons, ...mathLessons, ...englishLessons],
  edition: {
    chinese: '统编版 · 二年级上册',
    math: '人教版 · 二年级上册',
    english: '北京出版社 · 英语（预备级）二年级上册 · 2024 版',
  },
  color: BASE_COLORS,
};

// g2s2：二下（统编语文二下 + 人教数学二下 + 北京版英语二下结构示意）
const PACK_G2S2: SubjectPack = {
  units: [...chineseUnits2S2, ...mathUnits2S2, ...englishUnits2S2],
  lessons: [...chineseLessons2S2, ...mathLessons2S2, ...englishLessons2S2],
  edition: {
    chinese: '统编版 · 二年级下册',
    math: '人教版 · 二年级下册',
    english: '北京出版社 · 英语 二年级下册（结构示意 · 以课本为准）',
  },
  color: BASE_COLORS,
  // 人教二下：表内除法（第二、四单元）起步，后半册混入乘加与加减
  oralStage: (order) => (order <= 5 ? 'divide' : 'mixed-div'),
};

const PACKS: Partial<Record<GradeKey, SubjectPack>> = {
  g2s1: PACK_G2S1,
  g2s2: PACK_G2S2,
};

export const AVAILABLE_GRADE_KEYS: GradeKey[] = Object.keys(PACKS) as GradeKey[];

/** 学期自动判定（docs/12 §1.1）：9–1 月为上册，2–8 月为下册。 */
export function autoSemester(date = new Date()): Semester {
  const month = date.getMonth() + 1;
  return month >= 9 || month <= 1 ? 's1' : 's2';
}

export function gradeKeyOf(grade: Grade, semester: Semester): GradeKey {
  return `g${grade}${semester}` as GradeKey;
}

export function gradeLabel(grade: Grade): string {
  return ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'][grade - 1];
}

/** 当前生效年级键：覆盖优先，否则按日期自动。 */
export function currentGradeKeyOf(grade: Grade, semesterOverride: Semester | undefined): GradeKey {
  return gradeKeyOf(grade, semesterOverride ?? autoSemester());
}

let currentKey: GradeKey = 'g2s1';
const initialPack = PACKS[currentKey];
if (!initialPack) throw new Error('builtin pack g2s1 missing');
let currentPack: SubjectPack = initialPack;

function rebuildIndexes(pack: SubjectPack): void {
  SUBJECTS.length = 0;
  SUBJECTS.push(
    { id: 'chinese', name: '语文', short: '语', edition: pack.edition.chinese, ...pack.color.chinese },
    { id: 'math', name: '数学', short: '数', edition: pack.edition.math, ...pack.color.math },
    { id: 'english', name: '英语', short: '英', edition: pack.edition.english, ...pack.color.english },
  );
  UNITS.length = 0;
  UNITS.push(...[...pack.units].sort((a, b) => a.subject.localeCompare(b.subject) || a.order - b.order));
  LESSONS.length = 0;
  LESSONS.push(...pack.lessons);
  lessonMap.clear();
  for (const lesson of LESSONS) lessonMap.set(lesson.id, lesson);
  unitMap.clear();
  for (const unit of UNITS) unitMap.set(unit.id, unit);
  subjectLessonMap.clear();
  for (const subject of SUBJECTS) {
    subjectLessonMap.set(
      subject.id,
      LESSONS.filter((lesson) => lesson.subject === subject.id).sort((a, b) => a.order - b.order),
    );
  }
  wordsById.clear();
  for (const lesson of LESSONS) {
    for (const word of lesson.dictation ?? []) wordsById.set(word.id, word);
  }
}

/** 切换内容包（gradeKey 未上架时保持当前包，返回是否生效）。 */
export function setPack(key: GradeKey): boolean {
  const pack = PACKS[key];
  if (!pack || key === currentKey) return key === currentKey;
  currentKey = key;
  currentPack = pack;
  rebuildIndexes(pack);
  return true;
}

export function currentGradeKey(): GradeKey {
  return currentKey;
}

export const SUBJECTS: SubjectMeta[] = [];

/** 动态 SUBJECT_BY_ID：setPack 后随 SUBJECTS 更新（组件只读）。 */
export const SUBJECT_BY_ID = new Proxy({} as Record<SubjectId, SubjectMeta>, {
  get(_target, prop: string) {
    return SUBJECTS.find((s) => s.id === prop);
  },
  ownKeys() {
    return SUBJECTS.map((s) => s.id);
  },
  getOwnPropertyDescriptor() {
    return { enumerable: true, configurable: true };
  },
});

export const UNITS: Unit[] = [];

export const LESSONS: Lesson[] = [];

const lessonMap = new Map<string, Lesson>();
const unitMap = new Map<string, Unit>();
const subjectLessonMap = new Map<SubjectId, Lesson[]>();
const wordsById = new Map<string, NonNullable<Lesson['dictation']>[number]>();

rebuildIndexes(currentPack);

export function lessonById(id: string): Lesson | undefined {
  return lessonMap.get(id);
}

export function unitById(id: string): Unit | undefined {
  return unitMap.get(id);
}

export function unitsFor(subject: SubjectId): Unit[] {
  return UNITS.filter(unit => unit.subject === subject);
}

/** 课本编号显示：识字独立编号（识字 1-4），课文连续编号（第 1-24 课）。 */
export function lessonLabel(lesson: { category?: 'text' | 'recognition'; textbookNo?: number; order: number }): string {
  if (lesson.category === 'recognition') return `识字 ${lesson.textbookNo ?? ''}`.trim();
  return `第 ${lesson.textbookNo ?? lesson.order} 课`;
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

export function dictationWordById(id: string) {
  return wordsById.get(id);
}

/** 口算档位：当前包声明了规则就用包的（如二下含除法），否则回落二上课序规则。 */
export function oralStageForCurrentPack(lessonOrder: number): OralStage | undefined {
  return currentPack.oralStage?.(lessonOrder);
}

export function hasPack(key: GradeKey): boolean {
  return PACKS[key] !== undefined;
}

/** 某年级任一学期有内容包（年级下拉可用性）。 */
export function gradeHasContent(grade: Grade): boolean {
  return PACKS[gradeKeyOf(grade, 's1')] !== undefined || PACKS[gradeKeyOf(grade, 's2')] !== undefined;
}

/** 指定年级学期的教材版本（语文 edition 代表整套），未上架返回 null。 */
export function packEditionFor(key: GradeKey): string | null {
  return PACKS[key]?.edition.chinese ?? null;
}

/** 当前包的学期（供页面文案动态化）。 */
export function currentSemesterOf(): Semester {
  return (currentKey.match(/s[12]$/)?.[0] as Semester) ?? 's1';
}
