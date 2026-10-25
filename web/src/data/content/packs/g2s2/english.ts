import type { Lesson, Unit } from '../../../types';
import { buildPoints, buildQuestions, choice, englishWord, match, order, type LessonSeed } from '../../builders';

// 北京出版社《英语》二年级下册（结构示意包：单元/课结构与词表按常规主题整理，
// **以孩子课本为准**；句子排序等复杂题型 P2 接入）。课 id 前缀 e2s-。

export const englishUnits2S2: Unit[] = [
  { id: 'e2s-u1', subject: 'english', order: 1, title: 'Unit 1 · Seasons 季节' },
  { id: 'e2s-u2', subject: 'english', order: 2, title: 'Unit 2 · Animals 动物' },
  { id: 'e2s-u3', subject: 'english', order: 3, title: 'Unit 3 · Toys 玩具' },
  { id: 'e2s-u4', subject: 'english', order: 4, title: 'Unit 4 · Food 食物' },
  { id: 'e2s-u5', subject: 'english', order: 5, title: 'Unit 5 · Actions 动作' },
];

const w = (lesson: string, id: string, en: string, zh: string, sentence: string, sentenceZh: string) =>
  englishWord(`e2s-${lesson}-${id}`, en, zh, sentence, sentenceZh);

const seeds: LessonSeed[] = [
  {
    id: 'e2s-u1-l1', unitId: 'e2s-u1', order: 1, title: 'Lesson 1 · Spring',
    preview: ['spring 春天，warm 温暖。', 'In spring, we fly kites.'],
    review: ['warm / hot / cool / cold 四季感受。', 'fly kites 放风筝。'],
    questions: [
      choice('“春天”用英语怎么说？', ['spring', 'summer', 'autumn', 'winter'], 0, 'spring 是春天。'),
    ],
    words: [
      w('l1', 'w1', 'spring', '春天', 'In spring, we fly kites.', '春天我们放风筝。'),
      w('l1', 'w2', 'warm', '温暖的', 'It is warm in spring.', '春天很温暖。'),
      w('l1', 'w3', 'flower', '花', 'The flowers are beautiful.', '花很漂亮。'),
      w('l1', 'w4', 'green', '绿色的', 'The grass is green.', '草是绿色的。'),
      w('l1', 'w5', 'tree', '树', 'The trees are tall.', '树很高。'),
    ],
  },
  {
    id: 'e2s-u1-l2', unitId: 'e2s-u1', order: 2, title: 'Lesson 2 · Summer',
    preview: ['summer 夏天，hot 炎热。', 'In summer, we swim.'],
    review: ['swim 游泳。', 'I like summer. 我喜欢夏天。'],
    questions: [
      choice('“炎热的”是哪个词？', ['hot', 'cold', 'warm', 'cool'], 0, 'hot 表示炎热。'),
    ],
    words: [
      w('l2', 'w1', 'summer', '夏天', 'In summer, we swim.', '夏天我们游泳。'),
      w('l2', 'w2', 'hot', '炎热的', 'It is hot in summer.', '夏天很热。'),
      w('l2', 'w3', 'swim', '游泳', 'Can you swim?', '你会游泳吗？'),
      w('l2', 'w4', 'sun', '太阳', 'The sun is bright.', '太阳很明亮。'),
      w('l2', 'w5', 'ice cream', '冰淇淋', 'I like ice cream.', '我喜欢冰淇淋。'),
    ],
  },
  {
    id: 'e2s-u2-l1', unitId: 'e2s-u2', order: 3, title: 'Lesson 3 · At the zoo',
    preview: ['tiger 老虎，elephant 大象。', 'The tiger is strong.'],
    review: ['long / short 形容身体部位。', 'The elephant has a long nose.'],
    questions: [
      match('把动物和英文连起来。', [
        { left: '老虎', right: 'tiger' },
        { left: '大象', right: 'elephant' },
        { left: '猴子', right: 'monkey' },
      ], 'zoo 里常见的动物。'),
    ],
    words: [
      w('l3', 'w1', 'tiger', '老虎', 'The tiger is strong.', '老虎很强壮。'),
      w('l3', 'w2', 'elephant', '大象', 'The elephant has a long nose.', '大象鼻子很长。'),
      w('l3', 'w3', 'monkey', '猴子', 'The monkey is funny.', '猴子很有趣。'),
      w('l3', 'w4', 'panda', '熊猫', 'The panda is black and white.', '熊猫黑白相间。'),
      w('l3', 'w5', 'zoo', '动物园', 'We go to the zoo.', '我们去动物园。'),
    ],
  },
  {
    id: 'e2s-u3-l1', unitId: 'e2s-u3', order: 4, title: 'Lesson 4 · My toys',
    preview: ['toy 玩具，ball 球。', 'I have a new toy.'],
    review: ['doll 娃娃，kite 风筝。', 'Play with me! 和我一起玩！'],
    questions: [
      choice('“风筝”用英语怎么说？', ['kite', 'bike', 'ball', 'doll'], 0, 'kite 是风筝。'),
    ],
    words: [
      w('l4', 'w1', 'toy', '玩具', 'This is my toy.', '这是我的玩具。'),
      w('l4', 'w2', 'ball', '球', 'I have a ball.', '我有一个球。'),
      w('l4', 'w3', 'doll', '娃娃', 'The doll is cute.', '娃娃很可爱。'),
      w('l4', 'w4', 'kite', '风筝', 'Fly the kite high.', '把风筝放得高高的。'),
      w('l4', 'w5', 'car', '小汽车', 'The car is fast.', '小汽车很快。'),
    ],
  },
  {
    id: 'e2s-u4-l1', unitId: 'e2s-u4', order: 5, title: 'Lesson 5 · Food and drinks',
    preview: ['rice 米饭，noodles 面条。', 'I like noodles.'],
    review: ['hungry 饿，thirsty 渴。', 'I am hungry. 我饿了。'],
    questions: [
      order('把句子排一排。', ['I', 'like', 'noodles'], 'I like noodles. 我喜欢面条。'),
      choice('“我饿了”怎么说？', ['I am hungry.', 'I am thirsty.', 'I am happy.', 'I am sad.'], 0, 'hungry 表示饿。'),
    ],
    words: [
      w('l5', 'w1', 'rice', '米饭', 'I eat rice.', '我吃米饭。'),
      w('l5', 'w2', 'noodles', '面条', 'I like noodles.', '我喜欢面条。'),
      w('l5', 'w3', 'hungry', '饥饿的', 'I am hungry.', '我饿了。'),
      w('l5', 'w4', 'water', '水', 'Drink some water.', '喝点水。'),
      w('l5', 'w5', 'milk', '牛奶', 'Milk is good for you.', '牛奶对你有好处。'),
    ],
  },
  {
    id: 'e2s-u5-l1', unitId: 'e2s-u5', order: 6, title: 'Lesson 6 · I can…',
    preview: ['can 表示“会、能”。', 'I can run. 我会跑。'],
    review: ['run / jump / sing / dance。', 'Can you dance? 你会跳舞吗？'],
    questions: [
      choice('“我会唱歌”怎么说？', ['I can sing.', 'I can run.', 'I can swim.', 'I can jump.'], 0, 'sing 是唱歌。'),
    ],
    words: [
      w('l6', 'w1', 'run', '跑', 'I can run fast.', '我能跑得快。'),
      w('l6', 'w2', 'jump', '跳', 'I can jump high.', '我能跳得高。'),
      w('l6', 'w3', 'sing', '唱歌', 'I can sing.', '我会唱歌。'),
      w('l6', 'w4', 'dance', '跳舞', 'She can dance.', '她会跳舞。'),
      w('l6', 'w5', 'draw', '画画', 'I can draw a cat.', '我能画一只猫。'),
    ],
  },
];

export const englishLessons2S2: Lesson[] = seeds.map((seed) => ({
  id: seed.id,
  subject: 'english' as const,
  unitId: seed.unitId,
  order: seed.order,
  title: seed.title,
  preview: { points: buildPoints(seed.id, 'p', seed.preview) },
  review: { points: buildPoints(seed.id, 'r', seed.review), mistakes: seed.mistakes ?? [], tip: seed.tip },
  questions: buildQuestions(seed.id, [...buildPoints(seed.id, 'p', seed.preview), ...buildPoints(seed.id, 'r', seed.review)].map((p) => p.id), seed.questions),
  words: seed.words,
}));
