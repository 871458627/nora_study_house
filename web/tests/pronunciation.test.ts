import { describe, expect, it } from 'vitest';
import { scoreReading } from '../src/core/pronunciation';

describe('scoreReading（拼音对齐评分）', () => {
  it('读准满分', () => {
    const r = scoreReading('小蝌蚪找妈妈', '小蝌蚪找妈妈');
    expect(r.score).toBe(100);
    expect(r.stars).toBe(3);
    expect(r.missing).toEqual([]);
    expect(r.toneOff).toEqual([]);
    expect(r.expected).toBe(6);
  });

  it('多音字读对但识别成同音别字：不扣分（核心场景）', () => {
    const r = scoreReading('蒲公英传播种子，慢慢长大。', '蒲公英传播肿子，慢慢涨大。');
    expect(r.score).toBe(100);
    expect(r.missing).toEqual([]);
  });

  it('多音字两种识别字形（原文/别字）都满分，语境读音以替换表为准', () => {
    expect(scoreReading('长出后腿', '涨出后腿').score).toBe(100);
    expect(scoreReading('长出后腿', '长出后腿').score).toBe(100);
  });

  it('missing 展示原文字（不是注音替换后的字形）', () => {
    const r = scoreReading('长出', '出');
    expect(r.missing).toEqual(['长']);
  });

  it('音对调错：部分得分并单列提示', () => {
    const r = scoreReading('大', '打');
    expect(r.score).toBe(60);
    expect(r.toneOff).toEqual(['大']);
    expect(r.missing).toEqual([]);
    expect(r.stars).toBe(1);
  });

  it('读成别的音/漏读：计入 missing', () => {
    const r = scoreReading('小蝌蚪找妈妈', '小蝌蚪妈妈');
    expect(r.score).toBe(83);
    expect(r.missing).toEqual(['找']);
    const wrong = scoreReading('长大', '常大');
    expect(wrong.missing).toEqual(['长']);
    expect(wrong.score).toBe(50);
  });

  it('多读的字不扣分', () => {
    const r = scoreReading('青蛙', '一只青蛙了');
    expect(r.score).toBe(100);
  });

  it('标点、空白与非汉字不计分', () => {
    const r = scoreReading('头顶，雪白的肚皮。', '头顶，雪白的肚皮！123');
    expect(r.score).toBe(100);
  });

  it('空转写：全部计为 missing', () => {
    const r = scoreReading('妈妈', '   ');
    expect(r.score).toBe(0);
    expect(r.missing).toEqual(['妈', '妈']);
  });

  it('空目标：expected 为 0，不抛错', () => {
    const r = scoreReading('！！！', '妈妈');
    expect(r.expected).toBe(0);
    expect(r.score).toBe(0);
    expect(r.stars).toBe(0);
  });

  it('星星档位：90/70/40', () => {
    expect(scoreReading('一二三四五六七八九十', '一二三四五六七八').stars).toBe(2);
    expect(scoreReading('一二三四五六七八九十', '一二三').stars).toBe(0);
  });
});
