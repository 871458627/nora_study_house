// @vitest-environment jsdom
/**
 * 单词点读失败链路回归（「点击按钮没反应」修复，docs/06 §3.12 验收④）：
 * 1. 死语音环境（在线语音无网、引擎永不 start）：点击 → 「朗读中…」→ 2.5s 看门狗
 *    → 行内提示；再次失败 → 收起按钮退回静态模式，可「再试一次」。
 * 2. 正常语音环境：点击 → 「朗读中…」→ 播完自动恢复，看门狗不误报。
 * 3. 无效课时 id ↔ 有效 id 的路由切换不崩溃（hooks 无条件调用回归）。
 * speechSynthesis 以最小 stub 驱动：dead 模式 utterance 永不触发事件，
 * 对应 Chromium 在线语音不可达时「入队后无 start/end/error」的实测表现。
 */
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { AppProvider } from '../src/app/AppProvider';
import { LessonPage } from '../src/pages/LessonPage';

type Listener = (event?: unknown) => void;

class FakeUtterance {
  text = '';
  lang = '';
  rate = 1;
  pitch = 1;
  voice: unknown = null;
  private listeners = new Map<string, Listener[]>();

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

type SpeakMode = 'dead' | 'alive';
let speakMode: SpeakMode = 'dead';

function installSpeechMock(): void {
  const synth = {
    speaking: false,
    pending: false,
    paused: false,
    getVoices: () => [
      { name: 'Test EN', lang: 'en-US', localService: true, default: false, voiceURI: 'test-en' },
      { name: 'Test ZH', lang: 'zh-CN', localService: true, default: false, voiceURI: 'test-zh' },
    ],
    addEventListener: () => {},
    removeEventListener: () => {},
    cancel: () => {},
    speak: (utterance: FakeUtterance) => {
      if (speakMode === 'alive') {
        window.setTimeout(() => utterance.emit('start'), 100);
        window.setTimeout(() => utterance.emit('end'), 800);
      }
      // dead 模式：入队后永不触发 start/end/error（无网在线语音的挂起表现）。
    },
  };
  (window as unknown as { speechSynthesis: unknown }).speechSynthesis = synth;
  (window as unknown as { SpeechSynthesisUtterance: unknown }).SpeechSynthesisUtterance = FakeUtterance;
}

function seedOnboarded(): void {
  window.localStorage.setItem(
    'xiaotao-sync-cache-v2',
    JSON.stringify({ schemaVersion: 1, onboarded: true, profile: { callName: '小桃' } }),
  );
}

function NavProbe({ to, label }: { to: string; label: string }): React.JSX.Element {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate(to)}>
      {label}
    </button>
  );
}

function renderLesson(initialEntry: string, navTo?: string): void {
  render(
    <AppProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        {navTo ? <NavProbe to={navTo} label="去正确的课" /> : null}
        <Routes>
          <Route path="/textbook/:subject/:lessonId" element={<LessonPage />} />
        </Routes>
      </MemoryRouter>
    </AppProvider>,
  );
}

const realFetch = globalThis.fetch;

beforeEach(() => {
  speakMode = 'dead';
  installSpeechMock();
  seedOnboarded();
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ ok: false, error: { code: 'unauthorized' } }), {
      status: 401,
    })) as typeof fetch;
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  globalThis.fetch = realFetch;
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe('单词点读失败链路（docs/06 §3.12 验收④：绝无「点了没反应」）', () => {
  it('死语音环境：首次失败给行内提示，再次失败收起按钮并可「再试一次」', () => {
    vi.useFakeTimers();
    renderLesson('/textbook/english/en-u1-l1');

    expect(screen.getAllByText('听短句')).toHaveLength(6);

    // 第一次点击：立即有「朗读中」反馈，2.5s 看门狗判失败后行内提示。
    fireEvent.click(screen.getAllByText('听短句')[0]!);
    expect(screen.getAllByText('朗读中…')).toHaveLength(1);
    act(() => {
      vi.advanceTimersByTime(2600);
    });
    expect(screen.getByText('这次没能读出来，再点一下试试。')).toBeInTheDocument();
    expect(screen.queryByText('朗读中…')).not.toBeInTheDocument();

    // 同一按钮连点：新一轮的「朗读中」不得被上一轮的打断回调误清。
    fireEvent.click(screen.getAllByText('听短句')[0]!);
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.getAllByText('朗读中…')).toHaveLength(1);
    expect(screen.queryByText('这次没能读出来，再点一下试试。')).not.toBeInTheDocument();

    // 第二次失败：整段收起按钮，退回「看中文意思」的静态模式。
    act(() => {
      vi.advanceTimersByTime(2400);
    });
    expect(screen.queryByText('听短句')).not.toBeInTheDocument();
    expect(screen.queryByText('朗读中…')).not.toBeInTheDocument();
    expect(screen.getByText(/点了朗读但这台设备没有发出声音/)).toBeInTheDocument();
    expect(screen.getByText('再试一次')).toBeInTheDocument();

    // 「再试一次」恢复按钮，可以重新探测设备语音。
    fireEvent.click(screen.getByText('再试一次'));
    expect(screen.getAllByText('听短句')).toHaveLength(6);
    expect(screen.queryByText('这次没能读出来，再点一下试试。')).not.toBeInTheDocument();
    expect(screen.queryByText('再试一次')).not.toBeInTheDocument();
  });

  it('正常语音环境：朗读中有反馈，播完自动恢复且看门狗不误报', () => {
    speakMode = 'alive';
    vi.useFakeTimers();
    renderLesson('/textbook/english/en-u1-l1');

    fireEvent.click(screen.getAllByText('听短句')[0]!);
    act(() => {
      vi.advanceTimersByTime(150); // start 事件（+100ms）已触发
    });
    expect(screen.getAllByText('朗读中…')).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(800); // end 事件（+800ms）已触发
    });
    expect(screen.queryByText('朗读中…')).not.toBeInTheDocument();
    expect(screen.getAllByText('听短句')).toHaveLength(6);

    // start 已清掉看门狗：再过 3s 也不许出现失败提示。
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.queryByText('这次没能读出来，再点一下试试。')).not.toBeInTheDocument();
    expect(screen.queryByText(/没有发出声音/)).not.toBeInTheDocument();
  });

  it('无效课时 id 与有效 id 之间切换不崩溃（hooks 无条件调用回归）', () => {
    renderLesson('/textbook/english/bad-id', '/textbook/english/en-u1-l1');
    expect(screen.getByText('没有找到这一课')).toBeInTheDocument();

    fireEvent.click(screen.getByText('去正确的课'));
    expect(screen.getByText("It's Seven O'clock")).toBeInTheDocument();
    expect(screen.getAllByText('听短句')).toHaveLength(6);
  });
});
