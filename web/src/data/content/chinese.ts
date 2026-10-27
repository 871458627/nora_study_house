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
  { id: 'cn-u1', subject: 'chinese', order: 1, title: '第一单元 · 阅读' },
  { id: 'cn-u2', subject: 'chinese', order: 2, title: '第二单元 · 识字' },
  { id: 'cn-u3', subject: 'chinese', order: 3, title: '第三单元 · 阅读' },
  { id: 'cn-u4', subject: 'chinese', order: 4, title: '第四单元 · 阅读' },
  { id: 'cn-u5', subject: 'chinese', order: 5, title: '第五单元 · 阅读' },
  { id: 'cn-u6', subject: 'chinese', order: 6, title: '第六单元 · 阅读' },
  { id: 'cn-u7', subject: 'chinese', order: 7, title: '第七单元 · 阅读' },
  { id: 'cn-u8', subject: 'chinese', order: 8, title: '第八单元 · 阅读' },
];

const d = (lesson: string, word: string, pinyin: string) =>
  dictationWord(`cn-${lesson}-w${word}`, word, pinyin);

const seeds: LessonSeed[] = [
  {
    id: 'cn-u1-l1', unitId: 'cn-u1', order: 1, category: 'text', textbookNo: 1, title: '小蝌蚪找妈妈',
    preview: ['小蝌蚪先长后腿，再长前腿，尾巴变短，最后变成青蛙。', '鲤鱼妈妈和乌龟都帮助过小蝌蚪。'],
    review: ['课文按“长后腿—长前腿—尾巴变短”的顺序写小蝌蚪的变化。', '青蛙妈妈四条腿、宽嘴巴，头顶上有两只大眼睛，披着绿衣裳。'],
    mistakes: ['“脑袋”的“袋”在这里读轻声。'],
    tip: '读对话时注意小蝌蚪着急、礼貌的语气。',
    questions: [
      choice('小蝌蚪先长出什么？', ['后腿', '前腿', '尾巴', '翅膀'], 0, '小蝌蚪先长出两条后腿。'),
      order('把小蝌蚪的变化排一排。', ['长出后腿', '长出前腿', '尾巴变短', '变成青蛙'], '小蝌蚪就是这样一步步变成青蛙的。'),
      truefalse('乌龟是小蝌蚪的妈妈。', false, '乌龟帮助小蝌蚪，但青蛙才是它的妈妈。'),
    ],
    dictation: [d('l1', '头顶', 'tóu dǐng'), d('l1', '眼睛', 'yǎn jing'), d('l1', '雪白', 'xuě bái'), d('l1', '肚皮', 'dù pí'), d('l1', '孩子', 'hái zi')],
  },
  {
    id: 'cn-u1-l2', unitId: 'cn-u1', order: 2, category: 'text', textbookNo: 2, title: '我是什么',
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
    dictation: [d('l2', '天空', 'tiān kōng'), d('l2', '傍晚', 'bàng wǎn'), d('l2', '海洋', 'hǎi yáng'), d('l2', '田地', 'tián dì'), d('l2', '工作', 'gōng zuò')],
  },
  {
    id: 'cn-u1-l3', unitId: 'cn-u1', order: 3, category: 'text', textbookNo: 3, title: '植物妈妈有办法',
    preview: ['蒲公英靠风传播种子。', '苍耳靠挂住动物的皮毛传播种子。'],
    review: ['豌豆靠太阳晒，豆荚裂开，种子蹦出来。', '课文按“提出问题—举例说明—总结”的顺序写。'],
    tip: '你还知道哪些植物传播种子的办法？',
    questions: [
      choice('蒲公英的种子靠什么传播？', ['风', '水', '动物皮毛', '太阳'], 0, '蒲公英的种子像降落伞，风一吹就飞走了。'),
      truefalse('苍耳的种子会挂在动物的皮毛上。', true, '苍耳有带刺的外壳，容易挂住皮毛。'),
      order('把课文内容排一排。', ['提出问题', '蒲公英靠风', '苍耳靠皮毛', '豌豆靠太阳'], '课文先问，再举例，最后总结。'),
    ],
    dictation: [d('l3', '办法', 'bàn fǎ'), d('l3', '如果', 'rú guǒ'), d('l3', '长大', 'zhǎng dà'), d('l3', '娃娃', 'wá wa'), d('l3', '知识', 'zhī shi')],
  },
  {
    id: 'cn-u2-l1', unitId: 'cn-u2', order: 4, category: 'recognition', textbookNo: 1, title: '场景歌',
    preview: ['课文用数量词写海边、乡村、公园等场景。', '“一只海鸥、一片沙滩、一艘军舰、一条帆船”要搭配准确。'],
    review: ['不同的事物要用合适的数量词。', '一畦秧苗、一座果园、一方鱼塘、一片稻田。'],
    questions: [
      choice('“一（ ）军舰”应该填什么？', ['艘', '只', '片', '条'], 0, '军舰用“艘”。'),
      match('把数量词和事物连起来。', [
        { left: '一只', right: '海鸥' }, { left: '一片', right: '沙滩' }, { left: '一条', right: '帆船' },
      ]),
      truefalse('“一座果园”的搭配是正确的。', true),
    ],
    dictation: [d('u2l1', '花园', 'huā yuán'), d('u2l1', '石桥', 'shí qiáo'), d('u2l1', '队旗', 'duì qí'), d('u2l1', '铜号', 'tóng hào'), d('u2l1', '红领巾', 'hóng lǐng jīn')],
  },
  {
    id: 'cn-u2-l2', unitId: 'cn-u2', order: 5, category: 'recognition', textbookNo: 2, title: '树之歌',
    preview: ['杨树高，榕树壮，梧桐树叶像手掌。', '枫树秋天叶儿红，松柏四季披绿装。'],
    review: ['木棉喜暖，桦树耐寒。', '银杏、水杉是活化石，金桂开花满院香。'],
    questions: [
      choice('梧桐树的叶子像什么？', ['手掌', '小船', '扇子', '针'], 0),
      truefalse('松柏到了冬天会落光叶子。', false, '松柏四季常绿。'),
      match('把树和特点连起来。', [
        { left: '杨树', right: '高' }, { left: '榕树', right: '壮' }, { left: '枫树', right: '秋天叶儿红' },
      ]),
    ],
    dictation: [d('u2l2', '杨树', 'yáng shù'), d('u2l2', '松柏', 'sōng bǎi'), d('u2l2', '木棉', 'mù mián'), d('u2l2', '化石', 'huà shí'), d('u2l2', '金桂', 'jīn guì')],
  },
  {
    id: 'cn-u2-l3', unitId: 'cn-u2', order: 6, category: 'recognition', textbookNo: 3, title: '拍手歌',
    preview: ['课文用拍手歌的形式写动物。', '孔雀、锦鸡、雄鹰、雁群、黄鹂、百灵都有自己的家。'],
    review: ['“保护动物是大事”是课文的中心句。', '天空、丛林、竹林等都是动物的家。'],
    questions: [
      choice('课文告诉我们的道理是什么？', ['保护动物', '多拍手', '早睡早起', '爱护花草'], 0),
      truefalse('孔雀和锦鸡都是动物。', true),
      match('把动物和它的家连起来。', [
        { left: '雄鹰', right: '天空' }, { left: '老虎', right: '丛林' }, { left: '熊猫', right: '竹林' },
      ]),
    ],
    dictation: [d('u2l3', '写字', 'xiě zì'), d('u2l3', '丛林', 'cóng lín'), d('u2l3', '深处', 'shēn chù'), d('u2l3', '竹林', 'zhú lín'), d('u2l3', '熊猫', 'xióng māo')],
  },
  {
    id: 'cn-u2-l4', unitId: 'cn-u2', order: 7, category: 'recognition', textbookNo: 4, title: '田家四季歌',
    preview: ['春季里，农民播种、插秧。', '夏季里，采桑、养蚕、插秧，农事很忙。'],
    review: ['秋季稻谷上场，冬季缝制棉衣。', '课文按春夏秋冬的顺序写田家生活。'],
    questions: [
      order('按季节排一排。', ['春季', '夏季', '秋季', '冬季']),
      choice('“秋季里，稻上场”写的是什么？', ['稻谷丰收', '播种', '采桑', '缝棉衣'], 0),
      truefalse('田家四季歌写的是农民一年的农事。', true),
    ],
    dictation: [d('u2l4', '四季', 'sì jì'), d('u2l4', '农事', 'nóng shì'), d('u2l4', '月光', 'yuè guāng'), d('u2l4', '辛苦', 'xīn kǔ'), d('u2l4', '棉衣', 'mián yī')],
  },
  {
    id: 'cn-u3-l1', unitId: 'cn-u3', order: 8, category: 'text', textbookNo: 4, title: '彩虹',
    preview: ['雨停了，天上出现了一座美丽的桥。', '我想到彩虹桥上，帮爸爸浇花、帮妈妈照镜子。'],
    review: ['我把哥哥的秋千挂到彩虹上，荡来荡去，花裙子飘成彩云。', '课文用一连串的想象，把彩虹写成了游乐的桥。'],
    tip: '朗读课文，说说“我”想在彩虹上做些什么。',
    questions: [
      choice('“我”想提着爸爸的水壶到桥上做什么？', ['把水洒下来，当作下雨', '浇楼下的花', '洗彩虹', '装满水壶'], 0),
      order('“我”的三个想象分别用到了什么？', ['水壶', '镜子', '秋千', '花裙子']),
      truefalse('彩虹真的可以挂秋千。', false, '这是“我”天真的想象。'),
    ],
    dictation: [d('u3l1', '彩虹', 'cǎi hóng'), d('u3l1', '水壶', 'shuǐ hú'), d('u3l1', '镜子', 'jìng zi'), d('u3l1', '秋千', 'qiū qiān'), d('u3l1', '裙子', 'qún zi')],
  },
  {
    id: 'cn-u3-l2', unitId: 'cn-u3', order: 9, category: 'text', textbookNo: 5, title: '去外婆家',
    preview: ['小时候，我最大的乐趣就是去外婆家。', '外婆家在山脚下，山上山下宝贝多。'],
    review: ['舅舅从山上带回山楂、柿子和毛栗子，小山雀围着我蹦跳鸣叫。', '春天满山杜鹃花，外婆采野花别在我衣服上。'],
    tip: '朗读课文，说说外婆家的山上有哪些“宝贝”。',
    questions: [
      choice('舅舅从山上干活回来会带什么？', ['山楂、柿子或毛栗子', '苹果和香蕉', '玩具', '新衣服'], 0),
      truefalse('林间的小山雀是外婆从小喂大的，见了“我”也不逃。', true),
      order('课文写了外婆家的哪些宝贝？', ['吃的', '玩的', '看的']),
    ],
    dictation: [d('u3l2', '外婆', 'wài pó'), d('u3l2', '山脚', 'shān jiǎo'), d('u3l2', '山楂', 'shān zhā'), d('u3l2', '柿子', 'shì zi'), d('u3l2', '杜鹃花', 'dù juān huā')],
  },
  {
    id: 'cn-u3-l3', unitId: 'cn-u3', order: 10, category: 'text', textbookNo: 6, title: '数星星的孩子',
    preview: ['晚上，满天的星星像无数珍珠撒在碧玉盘里。', '一个孩子靠着奶奶，仰起头，指着天空数星星。'],
    review: ['爷爷告诉他北斗七星像一把勺子，总是绕着北极星转。', '这个孩子叫张衡，长大后刻苦钻研天文，成了著名的天文学家。'],
    tip: '朗读课文，说说张衡小时候是怎样数星星的。',
    questions: [
      choice('数星星的孩子名叫什么？', ['张衡', '李时珍', '司马光', '曹冲'], 0),
      truefalse('北斗七星总是绕着北极星转。', true),
      order('爷爷教“我”认识了什么？', ['北斗七星', '北极星', '勺子形状', '绕着转']),
    ],
    dictation: [d('u3l3', '珍珠', 'zhēn zhū'), d('u3l3', '北斗七星', 'běi dǒu qī xīng'), d('u3l3', '钻研', 'zuān yán'), d('u3l3', '著名', 'zhù míng'), d('u3l3', '距离', 'jù lí')],
  },
  {
    id: 'cn-u4-l1', unitId: 'cn-u4', order: 11, category: 'text', textbookNo: 7, title: '古诗二首',
    preview: ['《登鹳雀楼》告诉我们站得高，看得远。', '《望庐山瀑布》写了瀑布从高处落下的样子。'],
    review: ['“欲穷千里目，更上一层楼”鼓励人不断进步。', '“飞流直下三千尺，疑是银河落九天”用了夸张。'],
    questions: [
      choice('“欲穷千里目，更上一层楼”是什么意思？', ['想看得更远，就要站得更高', '楼太高爬不上去', '太阳要落山了', '黄河很长'], 0),
      match('把诗句和题目连起来。', [
        { left: '白日依山尽', right: '登鹳雀楼' }, { left: '飞流直下三千尺', right: '望庐山瀑布' },
      ]),
      truefalse('“疑是银河落九天”中的“疑”是“怀疑”的意思。', true),
    ],
    dictation: [],
  },
  {
    id: 'cn-u4-l2', unitId: 'cn-u4', order: 12, category: 'text', textbookNo: 8, title: '黄山奇石',
    preview: ['黄山在我国安徽省。', '课文写了仙桃石、猴子观海、仙人指路、金鸡叫天都。'],
    review: ['作者用“好像、每当、这就是”等词把石头写得很生动。', '黄山石头的特点是奇形怪状。'],
    questions: [
      choice('下面哪一块不是课文写的黄山奇石？', ['大象望月', '仙桃石', '猴子观海', '金鸡叫天都'], 0),
      truefalse('黄山在我国安徽省。', true),
      match('把奇石和样子连起来。', [
        { left: '仙桃石', right: '像大桃子' }, { left: '猴子观海', right: '蹲在山头看云海' },
      ]),
    ],
    dictation: [d('u4l2', '黄山', 'huáng shān'), d('u4l2', '山顶', 'shān dǐng'), d('u4l2', '云海', 'yún hǎi'), d('u4l2', '巨石', 'jù shí'), d('u4l2', '金光闪闪', 'jīn guāng shǎn shǎn')],
  },
  {
    id: 'cn-u4-l3', unitId: 'cn-u4', order: 13, category: 'text', textbookNo: 9, title: '日月潭',
    preview: ['日月潭在台湾。', '湖中间的光华岛把湖分成日潭和月潭。'],
    review: ['清晨日月潭隐隐约约，中午清晰，雨天像仙境。', '课文按不同时间写日月潭的景色。'],
    questions: [
      choice('日月潭在哪里？', ['台湾', '海南', '安徽', '新疆'], 0),
      match('把时间和景色连起来。', [
        { left: '清晨', right: '隐隐约约' }, { left: '中午', right: '清晰' }, { left: '雨天', right: '像仙境' },
      ]),
      truefalse('光华岛在日月潭中间。', true),
    ],
    dictation: [d('u4l3', '群山', 'qún shān'), d('u4l3', '名胜古迹', 'míng shèng gǔ jì'), d('u4l3', '中央', 'zhōng yāng'), d('u4l3', '美丽', 'měi lì'), d('u4l3', '风光', 'fēng guāng')],
  },
  {
    id: 'cn-u4-l4', unitId: 'cn-u4', order: 14, category: 'text', textbookNo: 10, title: '葡萄沟',
    preview: ['葡萄沟在新疆吐鲁番。', '那里盛产水果，葡萄最有名。'],
    review: ['葡萄五光十色，老乡热情好客。', '课文表达了对葡萄沟的喜爱。'],
    questions: [
      choice('葡萄沟在哪里？', ['新疆', '台湾', '安徽', '北京'], 0),
      truefalse('葡萄沟的老乡热情好客。', true),
      choice('“五光十色”写出葡萄的什么？', ['颜色多、很漂亮', '味道酸', '数量少', '价格贵'], 0),
    ],
    dictation: [d('u4l4', '出产', 'chū chǎn'), d('u4l4', '水果', 'shuǐ guǒ'), d('u4l4', '山坡', 'shān pō'), d('u4l4', '五光十色', 'wǔ guāng shí sè'), d('u4l4', '好客', 'hào kè')],
  },
  {
    id: 'cn-u5-l1', unitId: 'cn-u5', order: 15, category: 'text', textbookNo: 11, title: '坐井观天',
    preview: ['青蛙坐在井里，认为天只有井口那么大。', '小鸟说天无边无际。'],
    review: ['“坐井观天”比喻目光短浅、见识少。', '课文通过青蛙和小鸟的三次对话展开。'],
    questions: [
      choice('“坐井观天”是什么意思？', ['目光短浅，见识少', '坐在井边看天', '天很小', '青蛙会飞'], 0),
      truefalse('小鸟认为天无边无际。', true),
      order('青蛙和小鸟的对话是怎样发展的？', ['青蛙问', '小鸟答', '青蛙不信', '小鸟解释'], '三次对话写出了它们不同的看法。'),
    ],
    dictation: [d('u5l1', '坐井观天', 'zuò jǐng guān tiān'), d('u5l1', '井沿', 'jǐng yán'), d('u5l1', '口渴', 'kǒu kě'), d('u5l1', '无边无际', 'wú biān wú jì'), d('u5l1', '大话', 'dà huà')],
  },
  {
    id: 'cn-u5-l2', unitId: 'cn-u5', order: 16, category: 'text', textbookNo: 12, title: '寒号鸟',
    preview: ['喜鹊勤劳，寒号鸟懒惰。', '冬天到了，寒号鸟没有窝。'],
    review: ['寒号鸟总说“得过且过”，最后冻死了。', '课文告诉我们做事要及早准备。'],
    questions: [
      choice('寒号鸟为什么冻死了？', ['它一直不做窝', '它不会飞', '它迷路了', '它没有食物'], 0),
      truefalse('喜鹊很勤劳。', true),
      match('把动物和特点连起来。', [
        { left: '喜鹊', right: '勤劳做窝' }, { left: '寒号鸟', right: '得过且过' },
      ]),
    ],
    dictation: [d('u5l2', '山脚', 'shān jiǎo'), d('u5l2', '晴朗', 'qíng lǎng'), d('u5l2', '清早', 'qīng zǎo'), d('u5l2', '将来', 'jiāng lái'), d('u5l2', '难过', 'nán guò')],
  },
  {
    id: 'cn-u5-l3', unitId: 'cn-u5', order: 17, category: 'text', textbookNo: 13, title: '我要的是葫芦',
    preview: ['种葫芦的人只要葫芦，不管叶子。', '叶子上长了蚜虫，他不听劝。'],
    review: ['蚜虫吃叶子，叶子坏了，葫芦也落了。', '事物之间是有联系的。'],
    questions: [
      choice('葫芦为什么都落了？', ['叶子被蚜虫吃坏', '水浇多了', '太阳太晒', '被人摘了'], 0),
      truefalse('种葫芦的人听了邻居的劝告。', false),
      order('事情是怎样发展的？', ['种葫芦', '叶长蚜虫', '不听劝', '葫芦落了']),
    ],
    dictation: [d('u5l3', '从前', 'cóng qián'), d('u5l3', '细长', 'xì cháng'), d('u5l3', '自言自语', 'zì yán zì yǔ'), d('u5l3', '邻居', 'lín jū'), d('u5l3', '奇怪', 'qí guài')],
  },
  {
    id: 'cn-u6-l1', unitId: 'cn-u6', order: 18, category: 'text', textbookNo: 14, title: '八角楼上',
    preview: ['井冈山斗争的年代，毛主席住在茅坪村的八角楼。', '每当夜幕降临，八角楼上的灯就亮了。'],
    review: ['寒冬腊月的深夜，毛主席在清油灯下写文章，凝视着星星之火。', '他写下了许多光辉著作，照亮了中国革命胜利的道路。'],
    tip: '朗读课文，说说毛主席是怎样工作的。',
    questions: [
      choice('毛主席住在哪里工作？', ['茅坪村的八角楼', '延安的窑洞', '西柏坡', '北京城里'], 0),
      order('八角楼上的深夜是怎样开始的？', ['夜幕降临', '灯亮了', '毛主席写文章', '凝视星星之火']),
      truefalse('毛主席凝视着星星之火，连毯子滑落下来也没有察觉。', true),
    ],
    dictation: [d('u6l1', '八角楼', 'bā jiǎo lóu'), d('u6l1', '深夜', 'shēn yè'), d('u6l1', '星星之火', 'xīng xīng zhī huǒ'), d('u6l1', '沉思', 'chén sī'), d('u6l1', '胜利', 'shèng lì')],
  },
  {
    id: 'cn-u6-l2', unitId: 'cn-u6', order: 19, category: 'text', textbookNo: 15, title: '朱德的扁担',
    preview: ['井冈山上粮食不多，朱德和战士们一起挑粮。', '大家把扁担藏起来，朱德又找来一根。'],
    review: ['朱德在扁担上写了“朱德的扁担”。', '课文表现了朱德以身作则、与战士同甘共苦。'],
    questions: [
      choice('大家为什么藏朱德的扁担？', ['心疼他太辛苦', '不喜欢他', '想自己用', '扁担坏了'], 0),
      truefalse('朱德用扁担和战士们一起挑粮。', true),
      match('把人物和表现连起来。', [
        { left: '朱德', right: '以身作则' }, { left: '战士们', right: '敬爱朱德' },
      ]),
    ],
    dictation: [d('u6l2', '扁担', 'biǎn dan'), d('u6l2', '同志', 'tóng zhì'), d('u6l2', '带领', 'dài lǐng'), d('u6l2', '队伍', 'duì wu'), d('u6l2', '红军', 'hóng jūn')],
  },
  {
    id: 'cn-u6-l3', unitId: 'cn-u6', order: 20, category: 'text', textbookNo: 16, title: '难忘的泼水节',
    preview: ['1961年，周总理和傣族人民一起过泼水节。', '泼水节是傣族最盛大的节日。'],
    review: ['课文写了周总理的穿着、动作和笑容。', '凤凰花开了，傣族人民欢迎周总理。'],
    questions: [
      choice('周总理和傣族人民一起过泼水节是哪一年？', ['1961年', '1949年', '1978年', '2008年'], 0),
      truefalse('泼水节是傣族的节日。', true),
      match('把事物和含义连起来。', [
        { left: '凤凰花', right: '喜庆' }, { left: '泼水', right: '祝福' },
      ]),
    ],
    dictation: [d('u6l3', '难忘', 'nán wàng'), d('u6l3', '泼水节', 'pō shuǐ jié'), d('u6l3', '一年一度', 'yī nián yī dù'), d('u6l3', '四面八方', 'sì miàn bā fāng'), d('u6l3', '人群', 'rén qún')],
  },
  {
    id: 'cn-u6-l4', unitId: 'cn-u6', order: 21, category: 'text', textbookNo: 17, title: '刘胡兰',
    preview: ['1947 年，年轻的共产党员刘胡兰被敌人逮捕。', '面对收买和威胁，她一点儿也不动摇。'],
    review: ['敌人当着她的面铡死了六个民兵，她挺起胸膛走到铡刀前。', '刘胡兰光荣地牺牲了，毛主席亲笔为她写了挽词。'],
    tip: '朗读课文，说说从哪些地方可以看出刘胡兰在敌人面前毫不屈服。',
    questions: [
      choice('敌人想收买刘胡兰，说出一个共产党员给多少钱？', ['一百块钱', '十块钱', '一块钱', '一千块钱'], 0),
      truefalse('刘胡兰说：怕死不是共产党员！', true),
      order('故事是按什么顺序发展的？', ['被捕', '收买', '威胁', '光荣牺牲']),
    ],
    dictation: [d('u6l4', '年轻', 'nián qīng'), d('u6l4', '村子', 'cūn zi'), d('u6l4', '广场', 'guǎng chǎng'), d('u6l4', '民兵', 'mín bīng'), d('u6l4', '知道', 'zhī dào')],
  },
  {
    id: 'cn-u7-l1', unitId: 'cn-u7', order: 22, category: 'text', textbookNo: 18, title: '古诗二首',
    preview: ['《江雪》写大雪中江面孤舟独钓的清冷。', '《敕勒歌》写草原辽阔。'],
    review: ['“孤舟蓑笠翁，独钓寒江雪”画出安静的雪景。', '“天苍苍，野茫茫，风吹草低见牛羊”写草原景象。'],
    questions: [
      choice('《江雪》里老翁在寒江上做什么？', ['独自钓鱼', '划船比赛', '看风景', '打鱼卖钱'], 0),
      match('把诗句和题目连起来。', [
        { left: '孤舟蓑笠翁', right: '江雪' }, { left: '风吹草低见牛羊', right: '敕勒歌' },
      ]),
      truefalse('《敕勒歌》写的是草原风光。', true),
    ],
    dictation: [],
  },
  {
    id: 'cn-u7-l2', unitId: 'cn-u7', order: 23, category: 'text', textbookNo: 19, title: '雾在哪里',
    preview: ['雾把大海、天空、太阳、房屋藏起来。', '雾是个淘气的孩子。'],
    review: ['课文用“藏”写雾的变化。', '雾散了，一切又露出来。'],
    questions: [
      choice('雾把什么藏起来了？', ['大海、天空、太阳、房屋', '只藏了太阳', '只藏了房屋', '什么也没藏'], 0),
      truefalse('课文把雾当作淘气的孩子来写。', true),
      order('按课文顺序排一排。', ['雾来了', '藏起大海', '藏起太阳和房屋', '雾散了']),
    ],
    dictation: [d('u7l2', '于是', 'yú shì'), d('u7l2', '岸边', 'àn biān'), d('u7l2', '房屋', 'fáng wū'), d('u7l2', '散步', 'sàn bù'), d('u7l2', '出现', 'chū xiàn')],
  },
  {
    id: 'cn-u7-l3', unitId: 'cn-u7', order: 24, category: 'text', textbookNo: 20, title: '雪孩子',
    preview: ['雪孩子陪小白兔玩，救了大火中的小白兔。', '雪孩子化成水，变成云。'],
    review: ['雪孩子勇敢、善良。', '课文按“堆雪人—着火—救人—化云”的顺序写。'],
    questions: [
      order('按故事顺序排一排。', ['堆雪人', '小白兔家着火', '雪孩子救人', '雪孩子化成云']),
      choice('雪孩子最后变成了什么？', ['云', '雨', '冰', '雪人'], 0),
      truefalse('雪孩子很勇敢。', true),
    ],
    dictation: [d('u7l3', '空地', 'kòng dì'), d('u7l3', '唱歌', 'chàng gē'), d('u7l3', '赶快', 'gǎn kuài'), d('u7l3', '火星', 'huǒ xīng'), d('u7l3', '水汽', 'shuǐ qì')],
  },
  {
    id: 'cn-u8-l1', unitId: 'cn-u8', order: 25, category: 'text', textbookNo: 21, title: '称赞',
    preview: ['小獾学做木工，做的小板凳有点粗糙。', '小刺猬称赞他：小板凳做得一个比一个好！'],
    review: ['小獾把苹果送给小刺猬，称赞苹果又香又甜。', '真诚的称赞能带给人自信和快乐。'],
    tip: '分角色朗读课文，说说称赞带来了什么。',
    questions: [
      choice('小刺猬是怎样称赞小獾的？', ['小板凳做得一个比一个好', '板凳做得最精致', '木工手艺最好', '学得最快'], 0),
      truefalse('称赞能带给人自信和快乐。', true),
      order('故事是怎样发展的？', ['小獾做板凳', '小刺猬称赞', '送苹果', '小獾称赞苹果']),
    ],
    dictation: [d('u8l1', '称赞', 'chēng zàn'), d('u8l1', '板凳', 'bǎn dèng'), d('u8l1', '苹果', 'píng guǒ'), d('u8l1', '自信', 'zì xìn'), d('u8l1', '疲劳', 'pí láo')],
  },
  {
    id: 'cn-u8-l3', unitId: 'cn-u8', order: 26, category: 'text', textbookNo: 22, title: '纸船和风筝',
    preview: ['松鼠和小熊住在山顶和山脚。', '他们用纸船和风筝成为好朋友。'],
    review: ['吵架后，他们都不好意思先开口。', '最后纸船和风筝让他们和好了。'],
    questions: [
      choice('松鼠和小熊为什么和好了？', ['纸船和风筝传递了心意', '他们搬家了', '有人来劝架', '他们忘了吵架'], 0),
      truefalse('好朋友吵架后要主动沟通。', true),
      order('按故事顺序排一排。', ['成为好朋友', '吵架', '不好意思开口', '纸船风筝和好']),
    ],
    dictation: [d('u8l3', '纸船', 'zhǐ chuán'), d('u8l3', '松果', 'sōng guǒ'), d('u8l3', '纸条', 'zhǐ tiáo'), d('u8l3', '屋顶', 'wū dǐng'), d('u8l3', '和好', 'hé hǎo')],
  },
  {
    id: 'cn-u8-l5', unitId: 'cn-u8', order: 27, category: 'text', textbookNo: 23, title: '快乐的小河',
    preview: ['一条小河匆忙赶路，迎面撞在大山上，疼得哭了起来。', '大山慈祥地开导他：不平静的水才有力量。'],
    review: ['小河邀请泉水和瀑布做好朋友，一起蹦蹦跳跳向前流。', '有伙伴相伴，小河变得坚强勇敢，快乐地流向前方。'],
    tip: '朗读课文，说说小河的心情是怎样变化的。',
    questions: [
      choice('小河为什么哭了？', ['撞在大山上，撞疼了', '水太少了', '迷路了', '太累了'], 0),
      truefalse('大山告诉小河：跌几个跟头，能让人长劲儿。', true),
      order('小河结伴的顺序是？', ['小河', '山泉', '瀑布', '一起流向前方']),
    ],
    dictation: [d('u8l5', '抱怨', 'bào yuàn'), d('u8l5', '松软', 'sōng ruǎn'), d('u8l5', '野花', 'yě huā'), d('u8l5', '勇敢', 'yǒng gǎn'), d('u8l5', '伙伴', 'huǒ bàn')],
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
    category: seed.category,
    textbookNo: seed.textbookNo,
    preview: { points: previewPoints },
    review: { points: reviewPoints, mistakes: seed.mistakes ?? [], tip: seed.tip },
    questions: buildQuestions(seed.id, kpIds, seed.questions),
    dictation: seed.dictation,
  };
});
