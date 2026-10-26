import { describe, expect, it } from 'vitest';
import { chineseLessons, chineseUnits } from '../src/data/content/chinese';
import { lessonLabel } from '../src/data/content';

/**
 * 语文内容钉死（docs/03 §6.3）：统编版二年级上册（人教社电子课本
 * 目录/词语表核对，2026-10-26）。课本采用「课文 1-24 + 识字 1-4」
 * 独立编号；app 内 order 1-28 为连续推进序，textbookNo 为课本编号。
 * 曾发生：旧版篇目残留（大禹治水/狐狸分奶酪）、识字错编为课文、
 * 107 个听写词不在词语表——本测试全部钉死。
 */

/** 人教社电子课本《词语表》（p118-119）原文，按篇目键控。 */
const WORD_TABLE: Record<string, string[]> = {
  text1: ['看见', '哪里', '那边', '头顶', '眼睛', '雪白', '肚皮', '孩子'],
  text2: ['天空', '傍晚', '人们', '冬天', '花朵', '平常', '江河', '海洋', '田地', '工作'],
  text3: ['办法', '如果', '长大', '四海为家', '娃娃', '只要', '皮毛', '那里', '知识'],
  rec1: ['花园', '石桥', '队旗', '铜号', '红领巾', '欢笑'],
  rec2: ['杨树', '树叶', '枫树', '松柏', '木棉', '水杉', '化石', '金桂'],
  rec3: ['写字', '丛林', '深处', '竹林', '熊猫', '朋友'],
  rec4: ['四季', '农事', '月光', '辛苦', '棉衣'],
  text4: ['一同', '柱子', '一边', '到底', '秤杆', '力气', '出来', '船身', '石头', '地方', '果然'],
  text5: ['评奖', '时间', '报纸', '来不及', '事情', '坏事', '好事'],
  text6: ['出国', '今天', '圆珠笔', '开心', '以前', '还有', '台灯', '这时', '阳光', '电影'],
  text7: ['明亮', '故事', '头发', '窗外'],
  text8: [],
  text9: ['黄山', '南部', '那些', '山顶', '一动不动', '云海', '巨石', '前方', '每当', '金光闪闪', '它们'],
  text10: ['群山', '树木', '名胜古迹', '中央', '美丽', '灯光', '中午', '展现', '风光'],
  text11: ['出产', '水果', '月份', '山坡', '枝叶', '展开', '五光十色', '好客', '老乡', '城市', '空气', '水分'],
  text12: ['坐井观天', '井沿', '回答', '口渴', '大话', '井口', '无边无际'],
  text13: ['山脚', '当作', '前面', '晴朗', '枯草', '正好', '清早', '现在', '将来', '难过', '大雪纷飞', '枝头'],
  text14: ['从前', '细长', '可爱', '每天', '自言自语', '南瓜', '邻居', '奇怪'],
  text15: ['八角楼', '深夜', '军衣', '星星之火', '沉思', '胜利'],
  text16: ['扁担', '同志', '带领', '队伍', '会师', '红军', '来回', '战士', '白天', '起来'],
  text17: ['难忘', '泼水节', '一年一度', '四面八方', '龙船', '花炮', '欢呼', '人群', '欢乐', '开始', '柏树枝', '多么'],
  text18: ['年轻', '村子', '知道', '广场', '民兵'],
  text19: [],
  text20: ['于是', '无论', '船只', '连同', '岸边', '同时', '房屋', '一切', '不久', '出现', '散步'],
  text21: ['空地', '唱歌', '回家', '赶快', '旁边', '火星', '连忙', '浑身', '时候', '谢谢', '水汽'],
  text22: ['食物', '身边', '为什么', '爪子', '面前', '神气活现', '野猪', '往常', '身后', '信以为真'],
  text23: ['纸船', '松果', '纸条', '可是', '但是', '屋顶', '和好'],
  text24: ['田野', '风车', '飞快', '秧苗', '不住', '点头', '急忙', '伤心', '路边', '生气'],
};

