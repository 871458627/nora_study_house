// @vitest-environment jsdom
/**
 * 首次绑定与学习门禁集成测试（docs/06 §3.10）：真实 AppProvider + OnboardingPage
 * + LearnGate，只 stub globalThis.fetch 驱动 auth + state 两个契约（docs/03 §2.4 白名单）。
 * 覆盖路径：
 *  1. 登录 + 云端有数据 → 直接接上（不出现昵称输入，落到设本机 PIN，canLearn=true）
 *  2. 登录 + 云端无数据 → 回到「小桃该怎么称呼你」
 *  3. 登录成功但拉取失败 → 可重试接上，也可兜底进浏览模式
 *  4. 不登录走兜底 → 浏览模式（canLearn=false，不发起任何请求）
 *  5. 未登录访问学习类路由 → LearnGate 挡下，可跳回绑定页
 */
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AppProvider, useApp } from '../src/app/AppProvider';
import { OnboardingPage } from '../src/pages/OnboardingPage';
import { LearnGate } from '../src/app/LearnGate';
import { clearSession } from '../src/app/auth';
import { createInitialState } from '../src/core/model';

const realFetch = globalThis.fetch;

function jsonResponse(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

const LOGIN_OK = {
  ok: true,
  account: { id: 'acc1', username: 'mama' },
  familyId: 'fam1',
  accessToken: 'token-1',
};

function remotePayload(withData: boolean) {
  const base = createInitialState();
  const data = withData
    ? {
        ...base,
        onboarded: true,
        profile: { nickname: '朵朵' },
        rewards: { ...base.rewards, food: 12, streak: 3 },
      }
    : null;
  return { ok: true, data, revision: withData ? 7 : 0, updatedAt: '2026-10-25T08:00:00.000Z' };
}

type StateHandler = () => Response;

/** refresh 一律 401（新设备无 cookie）；login 固定成功；/state 行为由用例注入。 */
function stubFetch(stateHandler: StateHandler): void {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    if (url.endsWith('/api/v1/auth/refresh')) {
      return jsonResponse(401, { ok: false, error: { code: 'unauthorized' } });
    }
    if (url.endsWith('/api/v1/auth/login')) {
      return jsonResponse(200, LOGIN_OK);
    }
    if (url.endsWith('/api/v1/state')) {
      return stateHandler();
    }
    return jsonResponse(404, { ok: false, error: { code: 'not_found' } });
  }) as typeof fetch;
}

function HomeProbe(): React.JSX.Element {
  const { canLearn } = useApp();
  return <div>{canLearn ? 'CAN_LEARN' : 'CANNOT_LEARN'}</div>;
}

function renderBindApp(initialEntry = '/onboarding'): void {
  render(
    <AppProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/" element={<HomeProbe />} />
          <Route path="/settings" element={<div>SETTINGS</div>} />
          <Route
            path="/task/:taskId"
            element={
              <LearnGate>
                <div>SECRET_TASK</div>
              </LearnGate>
            }
          />
        </Routes>
      </MemoryRouter>
    </AppProvider>,
  );
}

async function submitLogin(): Promise<void> {
  fireEvent.change(screen.getByLabelText('用户名'), { target: { value: 'mama' } });
  fireEvent.change(screen.getByLabelText('密码'), { target: { value: 'password8' } });
  fireEvent.click(screen.getByRole('button', { name: '登录并接上进度' }));
}

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});

afterEach(() => {
  globalThis.fetch = realFetch;
  clearSession();
  cleanup();
});

