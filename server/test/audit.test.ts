// 审计与历史接口：GET/POST /api/v1/security-events、GET /api/v1/state/history。
// 覆盖：鉴权、空态、白名单与 detail 上限、limit 边界、405+Allow、
// refresh-reuse 内部事件可见、环形历史降序与 N=5 上限、no-store。
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildTestApp, loginUser, putState, registerUser, extractRefreshToken, refreshWith } from './helpers.js'

describe('security-events（家长区审计）', () => {
  let app: FastifyInstance
  let teardown: () => Promise<void>

  beforeAll(async () => {
    const built = await buildTestApp()
    app = built.app
    teardown = () => app.close()
  })
  afterAll(async () => {
    await teardown()
  })

  async function tokenOf(): Promise<string> {
    await registerUser(app)
    const res = await loginUser(app)
    return (res.json() as { accessToken: string }).accessToken
  }

  it('GET 未带 token → 401 unauthorized', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/security-events' })
    expect(res.statusCode).toBe(401)
    expect(res.json()).toMatchObject({ ok: false, error: { code: 'unauthorized' } })
  })

  it('POST 未带 token → 401 unauthorized', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/security-events', payload: { type: 'pin-reset' } })
    expect(res.statusCode).toBe(401)
  })

  it('空家庭 → events 为空数组，且响应 no-store', async () => {
    const token = await tokenOf()
    const res = await app.inject({ method: 'GET', url: '/api/v1/security-events', headers: { authorization: `Bearer ${token}` } })
    expect(res.statusCode).toBe(200)
    expect(res.headers['cache-control']).toBe('no-store')
    expect(res.json()).toEqual({ ok: true, events: [] })
  })

  it('POST pin-reset 带 detail → 201 回显，列表可见且 detail 注入 accountId 归因', async () => {
    const token = await tokenOf()
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/security-events',
      headers: { authorization: `Bearer ${token}` },
      payload: { type: 'pin-reset', detail: { device: 'ipad-livingroom' } },
    })
    expect(res.statusCode).toBe(201)
    const body = res.json() as { ok: boolean; event: { type: string; detail: Record<string, unknown>; createdAt: string } }
    expect(body.ok).toBe(true)
    expect(body.event.type).toBe('pin-reset')
    expect(body.event.detail).toMatchObject({ device: 'ipad-livingroom' })
    expect(typeof body.event.detail['accountId']).toBe('string')
    expect(typeof body.event.createdAt).toBe('string')

    const list = await app.inject({ method: 'GET', url: '/api/v1/security-events', headers: { authorization: `Bearer ${token}` } })
    const events = (list.json() as { events: Array<{ type: string }> }).events
    expect(events.some((event) => event.type === 'pin-reset')).toBe(true)
  })

  it('POST 白名单外 type → 400 invalid_body', async () => {
    const token = await tokenOf()
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/security-events',
      headers: { authorization: `Bearer ${token}` },
      payload: { type: 'something-else' },
    })
    expect(res.statusCode).toBe(400)
    expect(res.json()).toMatchObject({ ok: false, error: { code: 'invalid_body' } })
  })

  it('POST detail 超过 16 个键 → 400 invalid_body', async () => {
    const token = await tokenOf()
    const detail: Record<string, number> = {}
    for (let index = 0; index < 17; index += 1) detail[`k${index}`] = index
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/security-events',
      headers: { authorization: `Bearer ${token}` },
      payload: { type: 'privacy-confirm', detail },
    })
    expect(res.statusCode).toBe(400)
  })

  it('GET ?limit=1 → 只返回最新一条', async () => {
    const token = await tokenOf()
    for (const type of ['pin-reset', 'privacy-confirm']) {
      await app.inject({
        method: 'POST',
        url: '/api/v1/security-events',
        headers: { authorization: `Bearer ${token}` },
        payload: { type },
      })
    }
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/security-events?limit=1',
      headers: { authorization: `Bearer ${token}` },
    })
    const events = (res.json() as { events: Array<{ type: string }> }).events
    expect(events).toHaveLength(1)
    expect(events[0]!.type).toBe('privacy-confirm')
  })

  it('limit 越界（0 / 101）→ 400 invalid_body', async () => {
    const token = await tokenOf()
    for (const limit of [0, 101]) {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/security-events?limit=${limit}`,
        headers: { authorization: `Bearer ${token}` },
      })
      expect(res.statusCode).toBe(400)
      expect(res.json()).toMatchObject({ ok: false, error: { code: 'invalid_body' } })
    }
  })

  it('PUT /security-events → 405 + Allow: GET, POST', async () => {
    const token = await tokenOf()
    const res = await app.inject({
      method: 'PUT',
      url: '/api/v1/security-events',
      headers: { authorization: `Bearer ${token}` },
      payload: {},
    })
    expect(res.statusCode).toBe(405)
    expect(res.headers['allow']).toBe('GET, POST')
    expect(res.json()).toMatchObject({ ok: false, error: { code: 'method_not_allowed' } })
  })

  it('refresh 复用检测的内部事件出现在列表中', async () => {
    const registered = await registerUser(app, 'audit-reuse-mom')
    const stolen = extractRefreshToken(registered)
    const first = await refreshWith(app, stolen)
    expect(first.statusCode).toBe(200)
    const reuse = await refreshWith(app, stolen)
    expect(reuse.statusCode).toBe(401)
    expect(reuse.json()).toMatchObject({ error: { code: 'token_reuse_detected' } })

    const token = ((await loginUser(app, 'audit-reuse-mom')).json() as { accessToken: string }).accessToken
    const list = await app.inject({ method: 'GET', url: '/api/v1/security-events', headers: { authorization: `Bearer ${token}` } })
    const events = (list.json() as { events: Array<{ type: string }> }).events
    expect(events.some((event) => event.type === 'refresh-reuse')).toBe(true)
  })
})

describe('state/history（环形历史恢复视图）', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    const built = await buildTestApp()
    app = built.app
    await registerUser(app, 'hist-mom')
  })
  afterAll(async () => {
    await app.close()
  })

  async function freshToken(): Promise<string> {
    const res = await loginUser(app, 'hist-mom')
    return (res.json() as { accessToken: string }).accessToken
  }

  it('未带 token → 401 unauthorized', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/state/history' })
    expect(res.statusCode).toBe(401)
  })

  it('无写入 → history 为空数组，且响应 no-store', async () => {
    const token = await freshToken()
    const res = await app.inject({ method: 'GET', url: '/api/v1/state/history', headers: { authorization: `Bearer ${token}` } })
    expect(res.statusCode).toBe(200)
    expect(res.headers['cache-control']).toBe('no-store')
    expect(res.json()).toEqual({ ok: true, history: [] })
  })

  it('写入 3 版 → 3 条，按 revision 降序且 data 对应', async () => {
    const token = await freshToken()
    for (let index = 0; index < 3; index += 1) {
      const res = await putState(app, token, { schemaVersion: 1, n: index }, index)
      expect(res.statusCode).toBe(200)
    }
    const res = await app.inject({ method: 'GET', url: '/api/v1/state/history', headers: { authorization: `Bearer ${token}` } })
    const history = (res.json() as { history: Array<{ revision: number; data: { n: number } }> }).history
    expect(history.map((row) => row.revision)).toEqual([3, 2, 1])
    expect(history.map((row) => row.data.n)).toEqual([2, 1, 0])
  })

  it('写入 7 版 → 环形只保留最新 5 版（revisions 7..3）', async () => {
    const token = await freshToken()
    for (let index = 0; index < 7; index += 1) {
      await putState(app, token, { schemaVersion: 1, n: index }, index)
    }
    const res = await app.inject({ method: 'GET', url: '/api/v1/state/history', headers: { authorization: `Bearer ${token}` } })
    const history = (res.json() as { history: Array<{ revision: number }> }).history
    expect(history.map((row) => row.revision)).toEqual([7, 6, 5, 4, 3])
  })

  it('POST /state/history → 405 + Allow: GET', async () => {
    const token = await freshToken()
    const res = await app.inject({ method: 'POST', url: '/api/v1/state/history', headers: { authorization: `Bearer ${token}` }, payload: {} })
    expect(res.statusCode).toBe(405)
    expect(res.headers['allow']).toBe('GET')
    expect(res.json()).toMatchObject({ error: { code: 'method_not_allowed' } })
  })
})
