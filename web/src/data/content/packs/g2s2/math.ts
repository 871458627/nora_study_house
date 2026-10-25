import type { Lesson, Unit } from '../../../types';
import { buildPoints, buildQuestions, choice, numeric, order, truefalse, type LessonSeed } from '../../builders';

// 人教版数学二年级下册（北京多数区在用版本之一；以孩子课本为准）。
// 课 id 前缀 m2s-。表内除法在本册：口算档位由 registry 按课序给出。

export const mathUnits2S2: Unit[] = [
  { id: 'm2s-u1', subject: 'math', order: 1, title: '第一单元 · 数据收集整理' },
  { id: 'm2s-u2', subject: 'math', order: 2, title: '第二单元 · 表内除法（一）' },
  { id: 'm2s-u3', subject: 'math', order: 3, title: '第三单元 · 图形的运动（一）' },
  { id: 'm2s-u4', subject: 'math', order: 4, title: '第四单元 · 表内除法（二）' },
  { id: 'm2s-u5', subject: 'math', order: 5, title: '第五单元 · 混合运算' },
  { id: 'm2s-u6', subject: 'math', order: 6, title: '第六单元 · 有余数的除法' },
  { id: 'm2s-u7', subject: 'math', order: 7, title: '第七单元 · 万以内数的认识' },
  { id: 'm2s-u8', subject: 'math', order: 8, title: '第八单元 · 克和千克' },
  { id: 'm2s-u9', subject: 'math', order: 9, title: '第九单元 · 数学广角——推理' },
];

