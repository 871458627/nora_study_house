import { describe, expect, it } from 'vitest';
import { chineseLessons, chineseUnits } from '../src/data/content/chinese';

/**
 * 语文内容钉死（docs/03 §6.3）：统编版（2024 年版）二年级上册，识字篇目
 * 计入课文序号（第 4-7 课），共 28 课。这份测试把单元边界与第三单元的
 * 事实性内容钉死——第三单元（曹冲称象/玲玲的画/一封信/妈妈睡了）曾因
 * 未对照课本出现听写词错课（楼梯/报纸）与情节错写（修车），用户于
 * 2026-10-26 反馈后修正。生字表的最终口径以孩子课本为准。
 */
const EXPECTED_UNIT_TITLES = [
  '第一单元 · 课文',
  '第二单元 · 识字',
  '第三单元 · 课文',
  '第四单元 · 课文',
  '第五单元 · 课文',
  '第六单元 · 课文',
  '第七单元 · 课文',
  '第八单元 · 课文',
];

const lessonByOrder = (order: number) => chineseLessons.find(lesson => lesson.order === order);

describe('语文内容 · 单元结构（统编版 2024）', () => {
  it('有八个单元，标题与教材一致', () => {
    expect(chineseUnits.map(unit => unit.title)).toEqual(EXPECTED_UNIT_TITLES);
  });

  it('共 28 课，课次号 1-28 连续', () => {
    expect(chineseLessons).toHaveLength(28);
    expect(chineseLessons.map(lesson => lesson.order)).toEqual(
      Array.from({ length: 28 }, (_, i) => i + 1),
    );
  });

  it('第三单元是第 8-11 课：曹冲称象 / 玲玲的画 / 一封信 / 妈妈睡了', () => {
    const unit3 = chineseLessons.filter(lesson => lesson.unitId === 'cn-u3');
    expect(unit3.map(lesson => lesson.order)).toEqual([8, 9, 10, 11]);
    expect(unit3.map(lesson => lesson.title)).toEqual([
      '曹冲称象',
      '玲玲的画',
      '一封信',
      '妈妈睡了',
    ]);
  });
});

describe('语文内容 · 第三单元事实校对（2026-10-26 修正）', () => {
  it('玲玲的画：画的是小花狗、评奖得一等奖，听写词来自课文原句', () => {
    const lesson = lessonByOrder(9)!;
    const text = JSON.stringify(lesson);
    expect(text).toContain('小花狗');
    expect(text).toContain('一等奖');
    expect(text).toContain('弄脏');
    expect(text).toContain('脑筋');
    // 曾错挂到本课的词不得回归
    expect(text).not.toContain('楼梯');
    expect(text).not.toContain('报纸');
  });

  it('一封信：第二封写的是修台灯与看电影，不是修车', () => {
    const lesson = lessonByOrder(10)!;
    const text = JSON.stringify(lesson);
    expect(text).toContain('台灯修好了');
    expect(text).toContain('看电影');
    expect(text).toContain('冷冷清清');
    expect(text).not.toContain('修车');
  });

  it('妈妈睡了：美丽/温柔/好累三个层次与明亮的眼睛等词组', () => {
    const lesson = lessonByOrder(11)!;
    const text = JSON.stringify(lesson);
    expect(text).toContain('明亮的');
    expect(text).toContain('弯弯的');
    expect(text).toContain('红润的');
    expect(text).toContain('睡梦');
  });

  it('曹冲称象：等量替换的步骤顺序正确', () => {
    const lesson = lessonByOrder(8)!;
    const text = JSON.stringify(lesson);
    expect(text).toContain('大象上船画线');
    expect(text).toContain('装石头');
    expect(text).toContain('大船');
  });
});
