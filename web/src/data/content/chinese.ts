import type { Lesson, Unit } from '../types';
import {
  buildPoints,
  buildQuestions,
  choice,
  dictationWord,
  match,
  order,
  truefalse,
  type LessonSeed,
} from './builders';

export const chineseUnits: Unit[] = [
  { id: 'cn-u1', subject: 'chinese', order: 1, title: '第一单元 · 课文' },
  { id: 'cn-u2', subject: 'chinese', order: 2, title: '第二单元 · 识字' },
  { id: 'cn-u3', subject: 'chinese', order: 3, title: '第三单元 · 课文' },
  { id: 'cn-u4', subject: 'chinese', order: 4, title: '第四单元 · 课文' },
  { id: 'cn-u5', subject: 'chinese', order: 5, title: '第五单元 · 课文' },
  { id: 'cn-u6', subject: 'chinese', order: 6, title: '第六单元 · 课文' },
  { id: 'cn-u7', subject: 'chinese', order: 7, title: '第七单元 · 课文' },
  { id: 'cn-u8', subject: 'chinese', order: 8, title: '第八单元 · 课文' },
];

const d = (lesson: string, word: string, pinyin: string) =>
  dictationWord(`cn-${lesson}-w${word}`, word, pinyin);

const seeds: LessonSeed[] = [
  {
    id: 'cn-u1-l1', unitId: 'cn-u1', order: 1, title: '小蝌蚪找妈妈',
    preview: ['小蝌蚪先长后腿，再长前腿，尾巴变短，最后变成青蛙。', '鲤鱼妈妈和乌龟都帮助过小蝌蚪。'],
    review: ['课文按“长后腿—长前腿—尾巴变短”的顺序写小蝌蚪的变化。', '青蛙妈妈四条腿、宽嘴巴，头顶上有两只大眼睛，披着绿衣裳。'],
    mistakes: ['“脑袋”的“袋”在这里读轻声。'],
    tip: '读对话时注意小蝌蚪着急、礼貌的语气。',
    questions: [
      choice('小蝌蚪先长出什么？', ['后腿', '前腿', '尾巴', '翅膀'], 0, '小蝌蚪先长出两条后腿。'),
      order('把小蝌蚪的变化排一排。', ['长出后腿', '长出前腿', '尾巴变短', '变成青蛙'], '小蝌蚪就是这样一步步变成青蛙的。'),
      truefalse('乌龟是小蝌蚪的妈妈。', false, '乌龟帮助小蝌蚪，但青蛙才是它的妈妈。'),
    ],
    dictation: [d('l1', '脑袋', 'nǎo dai'), d('l1', '眼睛', 'yǎn jing'), d('l1', '肚皮', 'dù pí'), d('l1', '孩子', 'hái zi'), d('l1', '跳水', 'tiào shuǐ')],
  },
  {
    id: 'cn-u1-l2', unitId: 'cn-u1', order: 2, title: '我是什么',
    preview: ['水会变成汽，升到天空变成云。', '云里的水落下来，可能是雨、雹子或雪。'],
    review: ['水在池子、小溪、江河、海洋里，有不同的样子。', '“落、打、飘”写出雨、雹子、雪下来的不同样子。'],
    tip: '想一想：水还会变成什么？',
    questions: [
      choice('水变成汽升到天空，会变成什么？', ['云', '雨', '雪', '风'], 0, '水汽升到天空，连成一片，就变成云。'),
      truefalse('雹子是从天上飘下来的。', false, '雹子是“打”下来的，雪才是“飘”下来的。'),
      match('把词语和它下来的样子连起来。', [
        { left: '雨', right: '落下来' }, { left: '雹子', right: '打下来' }, { left: '雪', right: '飘下来' },
      ], '三个动词写出了不同的样子。'),
    ],
    dictation: [d('l2', '变成', 'biàn chéng'), d('l2', '灾害', 'zāi hài'), d('l2', '温和', 'wēn hé'), d('l2', '暴躁', 'bào zào'), d('l2', '衣服', 'yī fu')],
  },
  {
    id: 'cn-u1-l3', unitId: 'cn-u1', order: 3, title: '植物妈妈有办法',
    preview: ['蒲公英靠风传播种子。', '苍耳靠挂住动物的皮毛传播种子。'],
    review: ['豌豆靠太阳晒，豆荚裂开，种子蹦出来。', '课文按“提出问题—举例说明—总结”的顺序写。'],
    tip: '你还知道哪些植物传播种子的办法？',
    questions: [
      choice('蒲公英的种子靠什么传播？', ['风', '水', '动物皮毛', '太阳'], 0, '蒲公英的种子像降落伞，风一吹就飞走了。'),
      truefalse('苍耳的种子会挂在动物的皮毛上。', true, '苍耳有带刺的外壳，容易挂住皮毛。'),
      order('把课文内容排一排。', ['提出问题', '蒲公英靠风', '苍耳靠皮毛', '豌豆靠太阳'], '课文先问，再举例，最后总结。'),
    ],
    dictation: [d('l3', '办法', 'bàn fǎ'), d('l3', '旅行', 'lǚ xíng'), d('l3', '娃娃', 'wá wa'), d('l3', '观察', 'guān chá'), d('l3', '知识', 'zhī shi')],
  },
  {
    id: 'cn-u2-l1', unitId: 'cn-u2', order: 4, title: '场景歌',
    preview: ['课文用数量词写海边、乡村、公园等场景。', '“一只海鸥、一片沙滩、一艘军舰、一条帆船”要搭配准确。'],
    review: ['不同的事物要用合适的数量词。', '一畦秧苗、一座果园、一方鱼塘、一片稻田。'],
    questions: [
      choice('“一（ ）军舰”应该填什么？', ['艘', '只', '片', '条'], 0, '军舰用“艘”。'),
      match('把数量词和事物连起来。', [
        { left: '一只', right: '海鸥' }, { left: '一片', right: '沙滩' }, { left: '一条', right: '帆船' },
      ]),
      truefalse('“一座果园”的搭配是正确的。', true),
    ],
    dictation: [d('u2l1', '海鸥', 'hǎi ōu'), d('u2l1', '沙滩', 'shā tān'), d('u2l1', '军舰', 'jūn jiàn'), d('u2l1', '帆船', 'fān chuán'), d('u2l1', '秧苗', 'yāng miáo')],
  },
  {
    id: 'cn-u2-l2', unitId: 'cn-u2', order: 5, title: '树之歌',
    preview: ['杨树高，榕树壮，梧桐树叶像手掌。', '枫树秋天叶儿红，松柏四季披绿装。'],
    review: ['木棉喜暖，桦树耐寒。', '银杏、水杉是活化石，金桂开花满院香。'],
    questions: [
      choice('梧桐树的叶子像什么？', ['手掌', '小船', '扇子', '针'], 0),
      truefalse('松柏到了冬天会落光叶子。', false, '松柏四季常绿。'),
      match('把树和特点连起来。', [
        { left: '杨树', right: '高' }, { left: '榕树', right: '壮' }, { left: '枫树', right: '秋天叶儿红' },
      ]),
    ],
    dictation: [d('u2l2', '杨树', 'yáng shù'), d('u2l2', '榕树', 'róng shù'), d('u2l2', '梧桐', 'wú tóng'), d('u2l2', '松柏', 'sōng bǎi'), d('u2l2', '木棉', 'mù mián')],
  },
  {
    id: 'cn-u2-l3', unitId: 'cn-u2', order: 6, title: '拍手歌',
    preview: ['课文用拍手歌的形式写动物。', '孔雀、锦鸡、雄鹰、雁群、黄鹂、百灵都有自己的家。'],
    review: ['“保护动物是大事”是课文的中心句。', '天空、丛林、竹林等都是动物的家。'],
    questions: [
      choice('课文告诉我们的道理是什么？', ['保护动物', '多拍手', '早睡早起', '爱护花草'], 0),
      truefalse('孔雀和锦鸡都是动物。', true),
      match('把动物和它的家连起来。', [
        { left: '雄鹰', right: '天空' }, { left: '老虎', right: '丛林' }, { left: '熊猫', right: '竹林' },
      ]),
    ],
    dictation: [d('u2l3', '孔雀', 'kǒng què'), d('u2l3', '锦鸡', 'jǐn jī'), d('u2l3', '雄鹰', 'xióng yīng'), d('u2l3', '丛林', 'cóng lín'), d('u2l3', '保护', 'bǎo hù')],
  },
  {
    id: 'cn-u2-l4', unitId: 'cn-u2', order: 7, title: '田家四季歌',
    preview: ['春季里，农民播种、插秧。', '夏季里，采桑、养蚕、插秧，农事很忙。'],
    review: ['秋季稻谷上场，冬季缝制棉衣。', '课文按春夏秋冬的顺序写田家生活。'],
    questions: [
      order('按季节排一排。', ['春季', '夏季', '秋季', '冬季']),
      choice('“秋季里，稻上场”写的是什么？', ['稻谷丰收', '播种', '采桑', '缝棉衣'], 0),
      truefalse('田家四季歌写的是农民一年的农事。', true),
    ],
    dictation: [d('u2l4', '春季', 'chūn jì'), d('u2l4', '采桑', 'cǎi sāng'), d('u2l4', '插秧', 'chā yāng'), d('u2l4', '稻谷', 'dào gǔ'), d('u2l4', '棉衣', 'mián yī')],
  },
  {
    id: 'cn-u3-l1', unitId: 'cn-u3', order: 8, title: '曹冲称象',
    preview: ['曹冲七岁，想出了称象的好办法。', '把大象赶上船，画下水面到船身的位置。'],
    review: ['大象下船后往船上装石头，装到画线处。', '石头有多重，大象就有多重，这叫等量替换。'],
    tip: '用“先……再……最后……”讲一讲曹冲的办法。',
    questions: [
      order('给曹冲称象的步骤排序。', ['大象上船画线', '大象下船', '往船上装石头', '称石头'], '装到同样的水位，石头的重量就是大象的重量。'),
      choice('曹冲的办法好在哪里？', ['用石头代替大象称重', '把大象砍成几块', '砍大树做秤', '请大象自己称'], 0),
      truefalse('官员们想出的办法都成功了。', false, '砍树做秤、割象都不行。'),
    ],
    dictation: [d('u3l1', '称象', 'chēng xiàng'), d('u3l1', '石头', 'shí tou'), d('u3l1', '官员', 'guān yuán'), d('u3l1', '果然', 'guǒ rán'), d('u3l1', '办法', 'bàn fǎ')],
  },
  {
    id: 'cn-u3-l2', unitId: 'cn-u3', order: 9, title: '玲玲的画',
    preview: ['玲玲的画不小心弄脏了。', '爸爸让她动脑筋，在脏的地方画点东西。'],
    review: ['玲玲画了一只小狗，画变得更好了。', '只要肯动脑筋，坏事也能变成好事。'],
    questions: [
      choice('玲玲在弄脏的地方画了什么？', ['小狗', '小猫', '小兔', '房子'], 0),
      truefalse('遇到问题只要哭就能解决。', false, '动脑筋想办法才是好办法。'),
      order('故事是怎样发展的？', ['画弄脏了', '爸爸提醒', '画上小狗', '画更好了']),
    ],
    dictation: [d('u3l2', '楼梯', 'lóu tī'), d('u3l2', '脑筋', 'nǎo jīn'), d('u3l2', '报纸', 'bào zhǐ'), d('u3l2', '及时', 'jí shí'), d('u3l2', '满意', 'mǎn yì')],
  },
  {
    id: 'cn-u3-l3', unitId: 'cn-u3', order: 10, title: '一封信',
    preview: ['露西第一次给爸爸写信，写了很多不开心的事。', '妈妈引导她写家里开心的事。'],
    review: ['第二封信写了台灯、修车、看电影等小事。', '同一件事，换个角度写，心情会不一样。'],
    questions: [
      choice('露西为什么重新写信？', ['妈妈建议写开心的事', '爸爸不喜欢她', '信纸用完了', '她想睡觉'], 0),
      truefalse('露西的第二封信写得更开心。', true),
      match('把信和内容连起来。', [
        { left: '第一封信', right: '家里冷冷清清' }, { left: '第二封信', right: '台灯亮了，电影好看' },
      ]),
    ],
    dictation: [d('u3l3', '一封信', 'yī fēng xìn'), d('u3l3', '台灯', 'tái dēng'), d('u3l3', '电影', 'diàn yǐng'), d('u3l3', '修理', 'xiū lǐ'), d('u3l3', '生活', 'shēng huó')],
  },
  {
    id: 'cn-u3-l4', unitId: 'cn-u3', order: 11, title: '妈妈睡了',
    preview: ['睡梦中的妈妈真美丽。', '妈妈好温柔，也好累。'],
    review: ['课文写了妈妈“美丽、温柔、好累”三个样子。', '“明亮的眼睛、弯弯的眉毛、红润的脸”写出妈妈的美丽。'],
    questions: [
      match('把词语和描写连起来。', [
        { left: '明亮的', right: '眼睛' }, { left: '弯弯的', right: '眉毛' }, { left: '红润的', right: '脸' },
      ]),
      truefalse('课文写出了孩子对妈妈的爱。', true),
      choice('妈妈为什么好累？', ['工作、照顾家人很辛苦', '睡得太久', '生病了', '不想说话'], 0),
    ],
    dictation: [d('u3l4', '睡觉', 'shuì jiào'), d('u3l4', '明亮', 'míng liàng'), d('u3l4', '眉毛', 'méi mao'), d('u3l4', '好累', 'hǎo lèi'), d('u3l4', '温柔', 'wēn róu')],
  },
  {
    id: 'cn-u4-l1', unitId: 'cn-u4', order: 12, title: '古诗二首',
    preview: ['《登鹳雀楼》告诉我们站得高，看得远。', '《望庐山瀑布》写了瀑布从高处落下的样子。'],
    review: ['“欲穷千里目，更上一层楼”鼓励人不断进步。', '“飞流直下三千尺，疑是银河落九天”用了夸张。'],
    questions: [
      choice('“欲穷千里目，更上一层楼”是什么意思？', ['想看得更远，就要站得更高', '楼太高爬不上去', '太阳要落山了', '黄河很长'], 0),
      match('把诗句和题目连起来。', [
        { left: '白日依山尽', right: '登鹳雀楼' }, { left: '飞流直下三千尺', right: '望庐山瀑布' },
      ]),
      truefalse('“疑是银河落九天”中的“疑”是“怀疑”的意思。', true),
    ],
    dictation: [d('u4l1', '白日', 'bái rì'), d('u4l1', '黄河', 'huáng hé'), d('u4l1', '千里', 'qiān lǐ'), d('u4l1', '瀑布', 'pù bù'), d('u4l1', '银河', 'yín hé')],
  },
  {
    id: 'cn-u4-l2', unitId: 'cn-u4', order: 13, title: '黄山奇石',
    preview: ['黄山在我国安徽省。', '课文写了仙桃石、猴子观海、仙人指路、金鸡叫天都。'],
    review: ['作者用“好像、每当、这就是”等词把石头写得很生动。', '黄山石头的特点是奇形怪状。'],
    questions: [
      choice('下面哪一块不是课文写的黄山奇石？', ['大象望月', '仙桃石', '猴子观海', '金鸡叫天都'], 0),
      truefalse('黄山在我国安徽省。', true),
      match('把奇石和样子连起来。', [
        { left: '仙桃石', right: '像大桃子' }, { left: '猴子观海', right: '蹲在山头看云海' },
      ]),
    ],
    dictation: [d('u4l2', '黄山', 'huáng shān'), d('u4l2', '奇石', 'qí shí'), d('u4l2', '仙桃', 'xiān táo'), d('u4l2', '猴子', 'hóu zi'), d('u4l2', '神奇', 'shén qí')],
  },
  {
    id: 'cn-u4-l3', unitId: 'cn-u4', order: 14, title: '日月潭',
    preview: ['日月潭在台湾。', '湖中间的光华岛把湖分成日潭和月潭。'],
    review: ['清晨日月潭隐隐约约，中午清晰，雨天像仙境。', '课文按不同时间写日月潭的景色。'],
    questions: [
      choice('日月潭在哪里？', ['台湾', '海南', '安徽', '新疆'], 0),
      match('把时间和景色连起来。', [
        { left: '清晨', right: '隐隐约约' }, { left: '中午', right: '清晰' }, { left: '雨天', right: '像仙境' },
      ]),
      truefalse('光华岛在日月潭中间。', true),
    ],
    dictation: [d('u4l3', '日月潭', 'rì yuè tán'), d('u4l3', '台湾', 'tái wān'), d('u4l3', '太阳', 'tài yáng'), d('u4l3', '月亮', 'yuè liàng'), d('u4l3', '清晰', 'qīng xī')],
  },
  {
    id: 'cn-u4-l4', unitId: 'cn-u4', order: 15, title: '葡萄沟',
    preview: ['葡萄沟在新疆吐鲁番。', '那里盛产水果，葡萄最有名。'],
    review: ['葡萄五光十色，老乡热情好客。', '课文表达了对葡萄沟的喜爱。'],
    questions: [
      choice('葡萄沟在哪里？', ['新疆', '台湾', '安徽', '北京'], 0),
      truefalse('葡萄沟的老乡热情好客。', true),
      choice('“五光十色”写出葡萄的什么？', ['颜色多、很漂亮', '味道酸', '数量少', '价格贵'], 0),
    ],
    dictation: [d('u4l4', '葡萄', 'pú tao'), d('u4l4', '新疆', 'xīn jiāng'), d('u4l4', '茂密', 'mào mì'), d('u4l4', '热情', 'rè qíng'), d('u4l4', '好客', 'hào kè')],
  },
  {
    id: 'cn-u5-l1', unitId: 'cn-u5', order: 16, title: '坐井观天',
    preview: ['青蛙坐在井里，认为天只有井口那么大。', '小鸟说天无边无际。'],
    review: ['“坐井观天”比喻目光短浅、见识少。', '课文通过青蛙和小鸟的三次对话展开。'],
    questions: [
      choice('“坐井观天”是什么意思？', ['目光短浅，见识少', '坐在井边看天', '天很小', '青蛙会飞'], 0),
      truefalse('小鸟认为天无边无际。', true),
      order('青蛙和小鸟的对话是怎样发展的？', ['青蛙问', '小鸟答', '青蛙不信', '小鸟解释'], '三次对话写出了它们不同的看法。'),
    ],
    dictation: [d('u5l1', '井沿', 'jǐng yán'), d('u5l1', '口渴', 'kǒu kě'), d('u5l1', '喝水', 'hē shuǐ'), d('u5l1', '抬头', 'tái tóu'), d('u5l1', '无边无际', 'wú biān wú jì')],
  },
  {
    id: 'cn-u5-l2', unitId: 'cn-u5', order: 17, title: '寒号鸟',
    preview: ['喜鹊勤劳，寒号鸟懒惰。', '冬天到了，寒号鸟没有窝。'],
    review: ['寒号鸟总说“得过且过”，最后冻死了。', '课文告诉我们做事要及早准备。'],
    questions: [
      choice('寒号鸟为什么冻死了？', ['它一直不做窝', '它不会飞', '它迷路了', '它没有食物'], 0),
      truefalse('喜鹊很勤劳。', true),
      match('把动物和特点连起来。', [
        { left: '喜鹊', right: '勤劳做窝' }, { left: '寒号鸟', right: '得过且过' },
      ]),
    ],
    dictation: [d('u5l2', '寒号鸟', 'hán hào niǎo'), d('u5l2', '喜鹊', 'xǐ què'), d('u5l2', '做窝', 'zuò wō'), d('u5l2', '冻死', 'dòng sǐ'), d('u5l2', '得过且过', 'dé guò qiě guò')],
  },
  {
    id: 'cn-u5-l3', unitId: 'cn-u5', order: 18, title: '我要的是葫芦',
    preview: ['种葫芦的人只要葫芦，不管叶子。', '叶子上长了蚜虫，他不听劝。'],
    review: ['蚜虫吃叶子，叶子坏了，葫芦也落了。', '事物之间是有联系的。'],
    questions: [
      choice('葫芦为什么都落了？', ['叶子被蚜虫吃坏', '水浇多了', '太阳太晒', '被人摘了'], 0),
      truefalse('种葫芦的人听了邻居的劝告。', false),
      order('事情是怎样发展的？', ['种葫芦', '叶长蚜虫', '不听劝', '葫芦落了']),
    ],
    dictation: [d('u5l3', '葫芦', 'hú lu'), d('u5l3', '蚜虫', 'yá chóng'), d('u5l3', '盯着', 'dīng zhe'), d('u5l3', '邻居', 'lín jū'), d('u5l3', '奇怪', 'qí guài')],
  },
  {
    id: 'cn-u6-l1', unitId: 'cn-u6', order: 19, title: '大禹治水',
    preview: ['洪水淹没了田地，人们生活痛苦。', '鲧用筑坝挡水，没有成功。'],
    review: ['大禹用疏导的办法治理洪水。', '大禹三过家门而不入，无私奉献。'],
    questions: [
      choice('大禹用什么办法治水？', ['疏导', '筑坝挡水', '填平河道', '求雨'], 0),
      truefalse('大禹三次经过家门都没有进去。', true),
      order('按故事顺序排一排。', ['洪水泛滥', '鲧筑坝失败', '禹疏导治水', '洪水退了'], ),
    ],
    dictation: [d('u6l1', '洪水', 'hóng shuǐ'), d('u6l1', '灾难', 'zāi nàn'), d('u6l1', '治理', 'zhì lǐ'), d('u6l1', '疏导', 'shū dǎo'), d('u6l1', '英雄', 'yīng xióng')],
  },
  {
    id: 'cn-u6-l2', unitId: 'cn-u6', order: 20, title: '朱德的扁担',
    preview: ['井冈山上粮食不多，朱德和战士们一起挑粮。', '大家把扁担藏起来，朱德又找来一根。'],
    review: ['朱德在扁担上写了“朱德的扁担”。', '课文表现了朱德以身作则、与战士同甘共苦。'],
    questions: [
      choice('大家为什么藏朱德的扁担？', ['心疼他太辛苦', '不喜欢他', '想自己用', '扁担坏了'], 0),
      truefalse('朱德用扁担和战士们一起挑粮。', true),
      match('把人物和表现连起来。', [
        { left: '朱德', right: '以身作则' }, { left: '战士们', right: '敬爱朱德' },
      ]),
    ],
    dictation: [d('u6l2', '扁担', 'biǎn dan'), d('u6l2', '井冈山', 'jǐng gāng shān'), d('u6l2', '粮食', 'liáng shi'), d('u6l2', '战士', 'zhàn shì'), d('u6l2', '敬爱', 'jìng ài')],
  },
  {
    id: 'cn-u6-l3', unitId: 'cn-u6', order: 21, title: '难忘的泼水节',
    preview: ['1961年，周总理和傣族人民一起过泼水节。', '泼水节是傣族最盛大的节日。'],
    review: ['课文写了周总理的穿着、动作和笑容。', '凤凰花开了，傣族人民欢迎周总理。'],
    questions: [
      choice('周总理和傣族人民一起过泼水节是哪一年？', ['1961年', '1949年', '1978年', '2008年'], 0),
      truefalse('泼水节是傣族的节日。', true),
      match('把事物和含义连起来。', [
        { left: '凤凰花', right: '喜庆' }, { left: '泼水', right: '祝福' },
      ]),
    ],
    dictation: [d('u6l3', '泼水节', 'pō shuǐ jié'), d('u6l3', '傣族', 'dǎi zú'), d('u6l3', '凤凰花', 'fèng huáng huā'), d('u6l3', '周总理', 'zhōu zǒng lǐ'), d('u6l3', '难忘', 'nán wàng')],
  },
  {
    id: 'cn-u7-l1', unitId: 'cn-u7', order: 22, title: '古诗二首',
    preview: ['《夜宿山寺》写山寺很高。', '《敕勒歌》写草原辽阔。'],
    review: ['“手可摘星辰”用夸张写楼高。', '“天苍苍，野茫茫，风吹草低见牛羊”写草原景象。'],
    questions: [
      choice('“危楼高百尺”中的“危”是什么意思？', ['高', '危险', '破旧', '寒冷'], 0),
      match('把诗句和题目连起来。', [
        { left: '手可摘星辰', right: '夜宿山寺' }, { left: '风吹草低见牛羊', right: '敕勒歌' },
      ]),
      truefalse('《敕勒歌》写的是草原风光。', true),
    ],
    dictation: [d('u7l1', '山寺', 'shān sì'), d('u7l1', '星辰', 'xīng chén'), d('u7l1', '草原', 'cǎo yuán'), d('u7l1', '牛羊', 'niú yáng'), d('u7l1', '苍苍', 'cāng cāng')],
  },
  {
    id: 'cn-u7-l2', unitId: 'cn-u7', order: 23, title: '雾在哪里',
    preview: ['雾把大海、天空、太阳、房屋藏起来。', '雾是个淘气的孩子。'],
    review: ['课文用“藏”写雾的变化。', '雾散了，一切又露出来。'],
    questions: [
      choice('雾把什么藏起来了？', ['大海、天空、太阳、房屋', '只藏了太阳', '只藏了房屋', '什么也没藏'], 0),
      truefalse('课文把雾当作淘气的孩子来写。', true),
      order('按课文顺序排一排。', ['雾来了', '藏起大海', '藏起太阳和房屋', '雾散了']),
    ],
    dictation: [d('u7l2', '淘气', 'táo qì'), d('u7l2', '藏起来', 'cáng qǐ lái'), d('u7l2', '房屋', 'fáng wū'), d('u7l2', '海岸', 'hǎi àn'), d('u7l2', '散步', 'sàn bù')],
  },
  {
    id: 'cn-u7-l3', unitId: 'cn-u7', order: 24, title: '雪孩子',
    preview: ['雪孩子陪小白兔玩，救了大火中的小白兔。', '雪孩子化成水，变成云。'],
    review: ['雪孩子勇敢、善良。', '课文按“堆雪人—着火—救人—化云”的顺序写。'],
    questions: [
      order('按故事顺序排一排。', ['堆雪人', '小白兔家着火', '雪孩子救人', '雪孩子化成云']),
      choice('雪孩子最后变成了什么？', ['云', '雨', '冰', '雪人'], 0),
      truefalse('雪孩子很勇敢。', true),
    ],
    dictation: [d('u7l3', '雪孩子', 'xuě hái zi'), d('u7l3', '小白兔', 'xiǎo bái tù'), d('u7l3', '着火', 'zháo huǒ'), d('u7l3', '勇敢', 'yǒng gǎn'), d('u7l3', '白云', 'bái yún')],
  },
  {
    id: 'cn-u8-l1', unitId: 'cn-u8', order: 25, title: '狐假虎威',
    preview: ['狐狸被老虎抓住，说自己是老天爷派来的。', '狐狸带老虎在百兽面前走，吓跑了大家。'],
    review: ['“狐假虎威”比喻借别人的威风吓唬人。', '狐狸神气活现，老虎半信半疑。'],
    questions: [
      choice('“狐假虎威”是什么意思？', ['借别人的威风吓唬人', '狐狸怕老虎', '老虎很威风', '狐狸很聪明'], 0),
      match('把词语和意思连起来。', [
        { left: '神气活现', right: '很得意' }, { left: '半信半疑', right: '有点信又有点疑' },
      ]),
      truefalse('百兽是被狐狸吓跑的。', false, '百兽真正怕的是老虎。'),
    ],
    dictation: [d('u8l1', '狐狸', 'hú li'), d('u8l1', '老虎', 'lǎo hǔ'), d('u8l1', '威风', 'wēi fēng'), d('u8l1', '神气', 'shén qì'), d('u8l1', '半信半疑', 'bàn xìn bàn yí')],
  },
  {
    id: 'cn-u8-l2', unitId: 'cn-u8', order: 26, title: '狐狸分奶酪',
    preview: ['两只小熊捡到奶酪，狐狸帮忙分。', '狐狸故意分得不均，把奶酪吃光了。'],
    review: ['狐狸说“这样分才公平”，其实是在骗人。', '不能轻信别人的花言巧语。'],
    questions: [
      choice('狐狸为什么把奶酪吃光了？', ['它故意分不均', '奶酪坏了', '小熊不吃', '它想帮忙'], 0),
      truefalse('狐狸分得很公平。', false),
      order('按故事顺序排一排。', ['小熊捡到奶酪', '狐狸来帮忙', '狐狸故意分不均', '奶酪被吃光']),
    ],
    dictation: [d('u8l2', '奶酪', 'nǎi lào'), d('u8l2', '狐狸', 'hú li'), d('u8l2', '公平', 'gōng píng'), d('u8l2', '生气', 'shēng qì'), d('u8l2', '帮忙', 'bāng máng')],
  },
  {
    id: 'cn-u8-l3', unitId: 'cn-u8', order: 27, title: '纸船和风筝',
    preview: ['松鼠和小熊住在山顶和山脚。', '他们用纸船和风筝成为好朋友。'],
    review: ['吵架后，他们都不好意思先开口。', '最后纸船和风筝让他们和好了。'],
    questions: [
      choice('松鼠和小熊为什么和好了？', ['纸船和风筝传递了心意', '他们搬家了', '有人来劝架', '他们忘了吵架'], 0),
      truefalse('好朋友吵架后要主动沟通。', true),
      order('按故事顺序排一排。', ['成为好朋友', '吵架', '不好意思开口', '纸船风筝和好']),
    ],
    dictation: [d('u8l3', '纸船', 'zhǐ chuán'), d('u8l3', '风筝', 'fēng zheng'), d('u8l3', '山顶', 'shān dǐng'), d('u8l3', '山脚', 'shān jiǎo'), d('u8l3', '和好', 'hé hǎo')],
  },
  {
    id: 'cn-u8-l4', unitId: 'cn-u8', order: 28, title: '风娃娃',
    preview: ['风娃娃想帮人们做好事。', '他吹动风车、帆船，帮了忙。'],
    review: ['风娃娃吹跑风筝、衣服，吹断小树，做了坏事。', '做好事要看是不是真的对别人有帮助。'],
    questions: [
      choice('风娃娃做的好事是什么？', ['吹动风车和帆船', '吹跑风筝', '吹断小树', '吹走衣服'], 0),
      match('把风和结果连起来。', [
        { left: '吹动风车', right: '好事' }, { left: '吹跑风筝', right: '坏事' },
      ]),
      truefalse('风娃娃只要使劲吹就是帮忙。', false, '帮忙要看别人需不需要。'),
    ],
    dictation: [d('u8l4', '风娃娃', 'fēng wá wa'), d('u8l4', '风车', 'fēng chē'), d('u8l4', '帆船', 'fān chuán'), d('u8l4', '帮助', 'bāng zhù'), d('u8l4', '使劲', 'shǐ jìn')],
  },
];

export const chineseLessons: Lesson[] = seeds.map((seed) => {
  const previewPoints = buildPoints(seed.id, 'p', seed.preview);
  const reviewPoints = buildPoints(seed.id, 'r', seed.review);
  const kpIds = [...previewPoints, ...reviewPoints].map((p) => p.id);
  return {
    id: seed.id,
    subject: 'chinese',
    unitId: seed.unitId,
    order: seed.order,
    title: seed.title,
    preview: { points: previewPoints },
    review: { points: reviewPoints, mistakes: seed.mistakes ?? [], tip: seed.tip },
    questions: buildQuestions(seed.id, kpIds, seed.questions),
    dictation: seed.dictation,
  };
});
