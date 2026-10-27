// 年级内容注册表（docs/12）：包解析、学期自动判定、二上/二下互不串包、normalize 兼容。
import { describe, expect, it } from 'vitest';
import {
  autoSemester,
  currentGradeKeyOf,
  gradeKeyOf,
  hasPack,
  lessonsForSubject,
  setPack,
} from '../src/data/content';
import { normalizeState } from '../src/core/model';

describe('学期自动判定', () => {
  it('9–1 月为上册，2–8 月为下册', () => {
    expect(autoSemester(new Date('2026-10-25'))).toBe('s1');
    expect(autoSemester(new Date('2027-01-15'))).toBe('s1');
    expect(autoSemester(new Date('2027-02-01'))).toBe('s2');
    expect(autoSemester(new Date('2027-08-31'))).toBe('s2');
  });
});

describe('年级键与包可用性', () => {
  it('只有 g2s1 / g2s2 上架', () => {
    expect(hasPack('g2s1')).toBe(true);
    expect(hasPack('g2s2')).toBe(true);
    expect(hasPack('g1s1')).toBe(false);
    expect(hasPack('g3s2')).toBe(false);
    expect(currentGradeKeyOf(2, undefined)).toBe(gradeKeyOf(2, autoSemester(new Date('2026-10-25'))));
    expect(currentGradeKeyOf(3, 's2')).toBe('g3s2');
  });
});

describe('包切换与内容隔离', () => {
  it('默认二上：语文第 1 课是 小蝌蚪找妈妈，27 篇（阅读 23 + 识字 4）', () => {
    setPack('g2s1');
    expect(lessonsForSubject('chinese')[0]?.title).toBe('小蝌蚪找妈妈');
    expect(lessonsForSubject('chinese')).toHaveLength(27);
  });

  it('切到二下：语文第 1 课是 古诗二首，25 课；id 前缀 cn2- 不与二上冲突', () => {
    setPack('g2s2');
    const chinese = lessonsForSubject('chinese');
    expect(chinese[0]?.title).toBe('古诗二首');
    // 二下包首期制作 17 课（25 课的其余课文按 docs/12 §4 内容计划补充）
    expect(chinese).toHaveLength(17);
    expect(chinese.every((lesson) => lesson.id.startsWith('cn2-'))).toBe(true);
    expect(lessonsForSubject('math')[0]?.title).toBe('数据收集整理');
    expect(lessonsForSubject('english').length).toBeGreaterThan(0);
    expect(lessonsForSubject('math').every((lesson) => lesson.id.startsWith('m2s-'))).toBe(true);
  });

  it('切回二上内容复原（互不串包）', () => {
    setPack('g2s2');
    setPack('g2s1');
    expect(lessonsForSubject('chinese')[0]?.title).toBe('小蝌蚪找妈妈');
    setPack('g2s2');
  });
});

describe('normalizeState 年级字段兼容', () => {
  it('缺省 grade=2，semesterOverride 透传合法值、丢弃非法值', () => {
    const base = { schemaVersion: 1, onboarded: true };
    expect(normalizeState({ ...base })?.grade).toBe(2);
    expect(normalizeState({ ...base, grade: 3, semesterOverride: 's2' })?.grade).toBe(3);
    expect(normalizeState({ ...base, grade: 3, semesterOverride: 's2' })?.semesterOverride).toBe('s2');
    expect(normalizeState({ ...base, grade: 9, semesterOverride: 'xx' })?.grade).toBe(2);
    expect(normalizeState({ ...base, grade: 9, semesterOverride: 'xx' })?.semesterOverride).toBeUndefined();
  });
});
