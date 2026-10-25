import type { Lesson, Unit } from '../../../types';
import {
  buildPoints,
  buildQuestions,
  choice,
  dictationWord,
  order,
  truefalse,
  type LessonSeed,
} from '../../builders';

// 统编版语文二年级下册（北京 2025+ 在用版本；内容为教辅整理，以孩子课本为准）。
// 课 id 前缀 cn2-（区别于二上 cn-）。

export const chineseUnits2S2: Unit[] = [
  { id: 'cn2-u1', subject: 'chinese', order: 1, title: '第一单元 · 春天' },
  { id: 'cn2-u2', subject: 'chinese', order: 2, title: '第二单元 · 关爱' },
  { id: 'cn2-u3', subject: 'chinese', order: 3, title: '第三单元 · 识字' },
  { id: 'cn2-u4', subject: 'chinese', order: 4, title: '第四单元 · 童心' },
  { id: 'cn2-u5', subject: 'chinese', order: 5, title: '第五单元 · 道理' },
  { id: 'cn2-u6', subject: 'chinese', order: 6, title: '第六单元 · 自然' },
  { id: 'cn2-u7', subject: 'chinese', order: 7, title: '第七单元 · 改变' },
  { id: 'cn2-u8', subject: 'chinese', order: 8, title: '第八单元 · 世界之初' },
];

const d = (lesson: string, word: string, pinyin: string) =>
  dictationWord(`cn2-${lesson}-w${word}`, word, pinyin);

