import { describe, expect, it } from 'vitest';
import { pinyin } from 'pinyin-pro';
import { forSpeech, splitReadingUnits } from '../src/core/reading';

describe('forSpeech（多音字注音替换）', () => {
  it('替换课文里的多音字词', () => {
    expect(forSpeech('小蝌蚪长大了')).toBe('小蝌蚪涨大了');
    expect(forSpeech('蒲公英传播种子')).toBe('蒲公英传播肿子');
  });

  it('不动标点与空白', () => {
    expect(forSpeech('长大，长出后腿！')).toBe('涨大，涨出后腿！');
  });

  it('长词优先于短词', () => {
    expect(forSpeech('慢慢生长')).toBe('慢慢生涨');
  });

  it('注音替换后的读音即语境目标读音', () => {
    const syllablesOf = (text: string) => pinyin(forSpeech(text), { toneType: 'num', type: 'array' });
    expect(syllablesOf('长出后腿')).toEqual(['zhang3', 'chu1', 'hou4', 'tui3']);
    expect(syllablesOf('慢慢长大')).toEqual(['man4', 'man4', 'zhang3', 'da4']);
    expect(syllablesOf('淹没')).toEqual(['yan1', 'mo4']);
  });
});

describe('splitReadingUnits（按句切分）', () => {
  it('保留句尾标点，尾句无标点也保留', () => {
    expect(splitReadingUnits('你好。再见')).toEqual(['你好。', '再见']);
  });

  it('问句感叹句都成独立单元，空句丢弃', () => {
    expect(splitReadingUnits('来！走？行；。')).toEqual(['来！', '走？', '行；']);
    expect(splitReadingUnits('')).toEqual([]);
  });
});
