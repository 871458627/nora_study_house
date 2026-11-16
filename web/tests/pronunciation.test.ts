import { describe, expect, it } from 'vitest';
import { scoreReading } from '../src/core/pronunciation';

// 钉死跟读评分（2026-10-27 需求）：字符级 LCS 对齐——孩子读对多音字，
// 识别转写出正确的字；读错多音字会转写成同音别字，扣分自然出现。

describe('跟读评分 · scoreReading', () => {
  it('全部读对：100 分三星，标点不影响', () => {
    const r = scoreReading('我是什么。', '我是什么，');
    expect(r.score).toBe(100);
    expect(r.stars).toBe(3);
    expect(r.missing).toEqual([]);
  });

  it('漏读部分字：按命中比例给分并给出没读清楚的字', () => {
    const r = scoreReading('小蝌蚪找妈妈', '小蝌蚪找');
    expect(r.score).toBe(67);
    expect(r.stars).toBe(1);
    expect(r.missing).toEqual(['妈', '妈']);
  });

  it('读错多音字：转写成同音别字被识别为未命中', () => {
    // 目标「长大」读成 cháng dà，转写可能给出「常大」
    const r = scoreReading('长大', '常大');
    expect(r.score).toBe(50);
    expect(r.missing).toEqual(['长']);
  });

  it('空白转写：0 分并列出全部目标字', () => {
    const r = scoreReading('我是什么', '');
    expect(r.score).toBe(0);
    expect(r.stars).toBe(0);
    expect(r.missing).toEqual(['我', '是', '什', '么']);
  });

  it('多读的字不加分：分数以目标为分母', () => {
    const r = scoreReading('彩虹', '彩虹桥真美丽呀');
    expect(r.matched).toBe(2);
    expect(r.expected).toBe(2);
    expect(r.score).toBe(100);
  });

  it('读对多音字：双侧 forSpeech 归一后同音命中（不误判成别字）', () => {
    // 目标「长大」经 forSpeech 注音替换为「涨大」，识别转写「涨大」同样归一——
    // 孩子读对多音字时，识别输出哪个同音字形都不应扣分。
    const r = scoreReading('长大', '涨大');
    expect(r.score).toBe(100);
    expect(r.stars).toBe(3);
    expect(r.missing).toEqual([]);
    expect(r.toneOff).toEqual([]);
  });

  it('声调不对算部分命中（0.6/字）：马 mǎ 读成 妈 mā', () => {
    const r = scoreReading('马', '妈');
    expect(r.toneOff).toEqual(['马']);
    expect(r.matched).toBe(0.6);
    expect(r.score).toBe(60);
    expect(r.stars).toBe(1);
  });

  it('星级阈值：75 分两星 / 50 分一星 / 25 分无星', () => {
    expect(scoreReading('一二三四', '一二三五').stars).toBe(2);
    expect(scoreReading('一二三四', '一二五五').stars).toBe(1);
    expect(scoreReading('一二三四', '一五五五').stars).toBe(0);
  });

  it('空目标：全零结果且不抛错', () => {
    const r = scoreReading('', '随便什么');
    expect(r.score).toBe(0);
    expect(r.expected).toBe(0);
    expect(r.missing).toEqual([]);
    expect(r.stars).toBe(0);
  });
});
