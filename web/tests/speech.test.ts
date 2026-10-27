import { describe, expect, it } from 'vitest';
import { pickVoice, voiceAvailable } from '../src/app/useSpeech';

const voice = (lang: string, localService = true) => ({
  lang,
  localService,
  name: `${lang}-${localService ? 'local' : 'online'}`,
});

describe('pickVoice（朗读语音挑选）', () => {
  it('优先选语言完全一致的语音', () => {
    const list = [voice('en-GB'), voice('en-US'), voice('zh-CN')];
    expect(pickVoice(list, 'en-US')?.lang).toBe('en-US');
  });

  it('同语言里本地语音优先，在线语音只作兜底', () => {
    const online = voice('en-US', false);
    const local = voice('en-US', true);
    expect(pickVoice([online, local], 'en-US')).toBe(local);
    expect(pickVoice([online], 'en-US')).toBe(online);
  });

  it('没有完全一致时按语言前缀回退', () => {
    const list = [voice('zh-CN'), voice('en-GB')];
    expect(pickVoice(list, 'en-US')?.lang).toBe('en-GB');
  });

  it('语言不匹配时返回 undefined，由调用方用系统默认语音兜底', () => {
    expect(pickVoice([voice('zh-CN')], 'en-US')).toBeUndefined();
    expect(pickVoice([], 'zh-CN')).toBeUndefined();
  });

  it('兼容下划线的语言代码写法（如 en_US）', () => {
    expect(pickVoice([voice('en_US')], 'en-US')?.lang).toBe('en_US');
    expect(pickVoice([voice('en-US')], 'en_US')?.lang).toBe('en-US');
  });
});

describe('voiceAvailable（语音可用性判定）', () => {
  it('语音列表未加载完时保持乐观，避免按钮闪没', () => {
    expect(voiceAvailable([], 'en-US', false)).toBe(true);
  });

  it('加载窗口过后仍无任何语音，如实报告不可用', () => {
    expect(voiceAvailable([], 'en-US', true)).toBe(false);
    expect(voiceAvailable([], 'zh-CN', true)).toBe(false);
  });

  it('有语音列表时按语言前缀匹配，与加载状态无关', () => {
    const list = [voice('en-US'), voice('zh-CN')];
    expect(voiceAvailable(list, 'en-US', false)).toBe(true);
    expect(voiceAvailable(list, 'en-US', true)).toBe(true);
    expect(voiceAvailable([voice('zh-CN')], 'en-US', true)).toBe(false);
  });
});
