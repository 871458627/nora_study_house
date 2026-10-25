/**
 * 钉死 src/app/auth.ts 家长账号契约（docs/02 §3.1）：register/login/refresh
 * 的请求形状与响应解析、无效凭据错误码透传、登出后的会话清理。
 * access token 只保存在内存，绝不写入任何 storage（docs/02 §5.3）。
 * 仅本契约模块与 tests/sync.test.ts 允许 stub globalThis.fetch（docs/03 §2.4）。
 */
import { afterEach, describe, expect, it } from 'vitest';
import {
  AuthError,
  clearSession,
  currentAccount,
  getAccessToken,
  login,
  logout,
  refreshSession,
} from '../src/app/auth';

interface CapturedRequest {
  url: string;
  method: string;
  headers: Headers;
  body?: string;
}

const realFetch = globalThis.fetch;

function jsonResponse(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function authOk(payload: Record<string, unknown>): Response {
  return jsonResponse(200, { ok: true, ...payload });
}

afterEach(() => {
  globalThis.fetch = realFetch;
  clearSession();
});

describe('家长账号契约（/api/v1/auth/*）', () => {
  it('login 携带 JSON 体，refresh 无请求体，token 只保存在内存', async () => {
    const calls: CapturedRequest[] = [];
    globalThis.fetch = async (input, init) => {
      calls.push({
        url: String(input),
        method: init?.method ?? 'GET',
        headers: new Headers(init?.headers),
        body: typeof init?.body === 'string' ? init.body : undefined,
      });
      // refresh 响应按契约只含 familyId + accessToken，且发放新 token。
      if (String(input) === '/api/v1/auth/refresh') {
        return authOk({ familyId: 'fam-1', accessToken: 'jwt-2' });
      }
      return authOk({
        account: { id: 'acc-1', username: 'taomom' },
        familyId: 'fam-1',
        accessToken: 'jwt-1',
      });
    };

    const session = await login('taomom', 'zht-2008-xiaotao');

    expect(calls[0].url).toBe('/api/v1/auth/login');
    expect(calls[0].method).toBe('POST');
    expect(calls[0].headers.get('content-type')).toBe('application/json');
    expect(JSON.parse(calls[0].body ?? '{}'), '请求体严格按契约').toEqual({
      username: 'taomom',
      password: 'zht-2008-xiaotao',
    });
    expect(session.familyId).toBe('fam-1');
    expect(getAccessToken(), 'access token 落内存').toBe('jwt-1');
    expect(currentAccount()?.username).toBe('taomom');

    const renewed = await refreshSession();
    expect(calls[1].url).toBe('/api/v1/auth/refresh');
    expect(calls[1].body, '静默续期无请求体').toBeUndefined();
    expect(calls[1].headers.get('content-type')).toBeNull();
    expect(renewed.familyId).toBe('fam-1');
    expect(getAccessToken(), '续期后替换内存 token').toBe('jwt-2');
  });

  it('401 透传 invalid_credentials，登出后无论成败都清理内存会话', async () => {
    globalThis.fetch = async () =>
      jsonResponse(401, {
        ok: false,
        error: { code: 'invalid_credentials', message: '用户名或密码不正确' },
      });
    await expect(login('taomom', 'wrong-pass')).rejects.toBeInstanceOf(AuthError);
    await expect(login('taomom', 'wrong-pass')).rejects.toMatchObject({
      code: 'invalid_credentials',
      status: 401,
    });
    expect(getAccessToken(), '失败登录不得留下 token').toBeNull();

    globalThis.fetch = async () =>
      authOk({
        account: { id: 'acc-1', username: 'taomom' },
        familyId: 'fam-1',
        accessToken: 'jwt-1',
      });
    await login('taomom', 'zht-2008-xiaotao');
    expect(getAccessToken()).toBe('jwt-1');

    globalThis.fetch = async () => jsonResponse(503, { ok: false });
    await logout();
    expect(getAccessToken(), '登出清理内存 token').toBeNull();
    expect(currentAccount(), '登出清理账号显示名').toBeNull();
  });
});
