import type { Question } from '../types';
import { seededRandom } from '../../core/grading';

/**
 * 数学课后练习生成器（2026-10-26 需求：每课 10-20 道）：
 * 每课注册 2-4 个与知识点对齐的题模板，用课 id 播种的确定性随机数展开成
 * 数值变式，凑足每课目标题量。特点：
 *  - 确定性：同一课每次生成的题与顺序完全一致（错题重做、快照可复现）；
 *  - 对齐教材：模板只考本课知识点，数值范围按人教二上口径约束；
 *  - id 稳定：`ma-d<课序>-<序号>`，与随堂/课后题不冲突。
 * 二下包（m2s-）复用同一机制，模板见 mathDrill2S2.ts。
 */

type Rng = () => number;

type DrillTemplate = (rng: Rng) => QuestionSeedOut;

interface QuestionSeedOut {
  type: 'numeric' | 'choice' | 'truefalse';
  stem: string;
  answer?: number;
  options?: string[];
  answerIndex?: number;
  explanation?: string;
}

const ri = (rng: Rng, min: number, max: number): number => min + Math.floor(rng() * (max - min + 1));

function numeric(stem: string, answer: number, explanation?: string): QuestionSeedOut {
  return { type: 'numeric', stem, answer, explanation: explanation ?? `答案是 ${answer}。` };
}

function choice(stem: string, options: string[], answerIndex: number, explanation?: string): QuestionSeedOut {
  return { type: 'choice', stem, options, answerIndex, explanation };
}

function truefalse(stem: string, answer: boolean, explanation?: string): QuestionSeedOut {
  return { type: 'truefalse', stem, options: ['对', '错'], answerIndex: answer ? 0 : 1, explanation };
}

// 数值辅助：两位数、不进位加、进位加、退位减
const twoDigit = (rng: Rng, lo = 11, hi = 89): number => ri(rng, lo, hi);
function addNoCarry(rng: Rng): [number, number] {
  for (let i = 0; i < 40; i += 1) {
    const a = twoDigit(rng);
    const b = twoDigit(rng);
    if ((a % 10) + (b % 10) < 10 && Math.floor(a / 10) + Math.floor(b / 10) < 10) return [a, b];
  }
  return [23, 34];
}
function addCarry(rng: Rng): [number, number] {
  for (let i = 0; i < 40; i += 1) {
    const a = twoDigit(rng);
    const b = twoDigit(rng);
    if ((a % 10) + (b % 10) >= 10) return [a, b];
  }
  return [27, 36];
}
function subBorrow(rng: Rng): [number, number] {
  for (let i = 0; i < 40; i += 1) {
    const a = twoDigit(rng, 30, 98);
    const b = ri(rng, 11, a - 10);
    if (a % 10 < b % 10) return [a, b];
  }
  return [52, 27];
}

