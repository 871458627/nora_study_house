// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { useSpeechRecognition } from '../src/app/useSpeechRecognition';

// 跟读识别 hook 的行为回归：重点覆盖「读完没反应/不出分」的三个历史根因——
// 只认 final、continuous 读完不结算、非安全上下文静默失败。
// 全程 fake timers + 同步断言（waitFor 的真实时钟轮询会与 fake timers 互锁）。

class MockRecognition {
  static latest: MockRecognition | null = null;
  lang = '';
  continuous = false;
  interimResults = false;
  maxAlternatives = 1;
  onresult: ((event: unknown) => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  start() {
    MockRecognition.latest = this;
  }
  stop() {}
  abort() {}
}

function latestRec(): MockRecognition {
  const rec = MockRecognition.latest;
  if (!rec) throw new Error('recognition not started');
  return rec;
}

function emitResult(rec: MockRecognition, transcript: string, isFinal: boolean): void {
  const result = Object.assign([{ transcript }], { isFinal });
  rec.onresult?.({ resultIndex: 0, results: [result] });
}

function installMock(): void {
  (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition = MockRecognition;
}

function setSecure(value: boolean): void {
  Object.defineProperty(window, 'isSecureContext', { value, configurable: true });
}

const originalCtor = (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition;
const originalSecure = (window as unknown as { isSecureContext?: boolean }).isSecureContext;

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  const scope = window as unknown as { SpeechRecognition?: unknown; isSecureContext?: boolean };
  if (originalCtor === undefined) delete scope.SpeechRecognition;
  else scope.SpeechRecognition = originalCtor;
  if (originalSecure === undefined) delete scope.isSecureContext;
  else scope.isSecureContext = originalSecure;
});

describe('useSpeechRecognition（跟读识别）', () => {
  it('浏览器不支持时 canListen=false，start 直接报 unsupported', () => {
    const scope = window as unknown as { SpeechRecognition?: unknown };
    delete scope.SpeechRecognition;
    const { result } = renderHook(() => useSpeechRecognition());
    expect(result.current.canListen).toBe(false);
    const onFail = vi.fn();
    act(() => result.current.start(() => {}, onFail));
    expect(onFail).toHaveBeenCalledWith('unsupported');
  });

  it('只有 interim 结果就结束：也结算出评分文本（历史上会误报没听清）', () => {
    installMock();
    const { result } = renderHook(() => useSpeechRecognition());
    const done = vi.fn();
    act(() => result.current.start(done));
    act(() => emitResult(latestRec(), '青蛙妈妈', false));
    expect(result.current.transcript).toBe('青蛙妈妈');
    act(() => latestRec().onend?.());
    expect(done).toHaveBeenCalledWith('青蛙妈妈');
    expect(result.current.state).toBe('idle');
  });

  it('读完停顿后自动结算，不用手点「读完了」', () => {
    installMock();
    const { result } = renderHook(() => useSpeechRecognition());
    const done = vi.fn();
    act(() => result.current.start(done));
    act(() => emitResult(latestRec(), '小蝌蚪', true));
    act(() => {
      vi.advanceTimersByTime(3500);
    });
    expect(done).toHaveBeenCalledWith('小蝌蚪');
    expect(result.current.state).toBe('idle');
  });

  it('final 与 interim 拼接结算，手动「读完了」立即出结果', () => {
    installMock();
    const { result } = renderHook(() => useSpeechRecognition());
    const done = vi.fn();
    act(() => result.current.start(done));
    act(() => emitResult(latestRec(), '青蛙', true));
    act(() => emitResult(latestRec(), '妈妈', false));
    act(() => result.current.finish());
    expect(done).toHaveBeenCalledWith('青蛙妈妈');
  });

  it('非安全上下文（局域网 http）：secure=false，start 报 insecure', () => {
    installMock();
    setSecure(false);
    const { result } = renderHook(() => useSpeechRecognition());
    expect(result.current.secure).toBe(false);
    const done = vi.fn();
    const onFail = vi.fn();
    act(() => result.current.start(done, onFail));
    expect(onFail).toHaveBeenCalledWith('insecure');
    expect(done).not.toHaveBeenCalled();
  });

  it('识别报错（非 abort）：有错误回调且状态复位', () => {
    installMock();
    const { result } = renderHook(() => useSpeechRecognition());
    const done = vi.fn();
    const onFail = vi.fn();
    act(() => result.current.start(done, onFail));
    act(() => latestRec().onerror?.({ error: 'not-allowed' }));
    expect(onFail).toHaveBeenCalledWith('not-allowed');
    expect(result.current.state).toBe('idle');
    expect(done).not.toHaveBeenCalled();
  });

  it('整体时长封顶：一直不出结果也会在 20s 后收场', () => {
    installMock();
    const { result } = renderHook(() => useSpeechRecognition());
    const done = vi.fn();
    const onFail = vi.fn();
    act(() => result.current.start(done, onFail));
    act(() => {
      vi.advanceTimersByTime(20500);
    });
    expect(onFail).toHaveBeenCalledWith('no-speech');
    expect(done).not.toHaveBeenCalled();
  });
});
