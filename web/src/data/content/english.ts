import type { Lesson, Unit } from '../types';
import {
  buildPoints,
  buildQuestions,
  choice,
  englishWord,
  match,
  order,
  truefalse,
  type LessonSeed,
} from './builders';

/**
 * 英语（预备级）二年级上册 —— 北京出版社，2024 年经北京市教材委员会审核通过的新教材。
 *
 * 全册 6 个单元、每单元 3 课时，Lesson 1-18 连续编号（与课本一致）：
 *   Unit 1 It's Time to Get Up   L1 It's Seven O'clock / L2 Please Go to Bed Early / L3 Fun Time
 *   Unit 2 Ways to Go to School  L4 How Do You Go to School? / L5 I Go to School on an Elephant Today / L6 Fun Time
 *   Unit 3 We Like Sports        L7 Sports Are Fun / L8 A Super Player / L9 Fun Time
 *   Unit 4 My Week               L10 What Day Is It Today? / L11 A Nice Week / L12 Fun Time
 *   Unit 5 My Weekend            L13 This Is My Happy Weekend / L14 Sunday Is a Big Day / L15 Fun Time
 *   Unit 6 Animals Are Fun       L16 The Animals in a Park / L17 A Fun Race / L18 Fun Time
 *
 * 预备级以视、听、说为主，每课词汇与句型来自课本板块（Let's Sing / Let's Read / Let's Do / Fun Time）。
 * 课的 order 就是课本的 Lesson 编号，界面统一显示成「第 N 课」，标题里不再重复 Lesson N。
 * 若与纸质课本有出入，一律以孩子的课本为准，改这个文件即可。
 */
export const englishUnits: Unit[] = [
  { id: 'en-u1', subject: 'english', order: 1, title: "Unit 1 · It's Time to Get Up" },
  { id: 'en-u2', subject: 'english', order: 2, title: 'Unit 2 · Ways to Go to School' },
  { id: 'en-u3', subject: 'english', order: 3, title: 'Unit 3 · We Like Sports' },
  { id: 'en-u4', subject: 'english', order: 4, title: 'Unit 4 · My Week' },
  { id: 'en-u5', subject: 'english', order: 5, title: 'Unit 5 · My Weekend' },
  { id: 'en-u6', subject: 'english', order: 6, title: 'Unit 6 · Animals Are Fun' },
];

const w = (
  lesson: string,
  index: number,
  en: string,
  zh: string,
  sentence: string,
  sentenceZh: string,
) => englishWord(`${lesson}-w${index}`, en, zh, sentence, sentenceZh);