/** 每课模板表（key = 课本课序 1-20，人教二上）。 */
const RECIPES: Record<number, DrillTemplate[]> = {
  1: [
    (r) => { void r; return choice('下面哪个物体大约长 1 厘米？', ['大拇指的宽度', '课桌的高度', '教室的门', '操场的长'], 0, '大拇指宽度约 1 厘米。'); },
    (r) => { void r; return truefalse('测量课本的长度用米作单位比较合适。', false, '课本较短，用厘米作单位。'); },
    (r) => { const a = ri(r, 3, 9); return numeric(`橡皮长 ${a} 厘米，铅笔比橡皮长 ${ri(r, 2, 5)} 厘米，铅笔约长几厘米？（答整数）`, a + 3, '把两段合起来。'); },
  ],
  2: [
    (r) => { void r; return choice('1 米 = ? 厘米', ['10', '100', '1000', '1'], 1, '1 米 = 100 厘米。'); },
    (r) => { void r; return choice('黑板的长大约是多少？', ['4 米', '4 厘米', '40 厘米', '4 元'], 0, '较长的物体用米。'); },
    (r) => { const m = ri(r, 1, 3); return numeric(`${m} 米 = ? 厘米`, m * 100, '1 米是 100 厘米。'); },
  ],
  3: [
    (r) => { void r; return truefalse('线段是可以量出长度的，两端各有一个端点。', true, '这是线段的特点。'); },
    (r) => { const a = ri(r, 2, 5); const b = ri(r, 2, 6); return numeric(`画一条由 ${a} 段线段连成的折线，每段 ${b} 厘米，一共长几厘米？`, a * b, `${a} 个 ${b} 相加。`); },
    (r) => { void r; return choice('下面说法对吗：两点之间可以画无数条线段。', ['不对，只能画一条', '对', '看情况', '三条'], 0, '两点之间只能画一条线段。'); },
  ],
  4: [
    (r) => { const [a, b] = addNoCarry(r); return numeric(`${a} + ${b} = ?`, a + b, '个位、十位分别相加，不进位。'); },
    (r) => { const [a, b] = addNoCarry(r); return numeric(`${a} + ${b} = ?`, a + b); },
    (r) => { const [a, b] = addNoCarry(r); return numeric(`一个数是 ${a}，另一个数比它多 ${b - Math.floor(b / 10) * 10}，列式 ${a} + ${b - Math.floor(b / 10) * 10} = ?`, a + (b - Math.floor(b / 10) * 10)); },
  ],
  5: [
    (r) => { const [a, b] = addCarry(r); return numeric(`${a} + ${b} = ?`, a + b, '个位相加满十，向十位进 1。'); },
    (r) => { const [a, b] = addCarry(r); return numeric(`${a} + ${b} = ?`, a + b); },
    (r) => { const [a, b] = addCarry(r); return numeric(`${a} + ${b} = ?`, a + b); },
  ],
  6: [
    (r) => { const [a, b] = subBorrow(r); return numeric(`${a} − ${b} = ?`, a - b, '个位不够减，向十位借 1。'); },
    (r) => { const [a, b] = subBorrow(r); return numeric(`${a} − ${b} = ?`, a - b); },
    (r) => { const [a, b] = subBorrow(r); return numeric(`${a} − ${b} = ?`, a - b); },
  ],
  7: [
    (r) => { const a = ri(r, 15, 40); const b = ri(r, 10, 30); const cc = ri(r, 5, 15); return numeric(`${a} + ${b} − ${cc} = ?`, a + b - cc, '从左往右依次算。'); },
    (r) => { const a = ri(r, 40, 70); const b = ri(r, 10, 25); const cc = ri(r, 10, 20); return numeric(`${a} − ${b} + ${cc} = ?`, a - b + cc); },
    (r) => { const a = ri(r, 10, 25); const b = ri(r, 10, 25); const cc = ri(r, 10, 25); return numeric(`${a} + ${b} + ${cc} = ?`, a + b + cc); },
  ],
  8: [
    (r) => { void r; return choice('一个角有几个顶点、几条边？', ['1 个顶点 2 条边', '2 个顶点 1 条边', '没有顶点', '3 条边'], 0, '角有一个顶点和两条边。'); },
    (r) => { void r; return truefalse('角的两条边越长，角就越大。', false, '角的大小与边的长短无关。'); },
    (r) => { const n = ri(r, 3, 5); return numeric(`一个 ${n} 边形有几个角？（填数字）`, n, '每个顶点处一个角。'); },
  ],
  9: [
    (r) => { void r; return choice('比直角小的角叫什么角？', ['锐角', '钝角', '直角', '平角'], 0, '比直角小的是锐角。'); },
    (r) => { void r; return choice('比直角大的角叫什么角？', ['钝角', '锐角', '直角', '线段'], 0, '比直角大的是钝角。'); },
    (r) => { void r; return truefalse('三角板上最大的那个角是直角。', true, '三角板上有一个直角、两个锐角。'); },
  ],
  10: [
    (r) => { const a = ri(r, 2, 5); const b = ri(r, 2, 5); return choice(`${a} + ${a} + ${a} + ${a}（共 ${b === 3 ? 3 : 4} 个 ${a}）写成乘法算式是？`, [`${a} × 4`, `${a} + 4`, `4 + ${a + a}`, `${a} × ${a}`], 0, '相同加数连加可以写成乘法。'); },
    (r) => { const a = ri(r, 3, 6); const b = ri(r, 2, 4); return numeric(`${a} 个 ${b} 相加，写成乘法：${a} × ${b} = ?`, a * b, `乘法是加法的简便运算。`); },
    (r) => { void r; return truefalse('3 × 4 读作“3 乘 4”。', true, '乘号读作“乘”。'); },
  ],
  11: [
    (r) => { const a = ri(r, 2, 6); const b = ri(r, 2, 6); return numeric(`${a} × ${b} = ?`, a * b, `想口诀：${a}${b} ${a * b === 12 ? '十二' : ''}。`.replace('  ', ' ')); },
    (r) => { const a = ri(r, 2, 6); const b = ri(r, 2, 6); return numeric(`${a} × ${b} = ?`, a * b); },
    (r) => { const a = ri(r, 2, 6); const b = ri(r, 2, 6); return numeric(`${a} × ${b} + ${a} = ?`, a * b + a, `先算乘法，再加 ${a}。`); },
  ],
  12: [
    (r) => { const price = ri(r, 2, 6); const count = ri(r, 3, 6); return numeric(`每支铅笔 ${price} 元，买 ${count} 支一共多少元？`, price * count, `单价 × 数量 = 总价：${price} × ${count}。`); },
    (r) => { const box = ri(r, 3, 6); const each = ri(r, 2, 6); return numeric(`每盒有 ${each} 个球，${box} 盒一共有多少个？`, box * each, `${box} × ${each}。`); },
    (r) => { const rows = ri(r, 2, 5); const cols = ri(r, 3, 6); return numeric(`座位每排 ${cols} 个，共 ${rows} 排，一共有多少个座位？`, rows * cols, `${rows} × ${cols}。`); },
  ],
  13: [
    (r) => { void r; return choice('从正面看一个水壶，和从上面看到的形状一样吗？', ['不一样', '一样', '看不出', '都一样'], 0, '从不同位置观察，看到的形状可能不同。'); },
    (r) => { void r; return truefalse('从不同位置观察同一个物体，看到的形状可能不同。', true, '这正是本课的重点。'); },
    (r) => { void r; return choice('小明看到的是物体的正面，小红在他的对面，她看到的是？', ['物体的后面', '也是正面', '上面', '侧面'], 0, '对面看到的是另一面。'); },
  ],
  14: [
    (r) => { const b = ri(r, 3, 9); return numeric(`7 × ${b} = ?`, 7 * b, `想口诀“七${b} ${7 * b}”。`.replace('七3 21', '三七二十一')); },
    (r) => { const b = ri(r, 3, 9); return numeric(`${b} × 7 = ?`, 7 * b); },
    (r) => { const b = ri(r, 3, 9); return numeric(`7 × ${b} + 7 = ?`, 7 * b + 7, `就是 7 × ${b + 1}。`); },
  ],
  15: [
    (r) => { const b = ri(r, 3, 9); return numeric(`8 × ${b} = ?`, 8 * b, `想口诀“八${b} ${8 * b}”。`); },
    (r) => { const b = ri(r, 3, 9); return numeric(`${b} × 8 = ?`, 8 * b); },
    (r) => { const b = ri(r, 3, 9); return numeric(`8 × ${b} − 8 = ?`, 8 * b - 8, `就是 8 × ${b - 1}。`); },
  ],
  16: [
    (r) => { const b = ri(r, 3, 9); return numeric(`9 × ${b} = ?`, 9 * b, `想口诀“九${b} ${9 * b}”。`); },
    (r) => { const b = ri(r, 2, 9); return numeric(`${b} × 9 = ?`, 9 * b); },
    (r) => { const b = ri(r, 2, 9); return numeric(`9 × ${b} − ${b} = ?`, 9 * b - b, `就是 8 × ${b}。`); },
  ],
  17: [
    (r) => { void r; return choice('分针从 12 走到 6，走了多少分钟？', ['30 分钟', '6 分钟', '60 分钟', '12 分钟'], 0, '走到 6 是半小时，30 分钟。'); },
    (r) => { void r; return truefalse('时针走过数字 3，分针指在 6，是 3:30。', true, '分针指 6 就是半点。'); },
    (r) => { const h = ri(r, 1, 11); const m = [15, 30, 45][ri(r, 0, 2)]; return choice(`钟面上时针刚过 ${h}，分针指向 ${m / 15 === 1 ? '3' : m / 15 === 2 ? '6' : '9'}，此刻是几点几分？`, [`${h}:${String(m).padStart(2, '0')}`, `${h}:${String(m + 5).padStart(2, '0')}`, `${h + 1}:${String(m).padStart(2, '0')}`, `${h - 1}:${String(m).padStart(2, '0')}`], 0, `分针指 ${m / 15 === 1 ? '3' : m / 15 === 2 ? '6' : '9'} 就是 ${m} 分。`); },
  ],
  18: [
    (r) => { const start = ri(r, 8, 9); const mins = ri(r, 2, 5) * 5; return numeric(`小明 ${start}:${String(0).padStart(2, '0')}0 开始写作业，写了 ${mins} 分钟，结束时是 ${start} 时 ${mins} 分。对吗？——结束是几时几分？（填分钟数，按时计）`, mins, `${start} 时 0 分 + ${mins} 分钟。`); },
    (r) => { const h1 = ri(r, 7, 9); const m1 = [10, 20, 30][ri(r, 0, 2)]; const dur = ri(r, 2, 4) * 5; return numeric(`一节课 ${dur} 分钟，${h1}:${String(m1).padStart(2, '0')} 上课，下课时分钟数是 ${m1}+${dur}（不满 60），下课时是 ${h1} 时几分？（填分钟数）`, m1 + dur, `${m1} + ${dur} = ${m1 + dur} 分。`); },
    (r) => { void r; return truefalse('分针走一大格是 5 分钟。', true, '一圈 60 分钟，12 大格，每格 5 分钟。'); },
  ],
  19: [
    (r) => { const a = ri(r, 1, 8); const b = ri(r, 1, 8); return numeric(`用 ${a} 和 ${b} 两个数字能组成几个不同的两位数？（十位不重复）`, 2, `${a}${b} 和 ${b}${a}。`); },
    (r) => { const a = ri(r, 1, 4); const b = a + 1; const cc = b + 1; return numeric(`用 ${a}、${b}、${cc} 三个数字，每个只用一次，能组成几个不同的两位数？`, 6, '固定十位换个位：共 3×2=6 个。'); },
    (r) => { void r; return truefalse('用 1 和 2 组成两位数，12 和 21 是不同的数。', true, '数字位置不同，数就不同。'); },
  ],
  20: [
    (r) => { const tops = ri(r, 2, 4); const pants = ri(r, 2, 3); return numeric(`${tops} 件上衣配 ${pants} 条裤子，一共几种穿法？`, tops * pants, `每件上衣配 ${pants} 条，共 ${tops} × ${pants} 种。`); },
    (r) => { const a = ri(r, 2, 3); const b = ri(r, 2, 4); return numeric(`早餐有 ${a} 种粥和 ${b} 种点心，一种粥配一种点心，共有几种搭配？`, a * b, `${a} × ${b}。`); },
    (r) => { void r; return truefalse('3 件上衣和 2 条裤子，一共有 5 种穿法。', false, '是 3 × 2 = 6 种穿法，不是相加。'); },
  ],
};

