import type { Lesson, Unit } from '../types';
import {
  buildPoints,
  buildQuestions,
  choice,
  match,
  numeric,
  order,
  truefalse,
  type LessonSeed,
} from './builders';

export const mathUnits: Unit[] = [
  { id: 'ma-u1', subject: 'math', order: 1, title: '第一单元 · 长度单位' },
  { id: 'ma-u2', subject: 'math', order: 2, title: '第二单元 · 100 以内的加法和减法（二）' },
  { id: 'ma-u3', subject: 'math', order: 3, title: '第三单元 · 角的初步认识' },
  { id: 'ma-u4', subject: 'math', order: 4, title: '第四单元 · 表内乘法（一）' },
  { id: 'ma-u5', subject: 'math', order: 5, title: '第五单元 · 观察物体（一）' },
  { id: 'ma-u6', subject: 'math', order: 6, title: '第六单元 · 表内乘法（二）' },
  { id: 'ma-u7', subject: 'math', order: 7, title: '第七单元 · 认识时间' },
  { id: 'ma-u8', subject: 'math', order: 8, title: '第八单元 · 数学广角—搭配（一）' },
];

const seeds: LessonSeed[] = [
  {
    id: 'ma-u1-l1', unitId: 'ma-u1', order: 1, title: '认识厘米',
    preview: ['量比较短的物体，可以用厘米作单位。', '尺子上 0 到 1 之间的长度是 1 厘米。'],
    review: ['测量时，物体的一端要对准尺子的刻度 0。', '厘米可以用字母 cm 表示。'],
    tip: '先估一估，再量一量。',
    questions: [
      choice('量铅笔的长度，用哪个单位合适？', ['厘米', '米', '千克', '小时'], 0),
      numeric('从刻度 0 量到刻度 6，长多少厘米？', 6),
      truefalse('量长度时可以从尺子的任意刻度开始。', false, '通常从刻度 0 开始，或把两端刻度相减。'),
    ],
    afterClass: [numeric('一支粉笔大约长 5（ ）。填数字题：3 厘米 + 4 厘米 = ？', 7), numeric('10 厘米 - 6 厘米 = ？', 4)],
  },
  {
    id: 'ma-u1-l2', unitId: 'ma-u1', order: 2, title: '认识米',
    preview: ['量比较长的物体，可以用米作单位。', '1 米 = 100 厘米。'],
    review: ['米可以用字母 m 表示。', '教室的长、旗杆的高一般用米作单位。'],
    questions: [
      choice('教室的长大约是 8（ ）。', ['米', '厘米', '元', '分'], 0),
      numeric('2 米等于多少厘米？', 200),
      truefalse('1 米比 1 厘米短。', false, '1 米 = 100 厘米，比 1 厘米长得多。'),
    ],
    afterClass: [numeric('1 米 - 30 厘米 = ？（填厘米数）', 70), numeric('3 米 = ？厘米', 300)],
  },
  {
    id: 'ma-u1-l3', unitId: 'ma-u1', order: 3, title: '线段',
    preview: ['线段是直的，有两个端点。', '线段可以量出长度。'],
    review: ['画线段时，从尺子的刻度 0 画到指定刻度。', '两点之间可以画一条线段。'],
    questions: [
      truefalse('线段有两个端点。', true),
      choice('下面哪个图形是线段？', ['一条直直的、两端有点的线', '一条弯弯的线', '一个圆', '一个角'], 0),
      numeric('从刻度 2 画到刻度 9，线段长多少厘米？', 7),
    ],
    afterClass: [numeric('画一条 5 厘米长的线段，从 0 画到几？', 5), numeric('一条线段长 8 厘米，另一条长 3 厘米，一共长多少厘米？', 11)],
  },
  {
    id: 'ma-u2-l1', unitId: 'ma-u2', order: 4, title: '不进位加',
    preview: ['列竖式时，相同数位要对齐。', '从个位加起。'],
    review: ['个位相加不满十，不需要进位。', '计算后要把结果写在横式上。'],
    questions: [
      numeric('23 + 45 = ？', 68),
      numeric('31 + 26 = ？', 57),
      truefalse('列加法竖式时，个位和个位对齐。', true),
    ],
    afterClass: [numeric('42 + 35 = ？', 77), numeric('24 + 13 = ？', 37), numeric('50 + 27 = ？', 77)],
  },
  {
    id: 'ma-u2-l2', unitId: 'ma-u2', order: 5, title: '进位加',
    preview: ['个位相加满十，要向十位进 1。', '进位的 1 要写在十位下面。'],
    review: ['计算 28 + 35 时，8 + 5 = 13，写 3 进 1。', '十位相加时别忘了加上进位的 1。'],
    questions: [
      numeric('28 + 35 = ？', 63),
      numeric('46 + 27 = ？', 73),
      truefalse('个位相加满十，要向十位进 1。', true),
    ],
    afterClass: [numeric('37 + 45 = ？', 82), numeric('58 + 26 = ？', 84), numeric('19 + 63 = ？', 82)],
  },
  {
    id: 'ma-u2-l3', unitId: 'ma-u2', order: 6, title: '退位减',
    preview: ['个位不够减，要从十位退 1 当十。', '退位后十位要少 1。'],
    review: ['计算 52 - 27 时，2 不够减 7，从十位退 1。', '12 - 7 = 5，十位变成 4，4 - 2 = 2。'],
    questions: [
      numeric('52 - 27 = ？', 25),
      numeric('63 - 38 = ？', 25),
      truefalse('个位不够减时，可以从十位退 1。', true),
    ],
    afterClass: [numeric('71 - 46 = ？', 25), numeric('85 - 57 = ？', 28), numeric('40 - 16 = ？', 24)],
  },
  {
    id: 'ma-u2-l4', unitId: 'ma-u2', order: 7, title: '连加、连减和加减混合',
    preview: ['连加、连减要按从左到右的顺序计算。', '有小括号时，先算小括号里的。'],
    review: ['加减混合运算也从左到右算。', '可以分步写，也可以写成一个竖式。'],
    questions: [
      numeric('24 + 18 - 12 = ？', 30),
      numeric('60 - 25 + 14 = ？', 49),
      order('把计算顺序排一排。', ['先算 24 + 18', '得到 42', '再减 12', '结果是 30']),
    ],
    afterClass: [numeric('35 + 27 - 19 = ？', 43), numeric('72 - 38 + 16 = ？', 50), numeric('18 + 26 + 14 = ？', 58)],
  },
  {
    id: 'ma-u3-l1', unitId: 'ma-u3', order: 8, title: '角的认识',
    preview: ['一个角有一个顶点和两条边。', '角的两条边是直的。'],
    review: ['角的大小与边的长短无关。', '角的两条边张开得越大，角就越大。'],
    questions: [
      choice('一个角有几个顶点？', ['1 个', '2 个', '3 个', '4 个'], 0),
      truefalse('角的两条边越长，角就越大。', false, '角的大小与边的长短无关。'),
      match('把角的组成连起来。', [{ left: '1 个', right: '顶点' }, { left: '2 条', right: '边' }]),
    ],
    afterClass: [numeric('一个三角形有几个角？', 3), numeric('一个长方形有几个角？', 4)],
  },
  {
    id: 'ma-u3-l2', unitId: 'ma-u3', order: 9, title: '直角、锐角和钝角',
    preview: ['三角尺上有一个角是直角。', '比直角小的角叫锐角，比直角大的角叫钝角。'],
    review: ['可以用三角尺上的直角比一比。', '锐角 < 直角 < 钝角。'],
    questions: [
      choice('比直角小的角叫什么？', ['锐角', '钝角', '直角', '平角'], 0),
      truefalse('钝角比直角大。', true),
      order('按角的大小从小到大排列。', ['锐角', '直角', '钝角']),
    ],
    afterClass: [numeric('一个三角尺上有几个直角？', 1), numeric('长方形有几个直角？', 4)],
  },
  {
    id: 'ma-u4-l1', unitId: 'ma-u4', order: 10, title: '乘法的初步认识',
    preview: ['求几个相同加数的和，可以用乘法。', '3 + 3 + 3 + 3 可以写成 3 × 4。'],
    review: ['乘法算式中的两个数叫因数，结果叫积。', '3 × 4 读作“3 乘 4”。'],
    questions: [
      choice('4 + 4 + 4 可以写成哪个乘法算式？', ['4 × 3', '4 + 3', '4 × 4', '3 + 3'], 0),
      numeric('2 + 2 + 2 + 2 + 2 = 2 × ？', 5),
      truefalse('乘法是求几个相同加数的和的简便运算。', true),
    ],
    afterClass: [numeric('5 + 5 + 5 = 5 × ？', 3), numeric('3 × 4 = ？', 12), numeric('6 + 6 = 6 × ？', 2)],
  },
  {
    id: 'ma-u4-l2', unitId: 'ma-u4', order: 11, title: '2—6 的乘法口诀',
    preview: ['一句口诀可以写出两道乘法算式。', '二二得四，二三得六，二四得八。'],
    review: ['三五十五，三四十二，三六十八。', '四四十六，四五二十，四六二十四。'],
    questions: [
      numeric('3 × 5 = ？', 15),
      numeric('4 × 6 = ？', 24),
      choice('“四四十六”对应的乘法算式是？', ['4 × 4 = 16', '4 + 4 = 8', '4 × 6 = 24', '2 × 8 = 16'], 0),
    ],
    afterClass: [numeric('2 × 6 = ？', 12), numeric('5 × 5 = ？', 25), numeric('3 × 6 = ？', 18)],
  },
  {
    id: 'ma-u4-l3', unitId: 'ma-u4', order: 12, title: '用乘法解决问题',
    preview: ['求几个几是多少，用乘法计算。', '每份有 4 个，有 3 份，一共 4 × 3 个。'],
    review: ['先找每份数和份数，再列乘法算式。', '别忘了写单位和答语。'],
    questions: [
      numeric('每盘有 5 个苹果，3 盘一共有多少个？', 15),
      numeric('每排坐 4 人，6 排一共坐多少人？', 24),
      choice('“每束 3 朵花，5 束一共多少朵”用哪个算式？', ['3 × 5', '3 + 5', '5 - 3', '3 + 3'], 0),
    ],
    afterClass: [numeric('每盒 6 支笔，4 盒一共多少支？', 24), numeric('每只小兔吃 2 根萝卜，5 只吃多少根？', 10)],
  },
  {
    id: 'ma-u5-l1', unitId: 'ma-u5', order: 13, title: '从不同位置观察物体',
    preview: ['从不同位置观察同一个物体，看到的形状可能不同。', '观察时要抓住物体的特征。'],
    review: ['前面、侧面、上面看到的形状可能不一样。', '判断时可以先想自己站在哪个位置。'],
    questions: [
      truefalse('从不同位置看同一个物体，看到的形状一定相同。', false),
      choice('观察一个茶杯，从上面看最可能看到什么？', ['一个圆', '一个长方形', '一条线', '一个三角形'], 0),
      match('把位置和看到的形状连起来。', [{ left: '正面', right: '杯子的正面' }, { left: '上面', right: '杯口' }]),
    ],
    afterClass: [numeric('一个正方体有几个面？', 6), numeric('从正面看一个正方体，看到几个正方形？', 1)],
  },
  {
    id: 'ma-u6-l1', unitId: 'ma-u6', order: 14, title: '7 的乘法口诀',
    preview: ['一七得七，二七十四，三七二十一。', '四七二十八，五七三十五，六七四十二。'],
    review: ['七七四十九。', '7 的乘法口诀可以帮我们算得更快。'],
    questions: [
      numeric('7 × 4 = ？', 28),
      numeric('7 × 6 = ？', 42),
      choice('“五七三十五”对应的算式是？', ['5 × 7 = 35', '5 + 7 = 12', '7 × 7 = 49', '5 × 5 = 25'], 0),
    ],
    afterClass: [numeric('7 × 3 = ？', 21), numeric('7 × 7 = ？', 49), numeric('7 × 5 = ？', 35)],
  },
  {
    id: 'ma-u6-l2', unitId: 'ma-u6', order: 15, title: '8 的乘法口诀',
    preview: ['一八得八，二八十六，三八二十四。', '四八三十二，五八四十，六八四十八。'],
    review: ['七八五十六，八八六十四。', '8 × 7 和 7 × 8 的积相同。'],
    questions: [
      numeric('8 × 6 = ？', 48),
      numeric('8 × 7 = ？', 56),
      truefalse('8 × 8 = 64。', true),
    ],
    afterClass: [numeric('8 × 4 = ？', 32), numeric('8 × 9 = ？', 72), numeric('8 × 5 = ？', 40)],
  },
  {
    id: 'ma-u6-l3', unitId: 'ma-u6', order: 16, title: '9 的乘法口诀',
    preview: ['一九得九，二九十八，三九二十七。', '四九三十六，五九四十五，六九五十四。'],
    review: ['七九六十三，八九七十二，九九八十一。', '9 的乘法口诀积的十位和个位数字相加等于 9。'],
    questions: [
      numeric('9 × 6 = ？', 54),
      numeric('9 × 9 = ？', 81),
      truefalse('9 × 8 = 72。', true),
    ],
    afterClass: [numeric('9 × 3 = ？', 27), numeric('9 × 7 = ？', 63), numeric('9 × 5 = ？', 45)],
  },
  {
    id: 'ma-u7-l1', unitId: 'ma-u7', order: 17, title: '认识几时几分',
    preview: ['钟面上有 12 个大格，60 个小格。', '时针走 1 大格是 1 小时，分针走 1 小格是 1 分钟。'],
    review: ['1 时 = 60 分。', '分针走一圈，时针走 1 大格。'],
    questions: [
      choice('分针走 1 小格是多长时间？', ['1 分钟', '5 分钟', '1 小时', '半小时'], 0),
      numeric('1 时等于多少分？', 60),
      truefalse('时针走 1 大格是 1 小时。', true),
    ],
    afterClass: [numeric('半时等于多少分？', 30), numeric('钟面上有多少个大格？', 12)],
  },
  {
    id: 'ma-u7-l2', unitId: 'ma-u7', order: 18, title: '时间的计算',
    preview: ['8 时 30 分再过 25 分，是 8 时 55 分。', '1 时 = 60 分，满 60 分要进 1 时。'],
    review: ['计算经过时间，可以用结束时间减开始时间。', '同一小时内，分钟数直接相加。'],
    questions: [
      numeric('8 时 30 分再过 25 分，是几时几分？（只填分钟数 55）', 55),
      numeric('从 3 时到 5 时，经过几小时？', 2),
      truefalse('7 时 50 分再过 10 分是 8 时。', true),
    ],
    afterClass: [numeric('9 时 20 分再过 40 分，是 10 时几分？（填分钟数）', 0), numeric('一节课 40 分钟，两节课共多少分钟？', 80)],
  },
  {
    id: 'ma-u8-l1', unitId: 'ma-u8', order: 19, title: '简单的排列',
    preview: ['用 1、2、3 三个数字，可以组成不同的两位数。', '按顺序思考，才不会重复或遗漏。'],
    review: ['十位和个位不能相同，可以组成 6 个两位数。', '可以先固定十位，再换个位。'],
    questions: [
      numeric('用 1、2、3 组成十位和个位不同的两位数，一共几个？', 6),
      choice('下面哪个数是 1、2、3 组成的两位数？', ['12', '11', '33', '4'], 0),
      order('按从小到大的顺序排列这些两位数。', ['12', '13', '21', '23', '31', '32']),
    ],
    afterClass: [numeric('用 2、4、6 组成不同的两位数，一共几个？', 6), numeric('用 1、2 组成两位数，一共几个？', 2)],
  },
  {
    id: 'ma-u8-l2', unitId: 'ma-u8', order: 20, title: '简单的组合',
    preview: ['3 个人，每两人握一次手，一共握 3 次。', '组合与顺序无关，排列与顺序有关。'],
    review: ['可以画图连线，做到不重复、不遗漏。', '从 3 个里选 2 个，只有 3 种选法。'],
    questions: [
      numeric('小明、小红、小刚三人，每两人握一次手，一共几次？', 3),
      choice('从 3 种水果中选 2 种，有几种选法？', ['3 种', '2 种', '6 种', '1 种'], 0),
      truefalse('排列和组合是一样的。', false, '排列和顺序有关，组合与顺序无关。'),
    ],
    afterClass: [numeric('4 个人每两人握一次手，一共几次？', 6), numeric('从 4 种颜色中选 2 种，有几种选法？', 6)],
  },
];

export const mathLessons: Lesson[] = seeds.map((seed) => {
  const previewPoints = buildPoints(seed.id, 'p', seed.preview);
  const reviewPoints = buildPoints(seed.id, 'r', seed.review);
  const kpIds = [...previewPoints, ...reviewPoints].map((p) => p.id);
  return {
    id: seed.id,
    subject: 'math',
    unitId: seed.unitId,
    order: seed.order,
    title: seed.title,
    preview: { points: previewPoints },
    review: { points: reviewPoints, mistakes: seed.mistakes ?? [], tip: seed.tip },
    questions: buildQuestions(seed.id, kpIds, seed.questions),
    afterClass: buildQuestions(`${seed.id}-ac`, kpIds, seed.afterClass ?? []),
  };
});
