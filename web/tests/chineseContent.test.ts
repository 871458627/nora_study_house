import { describe, expect, it } from 'vitest';
import { chineseLessons, chineseUnits } from '../src/data/content/chinese';
import { lessonLabel } from '../src/data/content';

/**
 * 语文内容钉死（docs/03 §6.3）：2025 年秋新修订统编版二年级上册。
 * 目录依据：aidown 全册目录 + 头条《二年级语文教材大改版》 + 官方电子
 * 课本交叉核对（2026-10-27）。课本结构：八个单元，阅读 23 篇（连续
 * 编号 1-23）+ 识字 4 篇（独立编号），单元名用「阅读」。
 * 曾发生：2024 版篇目残留（曹冲称象/玲玲的画/一封信/妈妈睡了/风娃娃/
 * 狐假虎威/大禹治水/狐狸分奶酪）、识字错编为课文、听写词不在词语表。
 */
const EXPECTED_UNITS = [
  '第一单元 · 阅读',
  '第二单元 · 识字',
  '第三单元 · 阅读',
  '第四单元 · 阅读',
  '第五单元 · 阅读',
  '第六单元 · 阅读',
  '第七单元 · 阅读',
  '第八单元 · 阅读',
];

/** 推进序 1-27 → 课本篇目（title 与课本编号）。 */
const EXPECTED_SEQUENCE: [string, number][] = [
  ['小蝌蚪找妈妈', 1],
  ['我是什么', 2],
  ['植物妈妈有办法', 3],
  ['场景歌', 1],
  ['树之歌', 2],
  ['拍手歌', 3],
  ['田家四季歌', 4],
  ['彩虹', 4],
  ['去外婆家', 5],
  ['数星星的孩子', 6],
  ['古诗二首', 7],
  ['黄山奇石', 8],
  ['日月潭', 9],
  ['葡萄沟', 10],
  ['坐井观天', 11],
  ['寒号鸟', 12],
  ['我要的是葫芦', 13],
  ['八角楼上', 14],
  ['朱德的扁担', 15],
  ['难忘的泼水节', 16],
  ['刘胡兰', 17],
  ['古诗二首', 18],
  ['雾在哪里', 19],
  ['雪孩子', 20],
  ['称赞', 21],
  ['纸船和风筝', 22],
  ['快乐的小河', 23],
];

const lessonByOrder = (order: number) => chineseLessons.find(lesson => lesson.order === order);

describe('语文内容 · 2025 秋版结构', () => {
  it('八个单元，阅读单元名用「阅读」', () => {
    expect(chineseUnits.map(unit => unit.title)).toEqual(EXPECTED_UNITS);
  });

  it('共 27 篇（阅读 23 + 识字 4），推进序连续且与课本篇目一致', () => {
    expect(chineseLessons).toHaveLength(27);
    chineseLessons.forEach((lesson, i) => {
      const [title, no] = EXPECTED_SEQUENCE[i];
      expect(lesson.title, `推进序 ${i + 1}`).toBe(title);
      expect(lesson.textbookNo, `${title} 的课本编号`).toBe(no);
    });
  });

  it('label：阅读连续编号显示「第 N 课」，识字显示「识字 N」', () => {
    expect(lessonLabel(lessonByOrder(8)!)).toBe('第 4 课');
    expect(lessonLabel(lessonByOrder(10)!)).toBe('第 6 课');
    expect(lessonLabel(lessonByOrder(4)!)).toBe('识字 1');
  });
});

describe('语文内容 · 2025 版篇目变更钉死', () => {
  it('移除的旧篇目不得回归', () => {
    const titles = chineseLessons.map(lesson => lesson.title).join(' ');
    for (const gone of ['曹冲称象', '玲玲的画', '一封信', '妈妈睡了', '风娃娃', '狐假虎威', '狐狸分奶酪', '大禹治水']) {
      expect(titles, `${gone} 不在新版教材`).not.toContain(gone);
    }
  });

  it('新增篇目就位且内容来自课文', () => {
    const caihong = JSON.stringify(lessonByOrder(8)!);
    expect(caihong).toContain('水壶');
    expect(caihong).toContain('秋千');
    const waipo = JSON.stringify(lessonByOrder(9)!);
    expect(waipo).toContain('山脚');
    expect(waipo).toContain('杜鹃花');
    const shuxing = JSON.stringify(lessonByOrder(10)!);
    expect(shuxing).toContain('北斗七星');
    expect(shuxing).toContain('张衡');
    const chengzan = JSON.stringify(lessonByOrder(25)!);
    expect(chengzan).toContain('板凳');
    expect(chengzan).toContain('自信');
    const xiaohe = JSON.stringify(lessonByOrder(27)!);
    expect(xiaohe).toContain('抱怨');
    expect(xiaohe).toContain('勇敢');
  });

  it('古诗二首（第 18 课）用《江雪》替换《夜宿山寺》', () => {
    const text = JSON.stringify(lessonByOrder(22)!);
    expect(text).toContain('江雪');
    expect(text).toContain('孤舟蓑笠翁');
    expect(text).not.toContain('夜宿山寺');
  });

  it('识字单元保持四篇且独立编号', () => {
    const rec = chineseLessons.filter(lesson => lesson.category === 'recognition');
    expect(rec.map(lesson => lesson.title)).toEqual(['场景歌', '树之歌', '拍手歌', '田家四季歌']);
    expect(rec.map(lesson => lesson.textbookNo)).toEqual([1, 2, 3, 4]);
  });
});