const seeds: LessonSeed[] = [
  // ---------------------------------------------------------------- Unit 1
  {
    id: 'en-u1-l1',
    unitId: 'en-u1',
    order: 1,
    title: "It's Seven O'clock",
    preview: [
      '认识 time、o’clock、clock、seven、eight。',
      '会用 “What time is it? It’s … o’clock.” 问时间、说时间。',
    ],
    review: [
      'o’clock 跟在数字后面表示整点，seven o’clock 就是七点。',
      '问“几点了”要说 What time is it?，回答用 It’s … o’clock.',
    ],
    tip: '看一眼家里的钟，用英语说出现在是几点。',
    questions: [
      choice('“What time is it?” 是在问什么？', ['几点了', '今天星期几', '你几岁了', '现在上什么课'], 0),
      match('把英语和中文连起来。', [
        { left: "It's seven o'clock", right: '现在七点' },
        { left: 'What time is it?', right: '几点了？' },
        { left: 'get up', right: '起床' },
      ]),
      order('把句子排好：It’s time to play.', ['It’s', 'time', 'to', 'play']),
    ],
    words: [
      w('en-u1-l1', 1, 'time', '时间', 'What time is it?', '现在几点了？'),
      w('en-u1-l1', 2, "o'clock", '（整点）点钟', "It's seven o'clock.", '现在七点了。'),
      w('en-u1-l1', 3, 'clock', '时钟', 'Look at the clock.', '看一看这只钟。'),
      w('en-u1-l1', 4, 'seven', '七', 'It is seven.', '是七点。'),
      w('en-u1-l1', 5, 'eight', '八', "It's eight o'clock.", '现在八点了。'),
      w('en-u1-l1', 6, 'morning', '早上', 'Good morning, Mum!', '早上好，妈妈！'),
    ],
  },
  {
    id: 'en-u1-l2',
    unitId: 'en-u1',
    order: 2,
    title: 'Please Go to Bed Early',
    preview: [
      '认识 go to bed、go home、early、late、nine、ten。',
      '会用 “It’s time to …” 说该做什么了。',
    ],
    review: [
      '“It’s time to + 动作” 表示“该做这件事了”，如 It’s time to go home.',
      'early 是“早”，late 是“晚”，两个正好相反。',
    ],
    tip: '说一说你每天几点起床、几点睡觉，用英语说出时间。',
    questions: [
      choice('“该睡觉了”用英语怎么说？', ["It's time to go to bed.", "It's time to go home.", 'Time for bed time.', "I'm going bed."], 0),
      truefalse('“Please go to bed early.” 是叫对方早点儿睡觉。', true),
      match('把英语和中文连起来。', [
        { left: 'go home', right: '回家' },
        { left: 'early', right: '早' },
        { left: 'late', right: '晚；迟到' },
      ]),
    ],
    words: [
      w('en-u1-l2', 1, 'bed', '床；睡觉', 'Time for bed.', '该睡觉了。'),
      w('en-u1-l2', 2, 'early', '早地', 'Please go to bed early.', '请早点儿睡觉。'),
      w('en-u1-l2', 3, 'late', '晚；迟', "Don't be late for school.", '上学不要迟到。'),
      w('en-u1-l2', 4, 'home', '家', "It's time to go home.", '该回家了。'),
      w('en-u1-l2', 5, 'nine', '九', "It's nine o'clock.", '现在九点了。'),
      w('en-u1-l2', 6, 'talk', '谈论；说话', 'We talk about time.', '我们谈论时间。'),
    ],
  },
  {
    id: 'en-u1-l3',
    unitId: 'en-u1',
    order: 3,
    title: 'Fun Time · 第 1 单元复习',
    preview: [
      '复习整点说法，认识 eleven、twelve。',
      '会把时间和活动连起来说：It’s … o’clock. It’s time to …',
    ],
    review: [
      '十一是 eleven，十二是 twelve，钟面上最大就是十二。',
      '“It’s time to” 后面接动作，如 play、swim、get up.',
    ],
    tip: '和家人玩“我说时间你做大动作”的游戏：get up、go to school、go to bed.',
    questions: [
      choice('“十二点”用英语怎么说？', ['twelve o’clock', 'two o’clock', 'ten o’clock', 'twenty o’clock'], 0),
      order('把句子排好：I swim on Sunday.', ['I', 'swim', 'on', 'Sunday']),
      truefalse('“It’s time to get up.” 的意思是“该起床了”。', true),
    ],
    words: [
      w('en-u1-l3', 1, 'play', '玩', "It's time to play.", '该玩了。'),
      w('en-u1-l3', 2, 'swim', '游泳', 'I swim on Sunday.', '我星期天游泳。'),
      w('en-u1-l3', 3, 'eleven', '十一', "It's eleven o'clock.", '现在十一点了。'),
      w('en-u1-l3', 4, 'twelve', '十二', 'The clock has twelve numbers.', '钟上有十二个数字。'),
      w('en-u1-l3', 5, 'get', '起；得到', 'I get up at seven.', '我七点起床。'),
      w('en-u1-l3', 6, 'happy', '开心的', 'I am happy today.', '我今天很开心。'),
    ],
  },
  // ---------------------------------------------------------------- Unit 2
  {
    id: 'en-u2-l1',
    unitId: 'en-u2',
    order: 4,
    title: 'How Do You Go to School?',
    preview: [
      '认识 bus、car、bike、walk、by。',
      '会用 “How do you go to school? I go to school by …” 问答出行方式。',
    ],
    review: [
      '乘某种交通工具用 by + 车，如 by bus、by car、by bike.',
      '走路去不说 by walk，直接说 I walk to school.',
    ],
    tip: '想一想自己每天怎么到校，用英语说一句：I go to school by … / I walk to school.',
    questions: [
      choice('“你怎样去上学？”用英语怎么说？', ['How do you go to school?', 'What do you go to school?', 'Where do you go to school?', 'Who goes to school?'], 0),
      match('把英语和中文连起来。', [
        { left: 'by bus', right: '乘公共汽车' },
        { left: 'by bike', right: '骑自行车' },
        { left: 'walk', right: '步行' },
      ]),
      order('把句子排好：I go to school by bus.', ['I', 'go', 'to', 'school', 'by', 'bus']),
    ],
    words: [
      w('en-u2-l1', 1, 'bus', '公共汽车', 'I go to school by bus.', '我乘公共汽车去上学。'),
      w('en-u2-l1', 2, 'car', '小汽车', 'I go to the park by car.', '我坐小汽车去公园。'),
      w('en-u2-l1', 3, 'bike', '自行车', 'I go to school by bike.', '我骑自行车去上学。'),
      w('en-u2-l1', 4, 'walk', '步行', 'I walk to school.', '我走路去上学。'),
      w('en-u2-l1', 5, 'school', '学校', 'This is my school.', '这是我的学校。'),
      w('en-u2-l1', 6, 'by', '乘（交通工具）', 'She goes by car.', '她坐小汽车去。'),
    ],
  },
  {
    id: 'en-u2-l2',
    unitId: 'en-u2',
    order: 5,
    title: 'I Go to School on an Elephant Today',
    preview: [
      '读懂故事里的问路和答路：How do you go to school?',
      '认识 elephant、today、on，知道“骑在大象上”用 on.',
    ],
    review: [
      '故事里大家上学方式不同：by bike、by bus、on an elephant.',
      'today 是“今天”，放在句子后面说今天做的事。',
    ],
    tip: '分角色读故事：一个人问 How do you go to school?，另一个人回答。',
    questions: [
      choice('故事里“今天骑大象去上学”为什么说 on an elephant？', ['因为人是骑在动物身上', '因为大象很快', '因为今天下雨', '因为 by 不能用'], 0),
      truefalse('“I go to school by bike.” 是骑自行车去上学。', true),
      order('把句子排好：I am not late today.', ['I', 'am', 'not', 'late', 'today']),
    ],
    words: [
      w('en-u2-l2', 1, 'elephant', '大象', 'I go to school on an elephant.', '我骑大象去上学。'),
      w('en-u2-l2', 2, 'today', '今天', 'I go to school on an elephant today.', '今天我骑大象去上学。'),
      w('en-u2-l2', 3, 'on', '在……上；骑', 'I sit on the bus.', '我坐在公交车上。'),
      w('en-u2-l2', 4, 'good', '好的', 'Good morning, Miss Ma.', '早上好，马老师。'),
      w('en-u2-l2', 5, 'late', '迟到', 'I am not late today.', '我今天没有迟到。'),
      w('en-u2-l2', 6, 'say', '说', 'I say good morning.', '我说早上好。'),
    ],
  },
  {
    id: 'en-u2-l3',
    unitId: 'en-u2',
    order: 6,
    title: 'Fun Time · 第 2 单元复习',
    preview: [
      '复习出行方式，认识地点词 park、zoo。',
      '感知字母组合 ou、ow 发 /aʊ/ 的音：house、mouse、town。',
    ],
    review: [
      '去某地怎么说：How do you go to Beihai Park? I go to Beihai Park by car.',
      'house、mouse 里的 ou 和 town 里的 ow 读音一样。',
    ],
    tip: '找一找：还有哪些单词里有 ou 或 ow，读音和 house 一样？',
    questions: [
      choice('“你去北海公园怎么走？”用英语怎么说？', ['How do you go to Beihai Park?', 'Where is Beihai Park?', 'Do you like Beihai Park?', 'What do you do in the park?'], 0),
      match('把英语和中文连起来。', [
        { left: 'park', right: '公园' },
        { left: 'zoo', right: '动物园' },
        { left: 'house', right: '房子' },
      ]),
      truefalse('walk to school 和 go to school on foot 意思一样。', true),
    ],
    words: [
      w('en-u2-l3', 1, 'park', '公园', 'How do you go to the park?', '你怎样去公园？'),
      w('en-u2-l3', 2, 'zoo', '动物园', 'I go to the zoo by bus.', '我乘公共汽车去动物园。'),
      w('en-u2-l3', 3, 'town', '城镇', 'I live in a small town.', '我住在一个小镇上。'),
      w('en-u2-l3', 4, 'house', '房子', 'The house is big.', '这所房子很大。'),
      w('en-u2-l3', 5, 'mouse', '老鼠', 'A mouse is in the house.', '一只老鼠在房子里。'),
      w('en-u2-l3', 6, 'how', '怎样', 'How do you go to school?', '你怎样去上学？'),
    ],
  },
  // ---------------------------------------------------------------- Unit 3
  {
    id: 'en-u3-l1',
    unitId: 'en-u3',
    order: 7,
    title: 'Sports Are Fun',
    preview: [
      '认识 sport、football、basketball、ping-pong、run。',
      '会用 “What sport do you like best? I like … best.” 说最喜欢的运动。',
    ],
    review: [
      'like … best 是“最喜欢……”，I like basketball best. 我最喜欢篮球。',
      '打球用 play：play football、play basketball、play ping-pong.',
    ],
    tip: '告诉家人你最喜欢哪项运动：I like … best.',
    questions: [
      choice('“你最喜欢什么运动？”用英语怎么说？', ['What sport do you like best?', 'What do you like?', 'Do you like sport?', 'What sport can you do?'], 0),
      match('把英语和中文连起来。', [
        { left: 'football', right: '足球' },
        { left: 'basketball', right: '篮球' },
        { left: 'ping-pong', right: '乒乓球' },
      ]),
      order('把句子排好：I like basketball best.', ['I', 'like', 'basketball', 'best']),
    ],
    words: [
      w('en-u3-l1', 1, 'sport', '运动', 'I like sport.', '我喜欢运动。'),
      w('en-u3-l1', 2, 'like', '喜欢', 'I like football.', '我喜欢足球。'),
      w('en-u3-l1', 3, 'football', '足球', 'I play football after school.', '我放学后踢足球。'),
      w('en-u3-l1', 4, 'basketball', '篮球', 'She plays basketball well.', '她篮球打得好。'),
      w('en-u3-l1', 5, 'ping-pong', '乒乓球', 'We play ping-pong.', '我们打乒乓球。'),
      w('en-u3-l1', 6, 'fun', '有趣的', 'Sports are fun.', '运动很有趣。'),
    ],
  },
  {
    id: 'en-u3-l2',
    unitId: 'en-u3',
    order: 8,
    title: 'A Super Player',
    preview: [
      '认识 player、jump、high、fast、together。',
      '会用 “I can …” 说自己会做什么，用 “You are a good player.” 夸同学。',
    ],
    review: [
      'can 后面用动作原形：I can jump high. 我能跳得高。',
      'run fast 是跑得快，jump high 是跳得高。',
    ],
    tip: '每人说一句自己会做的运动，再说一句不会做的：I can … / I can’t …',
    questions: [
      choice('“你能跳得高”用英语怎么说？', ['You can jump high.', 'You can run fast.', 'You are tall.', 'You jump low.'], 0),
      truefalse('“Let’s play together.” 是一起去玩的邀请。', true),
      match('把英语和中文连起来。', [
        { left: 'player', right: '运动员' },
        { left: 'fast', right: '快' },
        { left: 'catch', right: '接住' },
      ]),
    ],
    words: [
      w('en-u3-l2', 1, 'player', '运动员', 'You are a good player.', '你是名不错的运动员。'),
      w('en-u3-l2', 2, 'jump', '跳', 'I can jump high.', '我能跳得高。'),
      w('en-u3-l2', 3, 'high', '高', 'The bird flies high.', '鸟飞得高。'),
      w('en-u3-l2', 4, 'fast', '快', 'I can run fast.', '我能跑得快。'),
      w('en-u3-l2', 5, 'catch', '接住', 'Catch the ball please.', '请把球接住。'),
      w('en-u3-l2', 6, 'together', '一起', "Let's play together.", '我们一起玩吧。'),
    ],
  },
  {
    id: 'en-u3-l3',
    unitId: 'en-u3',
    order: 9,
    title: 'Fun Time · 第 3 单元复习',
    preview: [
      '复习运动词，认识 rope、ball。',
      '感知字母组合 all 的发音：small、tall。',
    ],
    review: [
      'rope jumping 是跳绳，jump rope 也可以。',
      'small 是小的，tall 是高的，两个词都以 all 结尾，读音一样。',
    ],
    tip: '做“你比划我猜”：一个人做运动动作，其他人用英语猜 What sport is it?',
    questions: [
      choice('“跳绳”用英语怎么说？', ['rope jumping', 'jump ball', 'run fast', 'play ping-pong'], 0),
      match('把英语和中文连起来。', [
        { left: 'small', right: '小的' },
        { left: 'tall', right: '高的' },
        { left: 'best', right: '最' },
      ]),
      truefalse('“I like rope jumping best.” 是说我最喜欢跳绳。', true),
    ],
    words: [
      w('en-u3-l3', 1, 'rope', '绳；跳绳', 'I jump rope on Monday.', '我星期一跳绳。'),
      w('en-u3-l3', 2, 'ball', '球', 'He has a big ball.', '他有一个大球。'),
      w('en-u3-l3', 3, 'small', '小的', 'The cat is small.', '这只猫很小。'),
      w('en-u3-l3', 4, 'tall', '高的', 'My dad is very tall.', '我爸爸很高。'),
      w('en-u3-l3', 5, 'best', '最', 'I like basketball best.', '我最喜欢篮球。'),
      w('en-u3-l3', 6, 'can', '能；会', 'I can run fast.', '我能跑得快。'),
    ],
  },
  // ---------------------------------------------------------------- Unit 4
  {
    id: 'en-u4-l1',
    unitId: 'en-u4',
    order: 10,
    title: 'What Day Is It Today?',
    preview: [
      '认识 Monday、Tuesday、Wednesday、Thursday、Friday。',
      '会用 “What day is it today? It’s …” 问答今天星期几。',
    ],
    review: [
      '星期的单词第一个字母要大写：Monday、Friday.',
      '问“今天星期几”用 What day is it today?，回答 It’s + 星期。',
    ],
    tip: '看日历问答：What day is it today? It’s …，把一周五天上学的日子都说一遍。',
    questions: [
      choice('“今天星期几？”用英语怎么说？', ['What day is it today?', 'What time is it?', 'What is this?', 'How are you today?'], 0),
      match('把英语和中文连起来。', [
        { left: 'Monday', right: '星期一' },
        { left: 'Wednesday', right: '星期三' },
        { left: 'Friday', right: '星期五' },
      ]),
      order('把句子排好：We go to school on Monday.', ['We', 'go', 'to', 'school', 'on', 'Monday']),
    ],
    words: [
      w('en-u4-l1', 1, 'day', '一天；日子', 'What day is it today?', '今天星期几？'),
      w('en-u4-l1', 2, 'today', '今天', 'It is Sunday today.', '今天是星期天。'),
      w('en-u4-l1', 3, 'Monday', '星期一', 'We go to school on Monday.', '我们星期一上学。'),
      w('en-u4-l1', 4, 'Friday', '星期五', 'I play football on Friday.', '我星期五踢足球。'),
      w('en-u4-l1', 5, 'week', '一周', 'What a nice week!', '多美好的一周啊！'),
      w('en-u4-l1', 6, 'Wednesday', '星期三', 'I jump rope on Wednesday.', '我星期三跳绳。'),
    ],
  },
  {
    id: 'en-u4-l2',
    unitId: 'en-u4',
    order: 11,
    title: 'A Nice Week',
    preview: [
      '认识 dog、little、draw、build、paint。',
      '会用 “On + 星期, I + 动作” 说哪天做什么。',
    ],
    review: [
      'On Monday, I get a little dog. 星期前面用介词 on.',
      'build 是建造，paint 是粉刷，draw 是画画，都是动手的事。',
    ],
    tip: '讲一讲课文里照顾小狗的故事：哪天得到小狗，哪天建房，哪天粉刷。',
    questions: [
      choice('“On Friday, I paint the house.” 的意思是什么？', ['星期五我粉刷房子', '星期五我建房子', '星期五我画画', '星期五我遛狗'], 0),
      match('把英语和中文连起来。', [
        { left: 'draw', right: '画画' },
        { left: 'build', right: '建造' },
        { left: 'paint', right: '粉刷' },
      ]),
      truefalse('“I get a little dog.” 里 little 是说小狗很小。', true),
    ],
    words: [
      w('en-u4-l2', 1, 'dog', '狗', 'I get a little dog.', '我得到一只小狗。'),
      w('en-u4-l2', 2, 'little', '小的；幼小的', 'The dog is little.', '这只狗很小。'),
      w('en-u4-l2', 3, 'draw', '画画', 'I draw a picture.', '我画一幅画。'),
      w('en-u4-l2', 4, 'build', '建造', 'We build a house.', '我们建一座房子。'),
      w('en-u4-l2', 5, 'paint', '粉刷', 'I paint the house.', '我粉刷房子。'),
      w('en-u4-l2', 6, 'house', '房子', 'The house is for the dog.', '这房子是给小狗的。'),
    ],
  },
  {
    id: 'en-u4-l3',
    unitId: 'en-u4',
    order: 12,
    title: 'Fun Time · 第 4 单元复习',
    preview: [
      '复习星期词，认识 Saturday、Sunday、weekend。',
      '会说自己一周里的活动，做小调查。',
    ],
    review: [
      'Saturday 是星期六，Sunday 是星期天，两天合起来叫 weekend（周末）。',
      '上学的日子说 on weekdays，周末说 on the weekend.',
    ],
    tip: '做一张“我的星期”翻翻书：一面写星期，一面画那天做的事。',
    questions: [
      choice('“weekend” 说的是哪两天？', ['星期六和星期天', '星期一和星期二', '星期五和星期六', '星期天和星期一'], 0),
      order('把句子排好：I make a card for Mum.', ['I', 'make', 'a', 'card', 'for', 'Mum']),
      match('把英语和中文连起来。', [
        { left: 'Saturday', right: '星期六' },
        { left: 'Sunday', right: '星期天' },
        { left: 'weekend', right: '周末' },
      ]),
    ],
    words: [
      w('en-u4-l3', 1, 'Saturday', '星期六', 'I play on Saturday.', '我星期六玩。'),
      w('en-u4-l3', 2, 'Sunday', '星期天', 'We go to the park on Sunday.', '我们星期天去公园。'),
      w('en-u4-l3', 3, 'weekend', '周末', 'I am happy at the weekend.', '我周末很开心。'),
      w('en-u4-l3', 4, 'card', '卡片', 'I make a card for Mum.', '我给妈妈做一张卡片。'),
      w('en-u4-l3', 5, 'make', '制作', "Let's make a card.", '我们做一张卡片吧。'),
      w('en-u4-l3', 6, 'friend', '朋友', 'He is my good friend.', '他是我的好朋友。'),
    ],
  },
  // ---------------------------------------------------------------- Unit 5
  {
    id: 'en-u5-l1',
    unitId: 'en-u5',
    order: 13,
    title: 'This Is My Happy Weekend',
    preview: [
      '认识 weekend、read、clean、room、cook。',
      '会用 “What do you do on the weekend? I …” 问答周末活动。',
    ],
    review: [
      'What do you do on the weekend? 问“你周末做什么”，回答直接说做的事。',
      'read books 是读书，clean my room 是打扫房间。',
    ],
    tip: '说说你的周末：I read books on Saturday. I clean my room on Sunday.',
    questions: [
      choice('“你周末做什么？”用英语怎么说？', ['What do you do on the weekend?', 'What is the weekend?', 'Where do you go on Sunday?', 'Do you like the weekend?'], 0),
      match('把英语和中文连起来。', [
        { left: 'read books', right: '读书' },
        { left: 'clean my room', right: '打扫房间' },
        { left: 'cook noodles', right: '煮面条' },
      ]),
      order('把句子排好：I read books on Sunday.', ['I', 'read', 'books', 'on', 'Sunday']),
    ],
    words: [
      w('en-u5-l1', 1, 'weekend', '周末', 'What do you do on the weekend?', '你周末做什么？'),
      w('en-u5-l1', 2, 'read', '读', 'I read books on Sunday.', '我星期天读书。'),
      w('en-u5-l1', 3, 'clean', '打扫', 'I clean my room.', '我打扫我的房间。'),
      w('en-u5-l1', 4, 'room', '房间', 'My room is small.', '我的房间不大。'),
      w('en-u5-l1', 5, 'cook', '做饭', 'Dad cooks noodles.', '爸爸煮面条。'),
      w('en-u5-l1', 6, 'write', '写', 'I write a card.', '我写一张卡片。'),
    ],
  },
  {
    id: 'en-u5-l2',
    unitId: 'en-u5',
    order: 14,
    title: 'Sunday Is a Big Day',
    preview: [
      '认识 big、birthday、happy、sister。',
      '会说 “Today is a big day.” 和 “Happy birthday!”',
    ],
    review: [
      'a big day 不是“很大的日子”，是“重要的日子”。',
      '祝别人生日快乐说 Happy birthday!，后面不用再加别的词。',
    ],
    tip: '给家人用英语说一句生日祝福，再说说家里谁过生日最重要。',
    questions: [
      choice('“Today is a big day.” 是什么意思？', ['今天是重要的一天', '今天天气很好', '今天是星期天', '今天有很多人'], 0),
      truefalse('祝同学生日快乐，可以说 “Happy birthday!', true),
      order('把句子排好：I read books to my sister.', ['I', 'read', 'books', 'to', 'my', 'sister']),
    ],
    words: [
      w('en-u5-l2', 1, 'big', '大的', 'Today is a big day.', '今天是重要的一天。'),
      w('en-u5-l2', 2, 'birthday', '生日', 'Happy birthday to you!', '祝你生日快乐！'),
      w('en-u5-l2', 3, 'happy', '开心的', 'I am happy today.', '我今天很开心。'),
      w('en-u5-l2', 4, 'sister', '姐姐；妹妹', 'I read books to my sister.', '我给妹妹读书。'),
      w('en-u5-l2', 5, 'family', '家人', 'My family is here.', '我的家人在这儿。'),
      w('en-u5-l2', 6, 'cake', '蛋糕', 'We eat a big cake.', '我们吃一个大蛋糕。'),
    ],
  },
  {
    id: 'en-u5-l3',
    unitId: 'en-u5',
    order: 15,
    title: 'Fun Time · 第 5 单元复习',
    preview: [
      '复习周末活动，认识 shopping、picture、often。',
      '会用 “What do you do on Sunday? I …” 继续问答。',
    ],
    review: [
      'go shopping 是去买东西，draw a picture 是画画。',
      'often 是“经常”，放在动作前面：I often play ping-pong.',
    ],
    tip: '和家人互相问：What do you do on Sunday? 把三个答案记下来。',
    questions: [
      choice('“我常和爸爸去买东西”怎么说？', ['I often go shopping with Dad.', 'I go shop often.', 'I like shopping cart.', 'My dad goes home.'], 0),
      match('把英语和中文连起来。', [
        { left: 'go shopping', right: '去买东西' },
        { left: 'draw a picture', right: '画画' },
        { left: 'often', right: '经常' },
      ]),
      truefalse('jump rope 和 play ping-pong 都是周末可以做的活动。', true),
    ],
    words: [
      w('en-u5-l3', 1, 'shopping', '买东西', 'I go shopping with Mum.', '我和妈妈去买东西。'),
      w('en-u5-l3', 2, 'picture', '图画', 'I draw a picture.', '我画一幅画。'),
      w('en-u5-l3', 3, 'often', '经常', 'I often play ping-pong.', '我常打乒乓球。'),
      w('en-u5-l3', 4, 'game', '游戏；比赛', 'We play games at school.', '我们在学校做游戏。'),
      w('en-u5-l3', 5, 'with', '和……一起', 'I walk with Dad.', '我和爸爸一起走。'),
      w('en-u5-l3', 6, 'noodles', '面条', 'Mum cooks noodles.', '妈妈煮面条。'),
    ],
  },
  // ---------------------------------------------------------------- Unit 6
  {
    id: 'en-u6-l1',
    unitId: 'en-u6',
    order: 16,
    title: 'The Animals in a Park',
    preview: [
      '认识 animal、rabbit、duck、bird、cat。',
      '会用 “What animal is this? It’s …” 问答近处的动物。',
    ],
    review: [
      'this 指离自己近的动物，that 指离得远的动物。',
      '描述样子可以说 It’s a white rabbit with two long ears.',
    ],
    tip: '在公园里认动物：What animal is this? It’s a …，说出它的颜色。',
    questions: [
      choice('“这是什么动物？”用英语怎么说？', ['What animal is this?', 'What is this animal name?', 'Where is the animal?', 'Do you like animals?'], 0),
      match('把英语和中文连起来。', [
        { left: 'rabbit', right: '兔子' },
        { left: 'duck', right: '鸭子' },
        { left: 'bird', right: '鸟' },
      ]),
      order('把句子排好：I can see a bird.', ['I', 'can', 'see', 'a', 'bird']),
    ],
    words: [
      w('en-u6-l1', 1, 'animal', '动物', 'What animal is this?', '这是什么动物？'),
      w('en-u6-l1', 2, 'rabbit', '兔子', "It's a white rabbit.", '这是一只白兔子。'),
      w('en-u6-l1', 3, 'duck', '鸭子', 'The duck is yellow.', '这只鸭子是黄色的。'),
      w('en-u6-l1', 4, 'bird', '鸟', 'I can see a bird.', '我能看见一只鸟。'),
      w('en-u6-l1', 5, 'cat', '猫', 'The cat can walk fast.', '猫能走得很快。'),
      w('en-u6-l1', 6, 'dog', '狗', 'A dog is in the park.', '公园里有一只狗。'),
    ],
  },
  {
    id: 'en-u6-l2',
    unitId: 'en-u6',
    order: 17,
    title: 'A Fun Race',
    preview: [
      '认识 monkey、tiger、panda、strong、climb。',
      '会用 “It has …” 说动物身上的特点，用 “It can …” 说它会做什么。',
    ],
    review: [
      'has 说的是“有什么”：It has long arms. 它有长长的胳膊。',
      'can 说的是“会做什么”：The bird can fly. 鸟会飞。',
    ],
    tip: '讲一讲赛跑故事里每个动物的本领：It can run fast. It can climb high.',
    questions: [
      choice('“它有长长的胳膊”用英语怎么说？', ['It has long arms.', 'It is long arms.', 'It can long arms.', 'I have long arms.'], 0),
      match('把英语和中文连起来。', [
        { left: 'monkey', right: '猴子' },
        { left: 'panda', right: '熊猫' },
        { left: 'tiger', right: '老虎' },
      ]),
      truefalse('“The bird can fly.” 是说鸟会飞。', true),
    ],
    words: [
      w('en-u6-l2', 1, 'monkey', '猴子', 'The monkey has long arms.', '猴子有长长的胳膊。'),
      w('en-u6-l2', 2, 'tiger', '老虎', 'The tiger can run fast.', '老虎能跑得快。'),
      w('en-u6-l2', 3, 'panda', '熊猫', 'The panda is black and white.', '熊猫是黑白相间的。'),
      w('en-u6-l2', 4, 'elephant', '大象', 'The elephant has a long nose.', '大象有长长的鼻子。'),
      w('en-u6-l2', 5, 'strong', '强壮的', 'It has strong legs.', '它有力的腿。'),
      w('en-u6-l2', 6, 'climb', '爬', 'The monkey can climb high.', '猴子能爬得高。'),
    ],
  },
  {
    id: 'en-u6-l3',
    unitId: 'en-u6',
    order: 18,
    title: 'Fun Time · 第 6 单元复习',
    preview: [
      '复习动物和身体部位词，认识 frog、this、that。',
      '能用 It’s … / It has … / It can … 完整介绍一种动物。',
    ],
    review: [
      '歌谣里的 It’s a green frog, on a log. 是说原木上有一只绿青蛙。',
      '介绍一种动物说三句：它是什么、它有什么、它会什么。',
    ],
    tip: '玩手影游戏：一个人用手影出动物，其他人用英语猜 What animal is that?',
    questions: [
      choice('“那是什么动物？”用英语怎么说？', ['What animal is that?', 'What animal is this?', 'Who is that?', 'What do you see?'], 0),
      order('把句子排好：The frog can swim.', ['The', 'frog', 'can', 'swim']),
      match('把英语和中文连起来。', [
        { left: 'frog', right: '青蛙' },
        { left: 'long ears', right: '长耳朵' },
        { left: 'can fly', right: '会飞' },
      ]),
    ],
    words: [
      w('en-u6-l3', 1, 'this', '这；这个', 'What animal is this?', '这是什么动物？'),
      w('en-u6-l3', 2, 'that', '那；那个', 'What animal is that?', '那是什么动物？'),
      w('en-u6-l3', 3, 'frog', '青蛙', "It's a green frog.", '这是一只绿青蛙。'),
      w('en-u6-l3', 4, 'swim', '游泳', 'The fish can swim.', '鱼会游泳。'),
      w('en-u6-l3', 5, 'fly', '飞', 'The bird can fly.', '鸟会飞。'),
      w('en-u6-l3', 6, 'green', '绿色的', 'The frog is green.', '青蛙是绿色的。'),
    ],
  },
];

export const englishLessons: Lesson[] = seeds.map(seed => {
  const previewPoints = buildPoints(seed.id, 'p', seed.preview);
  const reviewPoints = buildPoints(seed.id, 'r', seed.review);
  const kpIds = [...previewPoints, ...reviewPoints].map(point => point.id);
  return {
    id: seed.id,
    subject: 'english',
    unitId: seed.unitId,
    order: seed.order,
    title: seed.title,
    preview: { points: previewPoints },
    review: { points: reviewPoints, mistakes: seed.mistakes ?? [], tip: seed.tip },
    questions: buildQuestions(seed.id, kpIds, seed.questions),
    words: seed.words,
  };
});
