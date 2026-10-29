import { describe, expect, it } from 'vitest';
import { forSpeech, splitReadingUnits } from '../src/core/reading';

// 钉死朗读文本处理（2026-10-27 需求）：多音字注音替换让 TTS 读准
// （长大/淹没/种子是二上课文高频错读词），逐句切分支撑感情化朗读。

describe('朗读文本 · 多音字注音替换', () => {
  it('课文高频多音字词替换为同音异形（长大→涨大）', () => {
    expect(forSpeech('我长大了')).toBe('我涨大了');
    expect(forSpeech('淹没庄稼')).toBe('淹末庄稼');
    expect(forSpeech('种子的传播')).toBe('肿子的传播');
  });

  it('长词优先：不误伤包含关系（生长里的「长」不被单独处理）', () => {
    expect(forSpeech('生长在埃及')).toBe('生涨在埃及');
    expect(forSpeech('非常')).toBe('非常');
  });

  it('未收录的词保持原样（宁缺毋滥）', () => {
    expect(forSpeech('快乐的小河')).toBe('快乐的小河');
    expect(forSpeech('_min')).toBe('_min');
  });
});

describe('朗读文本 · 逐句切分', () => {
  it('按句尾标点切分并保留标点', () => {
    expect(splitReadingUnits('雨停了。天上有一座桥！真的吗？')).toEqual([
      '雨停了。',
      '天上有一座桥！',
      '真的吗？',
    ]);
  });

  it('无句尾标点的尾巴成句；空段被丢弃', () => {
    expect(splitReadingUnits('第一句。尾巴没有标点')).toEqual(['第一句。', '尾巴没有标点']);
    expect(splitReadingUnits('。。！')).toEqual([]);
  });
});
