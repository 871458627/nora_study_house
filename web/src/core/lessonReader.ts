import type { Lesson } from '../data/types';

/**
 * 课文朗读脚本（纯函数）：把一课可朗读的内容展开成有序段落。
 * 语文：课名 → 预习卡 → 复习卡 → 温馨提示（全 zh-CN）。
 * 英语：课名 → 单词与例句（en-US，跳过中英混排的知识卡，避免 TTS 拗口）。
 * 供 useLessonReader 逐段朗读；无内容的课返回空数组，由调用方降级。
 */
export interface ReadSegment {
  text: string;
  lang: 'zh-CN' | 'en-US';
}

export function buildLessonReadScript(lesson: Lesson): ReadSegment[] {
  const segments: ReadSegment[] = [];

  if (lesson.subject === 'english') {
    segments.push({ text: lesson.title, lang: 'en-US' });
    for (const word of lesson.words ?? []) {
      segments.push({ text: `${word.en}. ${word.sentence}`, lang: 'en-US' });
    }
    return segments;
  }

  segments.push({ text: `${lesson.title}。`, lang: 'zh-CN' });
  for (const point of lesson.preview.points) {
    segments.push({ text: `${point.text}。`, lang: 'zh-CN' });
  }
  for (const point of lesson.review.points) {
    segments.push({ text: `${point.text}。`, lang: 'zh-CN' });
  }
  if (lesson.review.tip) {
    segments.push({ text: lesson.review.tip, lang: 'zh-CN' });
  }
  return segments.filter((segment) => segment.text.trim().length > 0);
}