const lessonByOrder = (order: number) => chineseLessons.find(lesson => lesson.order === order);
const lessonKey = (lesson: (typeof chineseLessons)[number]) =>
  lesson.category === 'recognition' ? `rec${lesson.textbookNo}` : `text${lesson.textbookNo}`;

describe('语文内容 · 结构（统编版目录 2026-10-26 核对）', () => {
  it('八个单元，识字独立成单元', () => {
    expect(chineseUnits.map(unit => unit.title)).toEqual([
      '第一单元 · 课文',
      '第二单元 · 识字',
      '第三单元 · 课文',
      '第四单元 · 课文',
      '第五单元 · 课文',
      '第六单元 · 课文',
      '第七单元 · 课文',
      '第八单元 · 课文',
    ]);
  });

  it('共 28 篇（课文 24 + 识字 4），推进序 1-28 连续', () => {
    expect(chineseLessons).toHaveLength(28);
    expect(chineseLessons.map(lesson => lesson.order)).toEqual(
      Array.from({ length: 28 }, (_, i) => i + 1),
    );
    expect(chineseLessons.filter(lesson => lesson.category === 'recognition')).toHaveLength(4);
  });

  it('课本编号：曹冲称象是课文 4（不是第 8 课），场景歌是识字 1', () => {
    expect(lessonLabel(lessonByOrder(8)!)).toBe('第 4 课');
    expect(lessonLabel(lessonByOrder(4)!)).toBe('识字 1');
    expect(lessonByOrder(8)!.title).toBe('曹冲称象');
  });

  it('新版篇目就位：八角楼上/刘胡兰在第六单元，旧篇目已移除', () => {
    expect(lessonByOrder(19)!.title).toBe('八角楼上');
    expect(lessonByOrder(22)!.title).toBe('刘胡兰');
    const titles = chineseLessons.map(lesson => lesson.title).join(' ');
    expect(titles).not.toContain('大禹治水');
    expect(titles).not.toContain('狐狸分奶酪');
  });
});

describe('语文内容 · 听写词全部来自课本词语表', () => {
  it('每一课的听写词都在该篇目的词语表内（古诗二首为空）', () => {
    const violations: string[] = [];
    for (const lesson of chineseLessons) {
      const table = WORD_TABLE[lessonKey(lesson)];
      expect(table, `缺少 ${lesson.title} 的词语表`).toBeTruthy();
      for (const word of lesson.dictation ?? []) {
        if (!table.includes(word.word)) violations.push(`${lesson.title}:${word.word}`);
      }
    }
    expect(violations, `不在词语表的听写词: ${violations.join(', ')}`).toEqual([]);
  });

  it('古诗二首不设听写（词语表无词），其余每课都有听写词', () => {
    for (const lesson of chineseLessons) {
      const empty = (lesson.dictation ?? []).length === 0;
      const isPoetry = lesson.title === '古诗二首';
      expect(empty).toBe(isPoetry);
    }
  });
});

describe('语文内容 · 课文事实钉死', () => {
  it('玲玲的画：小花狗、一等奖，词语表词（报纸/时间在课文语境中）', () => {
    const text = JSON.stringify(lessonByOrder(9)!);
    expect(text).toContain('小花狗');
    expect(text).toContain('一等奖');
    expect(text).toContain('弄脏了');
  });

  it('一封信：第二封写修台灯与看电影，不是修车', () => {
    const text = JSON.stringify(lessonByOrder(10)!);
    expect(text).toContain('台灯修好了');
    expect(text).not.toContain('修车');
  });

  it('曹冲称象：等量替换步骤（上船画线→下船→装石头→称石头）', () => {
    const text = JSON.stringify(lessonByOrder(8)!);
    expect(text).toContain('大象上船画线');
    expect(text).toContain('装石头');
  });

  it('八角楼上/刘胡兰：新篇目事实就位', () => {
    const bajiao = JSON.stringify(lessonByOrder(19)!);
    expect(bajiao).toContain('夜幕降临');
    expect(bajiao).toContain('星星之火');
    const liu = JSON.stringify(lessonByOrder(22)!);
    expect(liu).toContain('收买');
    expect(liu).toContain('光荣地牺牲');
  });
});
