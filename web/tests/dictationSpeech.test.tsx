// @vitest-environment jsdom
/**
 * 听写页语音降级与恢复（Redmi Pad Pro「这台设备暂不能朗读」修复回归）：
 * 1. 田字格写 + 无语音：降级提示与拼音同时可见（此前拼音被藏起，「看拼音完成听写」落空）。
 * 2. Android 怪癖：TTS 引擎要被 speak()「踢」一次才枚举语音——挂载时判「不能朗读」，
 *    首次点击（pointerdown 踢引擎）后语音到位，喇叭自动恢复，不再永久降级。
 * 3. 有语音但引擎假死（入队永不 start）：连续两次失败整页退回拼音降级，可「再试一次」。
 */
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DictationSession } from '../src/features/dictation/DictationSession';

const words = [
  { id: 'dw1', word: '时间', pinyin: 'shí jiān' },
  { id: 'dw2', word: '早上', pinyin: 'zǎo shang' },
];

type Listener = (event?: unknown) => void;

class FakeUtterance {
  text = '';
  lang = '';
  rate = 1;
  pitch = 1;
  volume = 1;
  voice: unknown = null;
  private listeners = new Map<string, Listener[]>();

  constructor(text?: string) {
    if (text !== undefined) this.text = text;
  }

  addEventListener(type: string, listener: Listener): void {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }

  removeEventListener(type: string, listener: Listener): void {
    this.listeners.set(type, (this.listeners.get(type) ?? []).filter(fn => fn !== listener));
  }

  emit(type: string): void {
    for (const listener of this.listeners.get(type) ?? []) listener({});
  }
}

// Android 模拟：引擎被「带手势的 speak」踢过之后才枚举出语音；
// gestureSeen=false 时引擎完全沉默（Chrome Android 的 autoplay 门槛）。
let gestureSeen = false;
let engineKicked = false;
// 引擎假死模拟：入队的真实朗读永不触发事件
let deadEngine = false;
// 诊断计数器
let kickSpeakCount = 0;
let gestureListenerHits = 0;
let getVoicesCount = 0;

function installDictationSpeechMock(): void {
  gestureSeen = false;
  engineKicked = false;
  deadEngine = false;
  const synth = {
    speaking: false,
    pending: false,
    paused: false,
    getVoices: () => {
      getVoicesCount += 1;
      return engineKicked
        ? [
            {
              name: 'Xiaomi Mandarin',
              lang: 'zh-CN',
              localService: true,
              default: false,
              voiceURI: 'mi-zh',
            },
          ]
        : [];
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    cancel: () => {},
    speak: (utterance: FakeUtterance) => {
      if (utterance.text === ' ') {
        kickSpeakCount += 1;
        if (gestureSeen) engineKicked = true; // 踢引擎
        return;
      }
      if (deadEngine) return;
      window.setTimeout(() => utterance.emit('start'), 80);
      window.setTimeout(() => utterance.emit('end'), 500);
    },
  };
  (window as unknown as { speechSynthesis: unknown }).speechSynthesis = synth;
  (window as unknown as { SpeechSynthesisUtterance: unknown }).SpeechSynthesisUtterance = FakeUtterance;
}

function renderDictation(preferredMode: 'choice' | 'handwrite'): void {
  render(
    <MemoryRouter>
      <DictationSession
        words={words}
        title="本课听写"
        meta="二年级上册"
        backTo="/textbook"
        backLabel="回到课本"
        mode="free"
        preferredMode={preferredMode}
        autoSpeak
        onFinish={() => {}}
      />
    </MemoryRouter>,
  );
}

const realFetch = globalThis.fetch;
// jsdom 无 ResizeObserver（TianzigePad 用它自适应画布），测试环境补个空壳。
const realResizeObserver = (globalThis as { ResizeObserver?: unknown }).ResizeObserver;

beforeEach(() => {
  installDictationSpeechMock();
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ ok: false, error: { code: 'unauthorized' } }), {
      status: 401,
    })) as typeof fetch;
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver = realResizeObserver;
  globalThis.fetch = realFetch;
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe('听写页语音降级与恢复（docs/06 §3.12 验收④）', () => {
  it('田字格写 + 无语音：降级提示与拼音同时可见，切到听音选字也有拼音', () => {
    vi.useFakeTimers();
    renderDictation('handwrite');

    act(() => {
      vi.advanceTimersByTime(2800); // 语音加载窗口走完仍是空列表
    });
    expect(screen.getByText('这台设备暂时不能朗读')).toBeInTheDocument();
    // 田字格模式下拼音不再被藏（此前只有降级文案、没有拼音，承诺落空）
    expect(screen.getByText('shí jiān')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: '听音选字' }));
    expect(screen.getByText('shí jiān')).toBeInTheDocument();
    expect(screen.getByText('这台设备暂时不能朗读')).toBeInTheDocument();
  });

  it('Android 引擎被首次点击「踢」活后，喇叭自动恢复', () => {
    vi.useFakeTimers();
    renderDictation('choice');

    act(() => {
      vi.advanceTimersByTime(2800);
    });
    expect(screen.getByText('这台设备暂时不能朗读')).toBeInTheDocument();

    // 孩子点了一下页面（pointerdown 冒泡到 document）→ 踢引擎 → 语音枚举到位
    gestureSeen = true;
    document.addEventListener('pointerdown', () => {
      gestureListenerHits += 1;
    }, true);
    act(() => {
      document.dispatchEvent(new Event('pointerdown'));
    });
    act(() => {
      vi.advanceTimersByTime(700); // kick 后 450ms 重新 getVoices
    });
    expect(screen.queryByText('这台设备暂时不能朗读')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '再听一遍' })).toBeInTheDocument();
    // 语音可用时听音选字不显示拼音（听到再选，原设计口径）
    expect(screen.queryByText('shí jiān')).not.toBeInTheDocument();
  });

  it('引擎假死：连续两次朗读失败退回拼音降级，可「再试一次」恢复喇叭', () => {
    deadEngine = true; // 入队的真实朗读永不 start（引擎挂起）
    engineKicked = true; // 语音列表已在（canSpeak 为真），但引擎发不出声
    vi.useFakeTimers();
    renderDictation('choice');

    // 第一次尝试：挂载后自动朗读 → 看门狗 + 重试后判失败（计数 1，喇叭还在）
    act(() => {
      vi.advanceTimersByTime(7000);
    });
    expect(screen.getByRole('button', { name: '再听一遍' })).toBeInTheDocument();
    expect(screen.queryByText('这台设备暂时不能朗读')).not.toBeInTheDocument();

    // 第二次尝试（手动点喇叭）仍失败 → 整页退回拼音降级
    fireEvent.click(screen.getByRole('button', { name: '再听一遍' }));
    act(() => {
      vi.advanceTimersByTime(4600);
    });
    expect(screen.getByText('这台设备暂时不能朗读')).toBeInTheDocument();
    // canSpeak 为真（语音列表在）才显示「再试一次」
    expect(screen.getByText('再试一次')).toBeInTheDocument();

    fireEvent.click(screen.getByText('再试一次'));
    expect(screen.getByRole('button', { name: '再听一遍' })).toBeInTheDocument();
    expect(screen.queryByText('再试一次')).not.toBeInTheDocument();
  });
});