export const MATH_DRILL_TARGET = 12;

/** 给一节数学课生成课后练习（确定性）。返回 Question（id 已按课序编号）。 */
/** 二下（m2s-）模板表：人教二下知识点。 */
const RECIPES_2S2: Record<number, DrillTemplate[]> = {
  1: [
    (r) => { void r; return choice('记录人数用画“正”字，一个“正”字代表几？', ['5', '4', '1', '10'], 0, '正字 5 画。'); },
    (r) => { void r; return truefalse('统计哪种颜色的人数最多，只要比一比“正”字的个数。', true, '个数多的就是最多的。'); },
    (r) => { const a = ri(r, 3, 9); const b = ri(r, 2, 6); return numeric(`喜欢红色 ${a} 人，喜欢蓝色比红色少 ${b} 人，喜欢蓝色几人？`, a - b, `${a} − ${b}。`); },
  ],
  2: [
    (r) => { const total = ri(r, 2, 5) * 2; const parts = 2; return numeric(`把 ${total} 个苹果平均分成 ${parts} 份，每份几个？`, total / parts, `平均分：${total} ÷ ${parts}。`); },
    (r) => { void r; return truefalse('每份分得同样多，叫平均分。', true, '这是平均分的定义。'); },
    (r) => { const total = ri(r, 3, 6) * 3; return numeric(`${total} 块饼干平均分给 3 个小朋友，每人几块？`, total / 3, `${total} ÷ 3。`); },
  ],
  3: [
    (r) => { const a = ri(r, 2, 5) * 2; const b = ri(r, 2, 6); return numeric(`${a} ÷ ${b} = ?`, a / b, `想乘法口诀。`); },
    (r) => { void r; return choice('“12 ÷ 3 = 4”读作什么？', ['12 除以 3 等于 4', '12 除 3 等于 4', '3 除以 12 等于 4', '12 乘 3 等于 4'], 0, '读作：12 除以 3 等于 4。'); },
    (r) => { const a = ri(r, 2, 6) * 2; return numeric(`${a} ÷ 2 = ?`, a / 2, '想“二三得六”这类口诀。'); },
  ],
  4: [
    (r) => { const a = ri(r, 2, 6) * 3; return numeric(`${a} ÷ 3 = ?`, a / 3, '想 3 的乘法口诀。'); },
    (r) => { const a = ri(r, 4, 9) * 5; return numeric(`${a} ÷ 5 = ?`, a / 5, '想 5 的乘法口诀。'); },
    (r) => { const b = ri(r, 3, 9); return numeric(`${7 * b} ÷ 7 = ?`, b, '想 7 的口诀。'); },
  ],
  5: [
    (r) => { const a = ri(r, 2, 9); const b = ri(r, 2, 9); const cc = ri(r, 2, 9); return numeric(`${a} × ${b} + ${cc} = ?`, a * b + cc, '先乘后加。'); },
    (r) => { const a = ri(r, 3, 9); const b = ri(r, 2, 9); const cc = ri(r, 1, a - 1); return numeric(`${a} × ${b} − ${cc} = ?`, a * b - cc, '先乘后减。'); },
    (r) => { const a = ri(r, 2, 6); const b = ri(r, 2, 6); const cc = ri(r, 2, 9); return numeric(`(${a} + ${b}) × ${cc} = ?`, (a + b) * cc, '有括号先算括号里。'); },
  ],
  6: [
    (r) => { const d = ri(r, 3, 9); const q = ri(r, 2, 8); const rem = ri(r, 1, d - 1); return numeric(`${d * q + rem} ÷ ${d} = ? …… ?（填余数）`, rem, `商 ${q} 余 ${rem}。`); },
    (r) => { void r; return choice('有余数的除法里，余数一定要比除数？', ['小', '大', '相等', '无关'], 0, '余数必须小于除数。'); },
    (r) => { const d = ri(r, 4, 8); const rem = ri(r, 1, d - 1); return numeric(`一个数除以 ${d} 余 ${rem}，余数最大还能是多少？（就是它本身满足规则即可，答 ${rem}）`, rem, '余数小于除数。'); },
  ],
  7: [
    (r) => { void r; return numeric('10 个一百是多少？', 1000, '10 个一百是一千。'); },
    (r) => { void r; return choice('3050 读作什么？', ['三千零五十', '三千五十', '三零五零', '三千五'], 0, '中间的 0 要读。'); },
    (r) => { const a = ri(r, 2, 9) * 100 + ri(r, 1, 9) * 10; const b = a + 1; return numeric(`${a} + 10 = ?`, b, '十个十个地数。'); },
  ],
  8: [
    (r) => { void r; return numeric('1 千克 = ? 克', 1000, '1 千克 = 1000 克。'); },
    (r) => { void r; return choice('一个西瓜大约多重？', ['4 千克', '4 克', '40 克', '400 克'], 0, '重的物体用千克。'); },
    (r) => { void r; return choice('一个鸡蛋大约重多少？', ['50 克', '50 千克', '5 千克', '500 克'], 0, '轻的物体用克。'); },
  ],
  9: [
    (r) => { void r; return numeric('10 个一百是多少？', 1000, '10 个一百是一千。'); },
    (r) => { void r; return choice('3050 读作什么？', ['三千零五十', '三千五十', '三零五零', '三千五'], 0, '中间的 0 要读出来。'); },
    (r) => { const a = ri(r, 2, 9) * 100 + ri(r, 1, 9) * 10; return numeric(`${a} + 10 = ?`, a + 10, '十个十个地数。'); },
  ],
  10: [
    (r) => { void r; return choice('998 和 1002 谁更大？', ['1002', '998', '一样大', '不能比'], 0, '位数相同比最高位。'); },
    (r) => { void r; return numeric('998 最接近哪个整百数？', 1000, '998 接近 1000。'); },
    (r) => { void r; return truefalse('比较万以内数的大小，先比位数，位数多的数大。', true, '位数不同先看位数。'); },
  ],
  11: [
    (r) => { void r; return numeric('1 千克 = ? 克', 1000, '千克与克的进率是 1000。'); },
    (r) => { void r; return choice('计量一枚硬币的重量，用什么单位合适？', ['克', '千克', '米', '元'], 0, '很轻的物体用克。'); },
    (r) => { void r; return choice('一个西瓜大约多重？', ['4 千克', '4 克', '40 克', '400 克'], 0, '重的物体用千克。'); },
  ],
  12: [
    (r) => { void r; return choice('小红、小丽拿语文书和数学书各一本，小红拿的不是数学书，她拿的是？', ['语文书', '数学书', '两本都是', '都没有'], 0, '排除法推理。'); },
    (r) => { void r; return truefalse('推理就是根据已知条件一步步得出结论。', true, '这就是推理。'); },
    (r) => { void r; return choice('三个小朋友分别拍了 20、35、27 下，最多的比最少的多几下？', ['15', '8', '7', '27'], 0, '35 − 20 = 15。'); },
  ],
};

export function buildMathDrill(lessonOrder: number, lessonId: string, existingCount: number): Question[] {
  const templates = lessonId.startsWith('m2s-') ? RECIPES_2S2[lessonOrder] : RECIPES[lessonOrder];
  if (!templates || templates.length === 0) return [];
  const need = Math.max(0, MATH_DRILL_TARGET - existingCount);
  if (need === 0) return [];
  const rng = seededRandom(`math-drill:${lessonId}`);
  const out: Question[] = [];
  for (let i = 0; i < need; i += 1) {
    const seed = templates[i % templates.length]!;
    const seedOut = seed(rng);
    const knowledgePointIds = [`ma-d${lessonOrder}`];
    out.push({
      id: `ma-d${lessonOrder}-n${i + 1}`,
      type: seedOut.type,
      knowledgePointIds,
      stem: seedOut.stem,
      ...(seedOut.type === 'numeric' ? { answer: seedOut.answer } : {}),
      ...(seedOut.type === 'choice' ? { options: seedOut.options, answerIndex: seedOut.answerIndex } : {}),
      ...(seedOut.type === 'truefalse' ? { options: seedOut.options, answerIndex: seedOut.answerIndex } : {}),
      explanation: seedOut.explanation,
    });
  }
  return out;
}