const seeds: LessonSeed[] = [
  {
    id: 'm2s-u1-l1', unitId: 'm2s-u1', order: 1, title: '数据收集整理',
    preview: ['数一数、记一记就是收集数据。', '用画“正”字的方法统计。'],
    review: ['“正”字一笔代表一个。', '哪种颜色人数最多就看统计结果。'],
    questions: [
      numeric('一个“正”字表示几个数？', 5, '正字 5 画，每画记 1 个。'),
      truefalse('用画“正”字的方法可以记录人数。', true, '这是常用的统计方法。'),
    ],
  },
  {
    id: 'm2s-u2-l1', unitId: 'm2s-u2', order: 2, title: '平均分',
    preview: ['每份分得同样多，叫平均分。', '把 12 个苹果平均分成 3 份。'],
    review: ['平均分每份一样多。', '可以先每份分 1 个，再分下去。'],
    questions: [
      truefalse('把 6 个桃平均分给 3 只猴子，每只 2 个。', true, '6÷3=2，每份同样多。'),
      numeric('把 10 块饼干平均分给 5 个小朋友，每人几块？', 2, '每人 2 块，一样多。'),
    ],
  },
  {
    id: 'm2s-u2-l2', unitId: 'm2s-u2', order: 3, title: '除法的初步认识',
    preview: ['平均分可以用除法算式表示。', '12 ÷ 3 = 4 读作 12 除以 3 等于 4。'],
    review: ['÷ 是除号。', '算式里先写总数，再写份数。'],
    questions: [
      numeric('把 15 个气球平均分给 3 个班，每班几个？', 5, '15÷3=5。'),
      choice('“20 ÷ 4 = 5”表示什么？', ['把 20 平均分成 4 份，每份 5 个', '20 加 4 等于 5', '4 个 20', '20 比 4 多 5'], 0, '除法表示平均分。'),
    ],
  },
  {
    id: 'm2s-u2-l3', unitId: 'm2s-u2', order: 4, title: '用 2~6 的乘法口诀求商',
    preview: ['想乘法口诀算除法。', '“三四十二”能算 12÷3 和 12÷4。'],
    review: ['12÷3=4，想“三（四）十二”。', '一句口诀可以算两道除法。'],
    questions: [
      numeric('24 ÷ 4 = ?', 6, '想“四六二十四”。'),
      numeric('18 ÷ 6 = ?', 3, '想“三六十八”。'),
    ],
  },
  {
    id: 'm2s-u3-l1', unitId: 'm2s-u3', order: 5, title: '图形的运动（一）：对称',
    preview: ['沿一条线对折，两边完全重合就是对称。', '蝴蝶、树叶都是对称的。'],
    review: ['对称图形有一条对称轴。', '剪纸常用对称。'],
    questions: [
      choice('下面哪种图形是对称的？', ['蝴蝶', '平行四边形（一般）', '任意涂色的圆', '歪扭的树叶'], 0, '蝴蝶左右两边完全一样。'),
      truefalse('对称图形对折后两边能完全重合。', true, '这就是对称的特点。'),
    ],
  },
  {
    id: 'm2s-u4-l1', unitId: 'm2s-u4', order: 6, title: '用 7~9 的乘法口诀求商',
    preview: ['用“七八五十六”算 56÷7 和 56÷8。', '口诀熟练，除法就快。'],
    review: ['56÷8=7。', '45÷9=5，想“五九四十五”。'],
    questions: [
      numeric('63 ÷ 7 = ?', 9, '想“七九六十三”。'),
      numeric('72 ÷ 8 = ?', 9, '想“八九七十二”。'),
    ],
  },
  {
    id: 'm2s-u5-l1', unitId: 'm2s-u5', order: 7, title: '混合运算',
    preview: ['算式里有乘加、乘减，先算乘法。', '有小括号先算括号里的。'],
    review: ['4 × 3 + 2 先算 4×3。', '(2 + 3) × 4 先算括号里。'],
    questions: [
      numeric('3 × 4 + 5 = ?', 17, '先算 3×4=12，再加 5。'),
      numeric('(6 + 2) × 3 = ?', 24, '先算 6+2=8，再乘 3。'),
    ],
  },
  {
    id: 'm2s-u6-l1', unitId: 'm2s-u6', order: 8, title: '有余数的除法',
    preview: ['13 个苹果每 4 个装一袋，装 3 袋还剩 1 个。', '余数要比除数小。'],
    review: ['13 ÷ 4 = 3……1，读作 13 除以 4 商 3 余 1。', '余数一定小于除数。'],
    questions: [
      numeric('17 ÷ 5 = 3 …… ?', 2, '5×3=15，17−15=2。'),
      choice('有余数的除法里，余数和除数比大小？', ['余数 < 除数', '余数 > 除数', '一样大', '没有关系'], 0, '余数要比除数小。'),
    ],
  },
  {
    id: 'm2s-u7-l1', unitId: 'm2s-u7', order: 9, title: '万以内数的认识',
    preview: ['10 个一百是一千。', '读数从高位读起。'],
    review: ['3058 读作三千零五十八。', '中间有 0 要读“零”，末尾的 0 不读。'],
    questions: [
      numeric('10 个一百是多少？', 1000, '10 个一百是一千。'),
      choice('3050 读作什么？', ['三千零五十', '三千五十', '三零五零', '三千五'], 0, '中间的 0 读出来，末尾的 0 不读。'),
    ],
  },
  {
    id: 'm2s-u7-l2', unitId: 'm2s-u7', order: 10, title: '万以内数的大小与近似数',
    preview: ['比大小先比位数，位数相同比最高位。', '近似数是接近的整十整百数。'],
    review: ['998 接近 1000。', '电视机的价格约 2000 元。'],
    questions: [
      choice('998 的近似数是多少？', ['1000', '900', '990', '999'], 0, '998 接近 1000。'),
      order('把下面各数从小到大排。', ['98', '899', '998', '1002'], '先比位数，再比最高位。'),
    ],
  },
  {
    id: 'm2s-u8-l1', unitId: 'm2s-u8', order: 11, title: '克和千克',
    preview: ['计量较轻物品用克（g）。', '2 袋盐大约 1 千克。'],
    review: ['1 千克 = 1000 克。', '一个鸡蛋约重 50 克。'],
    questions: [
      numeric('1 千克 = ? 克', 1000, '千克和千克的进率是 1000。'),
      choice('一个西瓜大约重多少？', ['4 千克', '4 克', '40 克', '400 克'], 0, '西瓜比较重，用千克。'),
    ],
  },
  {
    id: 'm2s-u9-l1', unitId: 'm2s-u9', order: 12, title: '数学广角——推理',
    preview: ['两个条件推出结论就是推理。', '小红和小丽手里拿着语文书和数学书。'],
    review: ['小红拿的不是数学书，那就是语文书。', '剩下的就是另一种书。'],
    questions: [
      choice('小红、小丽拿语文书和数学书各一本，小红拿的不是数学书，她拿的是什么？', ['语文书', '数学书', '两本都是', '没有书'], 0, '排除法：不是数学书就是语文书。'),
      truefalse('推理就是根据已知条件一步步得出结论。', true, '这就是推理。'),
    ],
  },
];

export const mathLessons2S2: Lesson[] = seeds.map((seed) => ({
  id: seed.id,
  subject: 'math' as const,
  unitId: seed.unitId,
  order: seed.order,
  title: seed.title,
  preview: { points: buildPoints(seed.id, 'p', seed.preview) },
  review: { points: buildPoints(seed.id, 'r', seed.review), mistakes: seed.mistakes ?? [], tip: seed.tip },
  questions: buildQuestions(seed.id, [...buildPoints(seed.id, 'p', seed.preview), ...buildPoints(seed.id, 'r', seed.review)].map((p) => p.id), seed.questions),
}));
