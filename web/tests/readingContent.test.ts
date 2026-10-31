// 短文阅读内容完整性（docs/06 §3.13）：
// 1. 每节英语课都有短文；2. 词量 ~60（45-75）；3. 词汇复用率 ≥75%（累计已学词 + 功能词白名单）；
// 4. 短文纯英文、句子完整；5. 每篇 2 道理解题且选项合法。
// 内容为依据课本词汇自创辅助材料，若与课本有出入以课本为准。
import { describe, expect, it } from 'vitest';
import { englishLessons } from '../src/data/content/english';
import { englishLessons2S2 } from '../src/data/content/packs/g2s2/english';
import { englishReadings } from '../src/data/content/englishReadings';

const LESSONS = [...englishLessons, ...englishLessons2S2];

// 功能词与常见故事词白名单：不来自课本但为成句必需的「胶水词」。
const ALLOWED_EXTRA = new Set(
  [
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'our', 'their',
    'my', 'your', 'his', 'its', 'a', 'an', 'the', 'is', 'are', 'am', 'and', 'but', 'or', 'to',
    'in', 'on', 'at', 'by', 'with', 'for', 'of', 'from', 'up', 'down', 'out', 'off',
    'what', 'where', 'who', 'how', 'this', 'that', 'these', 'those',
    'says', 'say', 'get', 'gets', 'go', 'goes', 'like', 'likes', 'can', 'has', 'have', 'do', 'does',
    'yes', 'no', 'not', 'now', 'very', 'so', 'oh', 'hi', 'hello', 'too', 'again', 'all', 'every',
    'ben', 'lily', 'ann', 'sam', 'mia', 'dad', 'mum', 'miss', 'ma', 'teacher',
    'one', 'two', 'three', 'four', 'five', 'six', 'nine', 'ten',
    'night', 'sky', 'yum', 'ok', 'new', 'far',
  ],
);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function learnedTokensUpTo(lessonId: string): Set<string> {
  const index = LESSONS.findIndex(l => l.id === lessonId);
  const learned = new Set<string>();
  for (const lesson of LESSONS.slice(0, index + 1)) {
    for (const word of lesson.words ?? []) {
      for (const token of tokenize(`${word.en} ${word.sentence}`)) learned.add(token);
    }
  }
  return learned;
}

describe('英语短文阅读内容（docs/06 §3.13）', () => {
  it('每节英语课都有短文与 2 道理解题', () => {
    for (const lesson of LESSONS) {
      const reading = englishReadings[lesson.id];
      expect(reading, `${lesson.id} 缺短文`).toBeDefined();
      expect(reading.questions.length, `${lesson.id} 理解题数量`).toBe(2);
      for (const question of reading.questions) {
        expect(question.options, question.q).toHaveLength(3);
        expect(question.answer, question.q).toBeGreaterThanOrEqual(0);
        expect(question.answer, question.q).toBeLessThan(3);
        expect(new Set(question.options).size, question.q).toBe(3);
      }
    }
    expect(LESSONS.length).toBe(24);
  });

  it('短文词量在 45-75 之间，句子完整（以 .!? 结尾）', () => {
    for (const lesson of LESSONS) {
      const reading = englishReadings[lesson.id];
      const count = tokenize(reading.text).length;
      expect(count, `${lesson.id} 词量 ${count}`).toBeGreaterThanOrEqual(45);
      expect(count, `${lesson.id} 词量 ${count}`).toBeLessThanOrEqual(75);
      expect(reading.text.trim().replace(/["']+$/, ''), `${lesson.id} 结尾`).toMatch(/[.!?]$/);
    }
  });

  it('短文不含中文字符（纯英文正文）', () => {
    for (const lesson of LESSONS) {
      expect(englishReadings[lesson.id].text, lesson.id).not.toMatch(/[\u4e00-\u9fff]/);
    }
  });

  it('词汇复用率 ≥75%（累计已学词 + 功能词白名单）', () => {
    for (const lesson of LESSONS) {
      const learned = learnedTokensUpTo(lesson.id);
      const tokens = tokenize(englishReadings[lesson.id].text);
      const covered = tokens.filter(t => learned.has(t) || ALLOWED_EXTRA.has(t)).length;
      const ratio = covered / tokens.length;
      expect(ratio, `${lesson.id} 复用率 ${Math.round(ratio * 100)}%`).toBeGreaterThanOrEqual(0.75);
    }
  });
});
