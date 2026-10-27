import { pinyin } from 'pinyin-pro';
import { forSpeech } from './reading';

// 朗读评分（纯函数）：把孩子的语音识别转写与目标文本做「音节级」对齐打分。
//
// 识别转写的是「孩子读出的音」对应的字——读对多音字时识别常给出同音别字
// （如目标「长大」，读对后转写成「涨大」），按字形比对会误判成读错。
// 所以两侧都先转成带调拼音再做对齐：同音即命中，仅声调不同算部分命中，
// 音不同才算没读准。多音字的语境读音由 pinyin-pro 的分词注音决定，与
// TTS 注音替换（core/reading.ts）保持同一套语境口径。
// 标点、空白与非汉字字符不计分；识别多读的字不扣分（LCS 对齐天然忽略）。

export interface ReadingScore {
  /** 0-100：对齐命中得分 / 目标字数 */
  score: number;
  /** 0-3 星：≥90 三星，≥70 两星，≥40 一星 */
  stars: 0 | 1 | 2 | 3;
  /** 命中得分（声调全对 1/字，仅调不同 0.6/字） */
  matched: number;
  /** 目标文本的有效字数（去标点/非汉字） */
  expected: number;
  /** 目标里有、孩子没读出来或读成别的音的字（按出现顺序） */
  missing: string[];
  /** 音对但声调不准的目标字（按出现顺序） */
  toneOff: string[];
}

const TONE_EXACT = 1;
const TONE_OFF = 0.6;
const KEEP = /[^\p{Script=Han}]/gu;

function keepChinese(text: string): string {
  return (text || '').replace(KEEP, '');
}

/** 逐字带调拼音（pinyin-pro 语境注音，多音字按词定音）。 */
function syllables(chars: string): string[] {
  if (!chars) return [];
  return pinyin(chars, { toneType: 'num', type: 'array', nonZh: 'consecutive' });
}

/** 两个音节的命中得分：全同 1；仅声调不同 0.6；音不同 0。 */
function matchCredit(wantSyl: string, gotSyl: string): number {
  if (wantSyl === gotSyl) return TONE_EXACT;
  const mW = /([a-z]+)([0-5]?)$/.exec(wantSyl);
  const mG = /([a-z]+)([0-5]?)$/.exec(gotSyl);
  const baseW = mW ? mW[1] : wantSyl;
  const baseG = mG ? mG[1] : gotSyl;
  return baseW === baseG ? TONE_OFF : 0;
}

export function scoreReading(target: string, transcript: string): ReadingScore {
  // 两侧都先过注音替换表再注音：目标「长出」与转写「涨出」都归一到
  // zhǎng chū——孩子读对多音字时，无论识别输出哪个同音字形都不误判。
  const wantChars = keepChinese(forSpeech(target));
  const want = syllables(wantChars);
  const n = want.length;
  if (!n) {
    return { score: 0, stars: 0, matched: 0, expected: 0, missing: [], toneOff: [] };
  }
  const got = syllables(keepChinese(forSpeech(transcript)));
  const m = got.length;
  if (!m) {
    return { score: 0, stars: 0, matched: 0, expected: n, missing: [...wantChars], toneOff: [] };
  }

  // dp[i][j]：目标前 i 字 × 转写前 j 音的最大加权命中（加权 LCS）。
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const skip = Math.max(dp[i - 1]![j]!, dp[i]![j - 1]!);
      const credit = matchCredit(want[i - 1]!, got[j - 1]!);
      const take = credit > 0 ? dp[i - 1]![j - 1]! + credit : dp[i - 1]![j - 1]!;
      dp[i]![j] = Math.max(skip, take);
    }
  }

  // 回溯：标记每个目标字拿到的得分（0=没读准，0.6=音对调错，1=读准）。
  const credits = new Array<number>(n).fill(0);
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    const credit = matchCredit(want[i - 1]!, got[j - 1]!);
    if (credit > 0 && dp[i]![j] === dp[i - 1]![j - 1]! + credit) {
      credits[i - 1] = Math.max(credits[i - 1]!, credit);
      i -= 1;
      j -= 1;
    } else if (dp[i - 1]![j]! >= dp[i]![j - 1]!) {
      i -= 1;
    } else {
      j -= 1;
    }
  }

  const total = credits.reduce((sum, c) => sum + c, 0);
  const score = Math.round((total / n) * 100);
  const stars: 0 | 1 | 2 | 3 = score >= 90 ? 3 : score >= 70 ? 2 : score >= 40 ? 1 : 0;
  // 展示用原文字（未替换）：注音替换是等长替换，位置一一对应；
  // 若未来出现不等长条目则退回归一后的字，保证不越界。
  const displayChars = keepChinese(target);
  const display = displayChars.length === n ? displayChars : wantChars;
  const missing: string[] = [];
  const toneOff: string[] = [];
  credits.forEach((c, idx) => {
    if (c === TONE_OFF) toneOff.push(display[idx]!);
    else if (c === 0) missing.push(display[idx]!);
  });
  return {
    score,
    stars,
    matched: Math.round(total * 10) / 10,
    expected: n,
    missing,
    toneOff,
  };
}
