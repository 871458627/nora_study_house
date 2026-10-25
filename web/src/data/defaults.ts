import type { SlotSubject, SubjectId, Timetable } from './types';

export const WEEKDAY_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
export const WEEKDAY_FULL = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];
export const PERIOD_NAMES = ['第 1 节', '第 2 节', '第 3 节', '第 4 节', '第 5 节', '第 6 节'];

const weekday: SlotSubject[] = ['chinese', 'math', 'chinese', 'english', 'math', 'other'];

export const DEFAULT_TIMETABLE: Timetable = [
  [...weekday],
  ['math', 'chinese', 'chinese', 'other', 'math', 'chinese'],
  ['chinese', 'math', 'english', 'chinese', 'math', 'other'],
  ['math', 'chinese', 'other', 'chinese', 'math', 'chinese'],
  ['chinese', 'math', 'chinese', 'english', 'math', 'other'],
  [null, null, null, null, null, null],
  [null, null, null, null, null, null],
];

export const DEFAULT_SETTINGS = {
  dailyMinutes: 35,
  deadlineHour: 21,
  dailyDrill: false,
  dictationMode: 'choice' as const,
  ttsEnabled: true,
};

export interface Accessory {
  id: string;
  name: string;
  slot: 'head' | 'neck' | 'face';
  unlock: string;
  hint: string;
}

export const ACCESSORIES: Accessory[] = [
  { id: 'bow', name: '莓果蝴蝶结', slot: 'head', unlock: 'streak3', hint: '连续打卡 3 天' },
  { id: 'crown', name: '星星皇冠', slot: 'head', unlock: 'streak14', hint: '连续打卡 14 天' },
  { id: 'glasses', name: '圆框眼镜', slot: 'face', unlock: 'master10', hint: '掌握 10 课' },
  { id: 'scarf', name: '薄荷围巾', slot: 'neck', unlock: 'dictation100', hint: '一次听写全对' },
  { id: 'cape', name: '勇气披风', slot: 'neck', unlock: 'allround', hint: '三科都完成一次复习' },
];

export interface BadgeDef {
  id: string;
  name: string;
  hint: string;
  accessory?: string;
}

export const BADGES: BadgeDef[] = [
  { id: 'first-step', name: '第一步', hint: '完成第一个任务' },
  { id: 'streak3', name: '三天小火苗', hint: '连续打卡 3 天', accessory: 'bow' },
  { id: 'streak7', name: '一周同行', hint: '连续打卡 7 天' },
  { id: 'streak14', name: '两周守护', hint: '连续打卡 14 天', accessory: 'crown' },
  { id: 'streak30', name: '满月星光', hint: '连续打卡 30 天' },
  { id: 'master10', name: '十课通关', hint: '掌握 10 课', accessory: 'glasses' },
  { id: 'dictation100', name: '听写满分', hint: '一次听写全部写对', accessory: 'scarf' },
  { id: 'allround', name: '三科全能', hint: '语数英都完成一次复习', accessory: 'cape' },
  { id: 'perfect-week', name: '全勤一周', hint: '一周里每天都完成计划' },
  { id: 'foodie', name: '桃粮管家', hint: '累计喂食 7 天' },
];

export const MINUTE_OPTIONS = [15, 25, 35, 50];

export const SLOT_LABEL: Record<Exclude<SlotSubject, null>, string> = {
  chinese: '语文',
  math: '数学',
  english: '英语',
  other: '其他',
};

export const SUBJECT_ORDER: SubjectId[] = ['chinese', 'math', 'english'];
