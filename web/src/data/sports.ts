// 运动打卡项目目录（用户需求 2026-10-25：体育打卡记录每日运动，不限于此）。
// 达标线为二年级体测量级的默认建议值；坐位体前屈是测量类项目，打卡即记录。
// 星星每日上限与自定义项目数量上限也放在这里——data 层无反向依赖，model/core
// 都可以安全引用，避免循环 import。

export interface SportsItem {
  id: string;
  name: string;
  unit: string;
  /** 达标线：当日数值 ≥ goal 记为达标 */
  goal: number;
  /** 步进器每步增量（孩子友好） */
  step: number;
  builtin?: boolean;
}

/** 每日星星上限：达标项目再多一天最多 3 颗（防刷量，量级对齐学习任务）。 */
export const SPORTS_DAILY_STAR_CAP = 3;
/** 自定义项目数量上限 */
export const SPORTS_MAX_CUSTOM_ITEMS = 5;

export const SPORTS_ITEMS: SportsItem[] = [
  { id: 'rope', name: '跳绳', unit: '个', goal: 300, step: 10, builtin: true },
  { id: 'run', name: '跑步', unit: '分钟', goal: 15, step: 1, builtin: true },
  { id: 'situp', name: '仰卧起坐', unit: '个', goal: 40, step: 5, builtin: true },
  { id: 'reach', name: '坐位体前屈', unit: 'cm', goal: 10, step: 1, builtin: true },
  { id: 'jj', name: '开合跳', unit: '个', goal: 100, step: 10, builtin: true },
  { id: 'squat', name: '深蹲', unit: '个', goal: 30, step: 5, builtin: true },
];
