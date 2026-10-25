// @vitest-environment jsdom
/**
 * 首次绑定流程集成测试（docs/06 §3.10）：真实 AppProvider + OnboardingPage，
 * 只 stub globalThis.fetch 驱动 auth + state 两个契约（docs/03 §2.4 白名单）。
 * 覆盖四条主路径：
 *  1. 登录 + 云端有数据 → 直接接上（不出现昵称输入，落到设本机 PIN）
 *  2. 登录 + 云端无数据 → 回到「小桃该怎么称呼你」
 *  3. 登录成功但拉取失败 → 可重试接上，也可兜底离线进称呼步
 *  4. 不登录走兜底 → 直接进称呼步
 */
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AppProvider } from '../src/app/AppProvider';
import { OnboardingPage } from '../src/pages/OnboardingPage';
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
  it('登录且云端有数据：直接接上进度，不出现昵称输入', async () => {
    let stateCalls = 0;
    stubFetch(() => {
      stateCalls += 1;
      return jsonResponse(200, remotePayload(true));
    });

    render(
      <AppProvider>
        <OnboardingPage />
      </AppProvider>,
    );

    await screen.findByRole('heading', { name: '登录家长账号' });
    await submitLogin();

    await screen.findByRole('heading', { name: '设置本机家长 PIN' });
    expect(screen.queryByText('小桃该怎么称呼你？')).not.toBeInTheDocument();
    expect(screen.getByText(/欢迎回来，朵朵/)).toBeInTheDocument();
    expect(stateCalls).toBe(1);
  });

  it('登录但云端无数据：回到「小桃该怎么称呼你」', async () => {
    stubFetch(() => jsonResponse(200, remotePayload(false)));

    render(
      <AppProvider>
        <OnboardingPage />
      </AppProvider>,
    );

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

    render(
      <AppProvider>
        <OnboardingPage />
      </AppProvider>,
    );

    await screen.findByRole('heading', { name: '登录家长账号' });
    await submitLogin();

    await screen.findByRole('heading', { name: '登录成功，进度还没取回来' });
    fireEvent.click(screen.getByRole('button', { name: '重试取回进度' }));
    await waitFor(() => {
      expect(screen.getByText('还是没有取回来，请稍后再试，或先离线使用。')).toBeInTheDocument();
    });

    stateFail = false;
    fireEvent.click(screen.getByRole('button', { name: '重试取回进度' }));
    await screen.findByRole('heading', { name: '设置本机家长 PIN' });
    expect(screen.queryByText('小桃该怎么称呼你？')).not.toBeInTheDocument();
  });

  it('拉取失败：兜底「先离线使用」进称呼步', async () => {
    stubFetch(() => {
      throw new TypeError('network down');
    });

    render(
      <AppProvider>
        <OnboardingPage />
      </AppProvider>,
    );

    await screen.findByRole('heading', { name: '登录家长账号' });
    await submitLogin();

    await screen.findByRole('heading', { name: '登录成功，进度还没取回来' });
    fireEvent.click(screen.getByRole('button', { name: '暂不登录，先离线使用' }));
    await screen.findByRole('heading', { name: '小桃该怎么称呼你？' });
  });

  it('不登录走兜底：直接进称呼步，不发起任何请求', async () => {
    let requested = 0;
    stubFetch(() => {
      requested += 1;
      return jsonResponse(200, remotePayload(true));
    });

    render(
      <AppProvider>
        <OnboardingPage />
      </AppProvider>,
    );

    await screen.findByRole('heading', { name: '登录家长账号' });
    const before = requested;
    fireEvent.click(screen.getByRole('button', { name: '暂不登录，先离线使用' }));

    await screen.findByRole('heading', { name: '小桃该怎么称呼你？' });
    expect(requested).toBe(before);
  });
});
