// 课文朗读脚本（2026-10-26）：语文=课名+知识卡（zh），英语=课名+单词例句（en）。
import { describe, expect, it } from 'vitest';
import { buildLessonReadScript } from '../src/core/lessonReader';
import { lessonById, setPack } from '../src/data/content';

describe('buildLessonReadScript', () => {
  it('语文课：课名在前、知识卡逐段、全为 zh-CN', () => {
    setPack('g2s1');
    const lesson = lessonById('cn-u1-l1');
    if (!lesson) throw new Error('lesson missing');
    const script = buildLessonReadScript(lesson);
    expect(script[0]?.text).toContain('小蝌蚪找妈妈');
    expect(script[0]?.lang).toBe('zh-CN');
    expect(script.length).toBe(1 + lesson.preview.points.length + lesson.review.points.length + (lesson.review.tip ? 1 : 0));
    expect(script.every((seg) => seg.lang === 'zh-CN')).toBe(true);
  });

  it('英语课：课名 + 每个单词带例句，全为 en-US', () => {
    setPack('g2s1');
    const lesson = lessonById('en-u1-l1');
    if (!lesson) throw new Error('lesson missing');
    const script = buildLessonReadScript(lesson);
    expect(script[0]?.lang).toBe('en-US');
    expect(script[0]?.text).toContain(lesson.title);
    expect(script.length).toBe(1 + (lesson.words?.length ?? 0));
    expect(script[1]?.text).toContain(lesson.words?.[0]?.en ?? '___');
    expect(script[1]?.text).toContain(lesson.words?.[0]?.sentence ?? '___');
    expect(script.every((seg) => seg.lang === 'en-US')).toBe(true);
  });

  it('无词表的英语课也至少能读课名', () => {
    setPack('g2s2');
    const lesson = lessonById('cn2-u1-l1');
    if (!lesson) throw new Error('lesson missing');
    const script = buildLessonReadScript(lesson);
    expect(script.length).toBeGreaterThan(1);
    setPack('g2s1');
  });
});