describe('首次绑定流程（docs/06 §3.10）', () => {
  it('登录且云端有数据：直接接上进度，不出现昵称输入，登录态解锁学习', async () => {
    let stateCalls = 0;
    stubFetch(() => {
      stateCalls += 1;
      return jsonResponse(200, remotePayload(true));
    });

    renderBindApp();

    await screen.findByRole('heading', { name: '登录家长账号' });
    await submitLogin();

    await screen.findByRole('heading', { name: '设置本机家长 PIN' });
    expect(screen.queryByText('小桃该怎么称呼你？')).not.toBeInTheDocument();
    expect(screen.getByText(/欢迎回来，朵朵/)).toBeInTheDocument();
    expect(stateCalls).toBe(1);
  });

  it('登录但云端无数据：回到「小桃该怎么称呼你」', async () => {
    stubFetch(() => jsonResponse(200, remotePayload(false)));

    renderBindApp();

    await screen.findByRole('heading', { name: '登录家长账号' });
    await submitLogin();

    await screen.findByRole('heading', { name: '小桃该怎么称呼你？' });
  });

  it('拉取失败：可重试接上，不卡死在中间态', async () => {
    let stateFail = true;
    stubFetch(() => {
      if (stateFail) throw new TypeError('network down');
      return jsonResponse(200, remotePayload(true));
    });

    renderBindApp();

    await screen.findByRole('heading', { name: '登录家长账号' });
    await submitLogin();

    await screen.findByRole('heading', { name: '登录成功，进度还没取回来' });
    fireEvent.click(screen.getByRole('button', { name: '重试取回进度' }));
    await waitFor(() => {
      expect(screen.getByText('还是没有取回来，请稍后再试，或先随便逛逛。')).toBeInTheDocument();
    });

    stateFail = false;
    fireEvent.click(screen.getByRole('button', { name: '重试取回进度' }));
    await screen.findByRole('heading', { name: '设置本机家长 PIN' });
    expect(screen.queryByText('小桃该怎么称呼你？')).not.toBeInTheDocument();
  });

  it('拉取失败：兜底「先逛逛」进浏览模式，学习仍锁死', async () => {
    stubFetch(() => {
      throw new TypeError('network down');
    });

    renderBindApp();

    await screen.findByRole('heading', { name: '登录家长账号' });
    await submitLogin();

    await screen.findByRole('heading', { name: '登录成功，进度还没取回来' });
    fireEvent.click(screen.getByRole('button', { name: '暂不登录，先逛逛' }));
    expect(await screen.findByText('CANNOT_LEARN')).toBeInTheDocument();
  });

  it('不登录走兜底：直接进浏览模式，不发起任何请求', async () => {
    let requested = 0;
    stubFetch(() => {
      requested += 1;
      return jsonResponse(200, remotePayload(true));
    });

    renderBindApp();

    await screen.findByRole('heading', { name: '登录家长账号' });
    const before = requested;
    fireEvent.click(screen.getByRole('button', { name: '暂不登录，先逛逛' }));

    expect(await screen.findByText('CANNOT_LEARN')).toBeInTheDocument();
    expect(requested).toBe(before);
  });
});

describe('学习门禁 LearnGate（docs/06 §3.10）', () => {
  it('未登录访问学习路由：内容被挡下，可跳回绑定页', async () => {
    stubFetch(() => jsonResponse(200, remotePayload(true)));

    renderBindApp('/task/t1');

    await screen.findByText('家长登录后，才能开始学习。');
    expect(screen.queryByText('SECRET_TASK')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '去家长绑定' }));
    await screen.findByRole('heading', { name: '登录家长账号' });
  });

  it('未登录学习门禁：也可选择继续浏览', async () => {
    stubFetch(() => jsonResponse(200, remotePayload(true)));

    renderBindApp('/task/t1');

    await screen.findByText('家长登录后，才能开始学习。');
    fireEvent.click(screen.getByRole('button', { name: '继续随便看看' }));
    expect(await screen.findByText('CANNOT_LEARN')).toBeInTheDocument();
  });

  it('已初始化设备登录过期（S7）：学习同样锁死，去登录跳设置页（2026-10-27 终审口径）', async () => {
    stubFetch(() => jsonResponse(200, remotePayload(true)));
    // 本机已有已初始化缓存（含 PIN 态），但没有家长账号——模拟登录过期/未登录的旧设备
    window.localStorage.setItem(
      'xiaotao-sync-cache-v2',
      JSON.stringify({ ...createInitialState(), onboarded: true, profile: { nickname: '朵朵' } }),
    );
    window.localStorage.setItem(
      'xiaotao-device-v2',
      JSON.stringify({
        version: 2,
        pinHash: 'x',
        pinSalt: 'x',
        failures: { count: 0 },
        revision: 3,
        dirty: false,
        visitor: false,
      }),
    );

    renderBindApp('/task/t1');

    await screen.findByText('家长登录后，才能开始学习。');
    expect(screen.queryByText('SECRET_TASK')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '去登录' }));
    expect(await screen.findByText('SETTINGS')).toBeInTheDocument();
  });
});