const seeds: LessonSeed[] = [
  {
    id: 'cn2-u1-l1', unitId: 'cn2-u1', order: 1, title: '古诗二首',
    preview: ['《村居》写春天孩子放纸鸢。', '《咏柳》把柳树比作碧玉。'],
    review: ['“忙趁东风放纸鸢”写的是放风筝。', '“不知细叶谁裁出，二月春风似剪刀”。'],
    questions: [
      choice('“忙趁东风放纸鸢”中“纸鸢”指什么？', ['风筝', '纸船', '小鸟', '飞机'], 0, '纸鸢就是风筝。'),
      truefalse('《咏柳》是把柳树比作碧玉装扮的美人。', true, '诗中“碧玉妆成一树高”。'),
    ],
    dictation: [d('l1', '古诗', 'gǔ shī'), d('l1', '村庄', 'cūn zhuāng'), d('l1', '儿童', 'ér tóng'), d('l1', '纸鸢', 'zhǐ yuān'), d('l1', '碧玉', 'bì yù')],
  },
  {
    id: 'cn2-u1-l2', unitId: 'cn2-u1', order: 2, title: '找春天',
    preview: ['春天像个害羞的小姑娘。', '我们在田野、山坡上找春天。'],
    review: ['小草是春天的眉毛。', '野花是春天的眼睛。'],
    questions: [
      choice('课文中“春天的琴声”指的是什么？', ['解冻的小溪', '嫩绿的柳条', '桃花', '风筝'], 0, '解冻的小溪叮叮咚咚，是春天的琴声。'),
      order('把找春天的顺序排一排。', ['小草', '野花', '嫩芽', '小溪'], '课文从眉毛、眼睛、音符到琴声。'),
    ],
    dictation: [d('l2', '姑娘', 'gū niáng'), d('l2', '害羞', 'hài xiū'), d('l2', '遮掩', 'zhē yǎn'), d('l2', '嫩芽', 'nèn yá'), d('l2', '接触', 'jiē chù')],
  },
  {
    id: 'cn2-u1-l3', unitId: 'cn2-u1', order: 3, title: '开满鲜花的小路',
    preview: ['鼹鼠先生收到一个包裹。', '花籽漏在路上，开出鲜花。'],
    review: ['刺猬太太家门口开满了鲜花。', '美好的礼物给大家带来快乐。'],
    questions: [
      choice('小路上的鲜花是怎么来的？', ['包裹漏了花籽', '大家种的', '风吹来的', '魔法变的'], 0, '鼹鼠先生的包裹破了，花籽漏了一路。'),
      truefalse('鼹鼠先生知道包裹里是花籽。', false, '他开始并不知道，漏了一路才发现。'),
    ],
  },
  {
    id: 'cn2-u1-l4', unitId: 'cn2-u1', order: 4, title: '邓小平爷爷植树',
    preview: ['邓小平爷爷在北京植树。', '他精心地栽种树苗。'],
    review: ['“万里无云”的天气里植树。', '一棵绿油油的小柏树栽好了。'],
    questions: [
      choice('邓小平爷爷种下的是什么树？', ['柏树', '柳树', '杨树', '松树'], 0, '课文里是一棵绿油油的小柏树。'),
      truefalse('邓爷爷植树很精心。', true, '他挖坑、挑选树苗、小心移入。'),
    ],
    dictation: [d('l4', '植树', 'zhí shù'), d('l4', '格外', 'gé wài'), d('l4', '精心', 'jīng xīn'), d('l4', '万里无云', 'wàn lǐ wú yún')],
  },
  {
    id: 'cn2-u2-l1', unitId: 'cn2-u2', order: 5, title: '雷锋叔叔，你在哪里',
    preview: ['沿着长长的小溪寻找雷锋。', '雷锋把爱洒满了旅途。'],
    review: ['雷锋抱着迷路的孩子走过小溪。', '哪里需要献出爱心，雷锋叔叔就出现在哪里。'],
    questions: [
      choice('课文里雷锋抱着谁走过小溪？', ['迷路的孩子', '受伤的战士', '年迈的大娘', '小同学'], 0, '他抱着迷路的孩子，冒着蒙蒙细雨。'),
      order('排一排雷锋做的好事。', ['抱孩子过小溪', '背大娘赶路', '把爱洒满旅途'], '课文两节写了两件事。'),
    ],
    dictation: [d('l5', '叔叔', 'shū shu'), d('l5', '足迹', 'zú jì'), d('l5', '温暖', 'wēn nuǎn'), d('l5', '爱心', 'ài xīn')],
  },
  {
    id: 'cn2-u2-l2', unitId: 'cn2-u2', order: 6, title: '千人糕',
    preview: ['千人糕是很多很多人一起做出来的糕。', '米是农民种的，糖是工人做的。'],
    review: ['一块平平常常的糕要经过很多劳动。', '要珍惜别人的劳动成果。'],
    questions: [
      choice('“千人糕”名字的意思是什么？', ['很多很多人做成的糕', '一千个人吃', '很贵的糕', '一米大的糕'], 0, '它要经过很多很多人的劳动。'),
      truefalse('米糕只需要农民种稻子就够了。', false, '还要磨粉、制糖、包装、运送等很多劳动。'),
    ],
    dictation: [d('l6', '劳动', 'láo dòng'), d('l6', '味道', 'wèi dào'), d('l6', '甜菜', 'tián cài'), d('l6', '应该', 'yīng gāi')],
  },
  {
    id: 'cn2-u3-l1', unitId: 'cn2-u3', order: 7, title: '神州谣',
    preview: ['黄河、长江、长城、珠峰。', '各民族，齐奋发。'],
    review: ['“奔”的是黄河，“涌”的是长江。', '台湾与大陆是一家。'],
    questions: [
      choice('与台湾隔海相望的是什么？', ['大陆', '珠峰', '黄河', '长城'], 0, '课文说“台湾岛，隔海峡，与大陆，是一家”。'),
      truefalse('珠峰是世界最高峰。', true, '“珠峰耸”写它高耸入云。'),
    ],
  },
  {
    id: 'cn2-u4-l1', unitId: 'cn2-u4', order: 8, title: '彩色的梦',
    preview: ['彩色铅笔画出了彩色的梦。', '脚尖滑过的地方有大块草坪。'],
    review: ['大朵野花、大片天空。', '再画一个结冰的池塘。'],
    questions: [
      choice('“彩色的梦”是用什么画出来的？', ['彩色铅笔', '水彩笔', '蜡笔', '毛笔'], 0, '课文说“我有一大把彩色的梦”。'),
      truefalse('梦里画了结冰的池塘。', true, '“要画一个结冰的池塘”。'),
    ],
  },
  {
    id: 'cn2-u5-l1', unitId: 'cn2-u5', order: 9, title: '寓言二则',
    preview: ['《亡羊补牢》《揠苗助长》。', '两个故事都讲道理。'],
    review: ['亡羊补牢——出了问题及时补救不算晚。', '揠苗助长——急于求成反而坏事。'],
    questions: [
      choice('《揠苗助长》里农夫是怎么让禾苗长高的？', ['把禾苗往上拔', '多浇水', '施肥', '除虫'], 0, '他把禾苗一棵一棵往上拔，苗都枯死了。'),
      choice('《亡羊补牢》告诉我们什么？', ['出错后及时补救还不晚', '羊丢了就算了', '不要修羊圈', '多养几只羊'], 0, '修好羊圈，羊就再也没丢过。'),
    ],
    dictation: [d('l9', '寓言', 'yù yán'), d('l9', '亡羊补牢', 'wáng yáng bǔ láo'), d('l9', '筋疲力尽', 'jīn pí lì jìn')],
  },
  {
    id: 'cn2-u5-l2', unitId: 'cn2-u5', order: 10, title: '画杨桃',
    preview: ['从不同角度看杨桃样子不同。', '画杨桃要如实画。'],
    review: ['“我”把杨桃画成了五角星。', '老师让大家坐在“我”的位置看。'],
    questions: [
      truefalse('从“我”的座位看，杨桃像五角星。', true, '角度不同，样子就不同。'),
      choice('老师的话告诉我们什么道理？', ['实事求是，从实际出发', '要听同学的话', '杨桃很好吃', '画画要快'], 0, '“看见的杨桃根本不像平时那样”。'),
    ],
  },
  {
    id: 'cn2-u6-l1', unitId: 'cn2-u6', order: 11, title: '雷雨',
    preview: ['雷雨前乌云压下来。', '雷雨后空气清新。'],
    review: ['满天的乌云，黑沉沉地压下来。', '一条彩虹挂在天空。'],
    questions: [
      order('把雷雨的过程排一排。', ['乌云压下来', '闪电越来越亮', '雷声越来越响', '雨过天晴'], '课文按雷雨前—雷雨中—雷雨后写。'),
      truefalse('雷雨后出现了一条彩虹。', true, '“一条彩虹挂在天空”。'),
    ],
    dictation: [d('l11', '乌云', 'wū yún'), d('l11', '闪电', 'shǎn diàn'), d('l11', '窗户', 'chuāng hu'), d('l11', '清新', 'qīng xīn')],
  },
  {
    id: 'cn2-u6-l2', unitId: 'cn2-u6', order: 12, title: '要是你在野外迷了路',
    preview: ['大自然有很多天然的指南针。', '太阳、北极星、树枝、积雪都会指方向。'],
    review: ['中午太阳在南边。', '北极星永远挂在北方。'],
    questions: [
      choice('夜里迷路可以看什么辨别方向？', ['北极星', '太阳', '月亮', '云'], 0, '北极星是盏指路灯，永远挂在北方。'),
      choice('沟渠里积雪化得快的一边是哪面？', ['北面', '南面', '东面', '西面'], 0, '南边太阳照得多，雪化得快。'),
    ],
  },
  {
    id: 'cn2-u7-l1', unitId: 'cn2-u7', order: 13, title: '大象的耳朵',
    preview: ['大象耳朵像扇子耷拉着。', '小动物都说他耳朵有毛病。'],
    review: ['大象用竹竿撑起耳朵，虫子飞进去。', '还是让耳朵耷拉着吧。'],
    questions: [
      truefalse('大象把耳朵撑起来后更舒服了。', false, '虫子飞进耳朵里，他头疼得厉害。'),
      choice('这个故事告诉我们什么？', ['别人说的不一定对，要自己想', '耳朵要竖起来', '大象怕虫子', '扇子像耳朵'], 0, '“人家是人家，我是我”。'),
    ],
  },
  {
    id: 'cn2-u7-l2', unitId: 'cn2-u7', order: 14, title: '蜘蛛开店',
    preview: ['蜘蛛寂寞无聊，决定开店。', '卖口罩碰到河马，卖围巾碰到长颈鹿。'],
    review: ['卖袜子碰到蜈蚣，四十二只脚。', '蜘蛛吓得匆忙跑回网上。'],
    questions: [
      order('排一排蜘蛛开店遇到的顾客。', ['河马买口罩', '长颈鹿买围巾', '蜈蚣买袜子'], '顾客一个比一个难对付。'),
      choice('蜘蛛最后为什么跑回网上？', ['蜈蚣有四十二只脚', '袜子卖光了', '天黑了', '下雨了'], 0, '织袜子太难了。'),
    ],
  },
  {
    id: 'cn2-u8-l1', unitId: 'cn2-u8', order: 15, title: '祖先的摇篮',
    preview: ['原始森林是祖先的摇篮。', '祖先在树上摘野果、掏鹊蛋。'],
    review: ['孩子们在摇篮里捉蜻蜓、逮蝈蝈。', '那是苍茫的原始森林。'],
    questions: [
      choice('“祖先的摇篮”指的是什么？', ['原始森林', '大海', '草原', '高山'], 0, '“那原始森林，是我们祖先的摇篮”。'),
      truefalse('祖先在摇篮里摘野果、掏鹊蛋。', true, '课文就是这样想象的。'),
    ],
  },
  {
    id: 'cn2-u8-l2', unitId: 'cn2-u8', order: 16, title: '当世界年纪还小的时候',
    preview: ['世界年纪还小的时候，万物都在学习。', '太阳学发光，月亮学变化。'],
    review: ['太阳开始学发光。', '水一直往低处流，学会了流动。'],
    questions: [
      choice('月亮学会的是什么？', ['不断变化', '发光', '流动', '走路'], 0, '月亮学会不断变化。'),
      truefalse('水学会了往低处流。', true, '“它一直往低处流”。'),
    ],
  },
  {
    id: 'cn2-u8-l3', unitId: 'cn2-u8', order: 17, title: '羿射九日',
    preview: ['十个太阳炙烤大地。', '羿射下九个太阳，留下一个。'],
    review: ['人类的日子非常艰难。', '羿翻过九十九座高山，射下九个太阳。'],
    questions: [
      choice('羿为什么要射太阳？', ['十个太阳晒得大地着火', '太阳太亮', '好玩', '天上没地方'], 0, '十个太阳炙烤着大地，庄稼枯萎。'),
      order('排一排羿射日的过程。', ['翻过高山', '蹚过大河', '拉开神弓', '射下九个太阳'], '课文按顺序写了射日经过。'),
    ],
  },
];

export const chineseLessons2S2: Lesson[] = seeds.map((seed) => ({
  id: seed.id,
  subject: 'chinese' as const,
  unitId: seed.unitId,
  order: seed.order,
  title: seed.title,
  preview: { points: buildPoints(seed.id, 'p', seed.preview) },
  review: { points: buildPoints(seed.id, 'r', seed.review), mistakes: seed.mistakes ?? [], tip: seed.tip },
  questions: buildQuestions(seed.id, buildPoints(seed.id, 'p', seed.preview).map((p) => p.id).concat(buildPoints(seed.id, 'r', seed.review).map((p) => p.id)), seed.questions),
  dictation: seed.dictation,
}));

// buildPoints 每次调用生成新数组，上面 concat 用完即弃；词表锚定用 seed.id 保证稳定。
void chineseUnits2S2;
