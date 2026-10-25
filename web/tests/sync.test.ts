/**
 * 钉死 v2 状态同步契约（docs/02 §5.1）：端点 /api/v1/state、PUT 推送、
 * Bearer 头按注入的访问器决定是否携带、401 时透传服务端 error.code
 * （token_expired / login_required 等）供 AppProvider 分流。
 * 本文件与 tests/auth.test.ts 是仅有的两个允许 stub globalThis.fetch
 * 的契约模块测试（docs/03 §2.4：不得 mount AppProvider、不得把 mock 塞进容器）。
 */
import { afterEach, describe, expect, it } from 'vitest';
import { createInitialState } from '../src/core/model';
import {
  SyncError,
  configureSync,
  fetchRemote,
  pushRemote,
} from '../src/core/sync';

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

function captureFetch(calls: CapturedRequest[], status = 200, payload: unknown = { ok: true, data: null, revision: 0 }): typeof fetch {
  return async (input, init) => {
    calls.push({
      url: String(input),
      method: init?.method ?? 'GET',
      headers: new Headers(init?.headers),
      body: typeof init?.body === 'string' ? init.body : undefined,
    });
    return jsonResponse(status, payload);
  };
}

afterEach(() => {
  globalThis.fetch = realFetch;
  configureSync({ getAccessToken: () => null });
});

describe('v2 同步契约（/api/v1/state）', () => {
  it('GET 拉取、PUT 推送同一端点，有 token 时注入 Bearer 头', async () => {
    configureSync({ getAccessToken: () => 'tok-abc' });
    const calls: CapturedRequest[] = [];
    globalThis.fetch = captureFetch(calls);

    await fetchRemote();
    await pushRemote(createInitialState(), 3);

    expect(calls.length, '一次拉取一次推送').toBe(2);
    expect(calls[0].url, 'v2 端点替换 Qoder 函数路径').toBe('/api/v1/state');
    expect(calls[0].method).toBe('GET');
    expect(calls[0].headers.get('authorization'), '有 token 时携带 Bearer 头').toBe(
      'Bearer tok-abc',
    );
    expect(calls[1].url).toBe('/api/v1/state');
    expect(calls[1].method, 'v2 推送改为 PUT').toBe('PUT');
    expect(calls[1].headers.get('authorization')).toBe('Bearer tok-abc');
    const body = JSON.parse(calls[1].body ?? '{}') as { baseRevision?: unknown };
    expect(body.baseRevision, '推送体保留 CAS 基线').toBe(3);
  });

  it('token 为空时不携带 authorization 头', async () => {
    configureSync({ getAccessToken: () => null });
    const calls: CapturedRequest[] = [];
    globalThis.fetch = captureFetch(calls);

    await fetchRemote();

    expect(calls.length).toBe(1);
    expect(calls[0].headers.get('authorization'), '空 token 不得注入鉴权头').toBeNull();
  });

  it('401 时透传服务端 error.code，无错误体时回退 login_required', async () => {
    configureSync({ getAccessToken: () => 'stale-token' });
    globalThis.fetch = captureFetch([], 401, {
      ok: false,
      error: { code: 'token_expired', message: 'access token 已过期' },
    });
    await expect(fetchRemote()).rejects.toBeInstanceOf(SyncError);
    await expect(fetchRemote()).rejects.toMatchObject({
      code: 'token_expired',
      status: 401,
    });

    globalThis.fetch = async () => new Response('not json', { status: 401 });
    await expect(fetchRemote()).rejects.toMatchObject({
      code: 'login_required',
      status: 401,
    });
  });
});
