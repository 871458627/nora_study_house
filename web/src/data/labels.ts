import type { TaskKind } from './types';

export const TASK_KIND_LABEL: Record<TaskKind, string> = {
  review: '复习',
  preview: '预习',
  practice: '巩固',
  dictation: '听写',
  oral: '口算',
  words: '单词',
  weak: '薄弱点',
};

export const LESSON_STATUS_LABEL = {
  new: '未开始',
  previewed: '已预习',
  reviewed: '待巩固',
  mastered: '已掌握',
} as const;

export const MASTERY_LABEL = ['刚接触', '有点印象', '比较熟练', '已经掌握'];
