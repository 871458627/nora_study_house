// 钉死：状态两接口的 CAS 语义（docs/02 §3.2，逐条平移 v1 dev/function-test.mjs
// 的状态相关组：空态读取、首写/读回/更新/过期基线 409/零基线 409/冲突不改库、
// 非法 body 组、413/415）+ v2 新增：鉴权三态（无/篡改/过期）、archive_wiped 防线、
// 环形历史 N=5、no-store 头、仓储故障 503 无泄漏、405/404。
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { MemoryRepository } from '../src/repos/memory.js'
import {
  VALID_PASSWORD,
  buildTestApp,
  getState,
  putState,
  registerUser,
  statePayload,
} from './helpers.js'

describe('state: 鉴权与 CAS 同步', () => {
  let app: FastifyInstance
  let repo: MemoryRepository
  let accessToken: string
  let familyId: string

  beforeEach(async () => {
    ;({ app, repo } = await buildTestApp())
    const register = await registerUser(app)
    expect(register.statusCode, '用例前置：注册成功').toBe(201)
    const body = register.json()
    accessToken = body.accessToken
    familyId = body.familyId
  })

  afterEach(async () => {
    await app.close()
  })

  it('无 Authorization：401 unauthorized', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/state' })
    expect(res.statusCode, '缺 token 应 401').toBe(401)
    expect(res.json().error.code).toBe('unauthorized')
  })

  it('篡改的 access token：401 unauthorized', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/state',
      headers: { authorization: `Bearer ${accessToken}x` },
    })
    expect(res.statusCode, '签名非法应 401').toBe(401)
    expect(res.json().error.code).toBe('unauthorized')
  })

  it('过期的 access token：401 token_expired（前端据此静默续期）', async () => {
    // 时钟回拨 3 小时（> 默认 2h TTL）：注册拿到的 token 出生即过期，确定性无需等待。
    const { app: ttlApp } = await buildTestApp({ clock: () => new Date(Date.now() - 3 * 60 * 60 * 1000) })
    try {
      const register = await registerUser(ttlApp)
      const res = await getState(ttlApp, register.json().accessToken)
      expect(res.statusCode, '过期 token 应 401').toBe(401)
      expect(res.json().error.code, '过期须精确报 token_expired').toBe('token_expired')
    } finally {
      await ttlApp.close()
    }
  })

  it('空态读取：{ok:true,data:null,revision:0}，键集合恰为 data,ok,revision，且 no-store', async () => {
    const res = await getState(app, accessToken)
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.ok).toBe(true)
    expect(body.data, '无数据时 data 为 null').toBeNull()
    expect(body.revision, '无数据时 revision 为 0').toBe(0)
    expect(Object.keys(body).sort().join(','), '空态响应不得有多余键').toBe('data,ok,revision')
    expect(res.headers['cache-control'], '状态接口一律 no-store').toBe('no-store')
  })

  it('首写 baseRevision=0：revision 1，返回 data 与 updatedAt，键集合恰为四键', async () => {
    const res = await putState(app, accessToken, statePayload('小桃'), 0)
    expect(res.statusCode, '首写应 200').toBe(200)
    const body = res.json()
    expect(body.ok).toBe(true)
    expect(body.revision, '首写 revision=1').toBe(1)
    expect(body.data.profile.nickname).toBe('小桃')
    expect(typeof body.updatedAt).toBe('string')
    expect(Object.keys(body).sort().join(',')).toBe('data,ok,revision,updatedAt')
    expect(res.headers['cache-control'], '成功响应也须 no-store').toBe('no-store')
  })

  it('读回：GET 返回已存状态', async () => {
    await putState(app, accessToken, statePayload('小桃'), 0)
    const res = await getState(app, accessToken)
    expect(res.statusCode).toBe(200)
    expect(res.json().revision).toBe(1)
    expect(res.json().data.profile.nickname).toBe('小桃')
  })

  it('更新：baseRevision=1 → revision 2', async () => {
    await putState(app, accessToken, statePayload('小桃'), 0)
    const res = await putState(app, accessToken, statePayload('桃桃'), 1)
    expect(res.statusCode).toBe(200)
    expect(res.json().revision, 'CAS 成功后 revision+1').toBe(2)
    expect(res.json().data.profile.nickname).toBe('桃桃')
  })

  it('过期基线：baseRevision 落后 → 409 revision_conflict 附云端最新', async () => {
    await putState(app, accessToken, statePayload('小桃'), 0)
    await putState(app, accessToken, statePayload('桃桃'), 1)
    const res = await putState(app, accessToken, statePayload('旧设备'), 1)
    expect(res.statusCode, '基线不匹配应 409').toBe(409)
    const body = res.json()
    expect(body.ok).toBe(false)
    expect(body.error.code).toBe('revision_conflict')
    expect(body.revision, '409 须附云端最新 revision').toBe(2)
    expect(body.data.profile.nickname, '409 须附云端最新 data').toBe('桃桃')
    expect(typeof body.updatedAt).toBe('string')
    expect(res.headers['cache-control'], '错误响应同样 no-store').toBe('no-store')
  })

  it('有行时 baseRevision=0：409（零基线不可覆盖既有行）', async () => {
    await putState(app, accessToken, statePayload('小桃'), 0)
    await putState(app, accessToken, statePayload('桃桃'), 1)
    const res = await putState(app, accessToken, statePayload('另一台'), 0)
    expect(res.statusCode).toBe(409)
    expect(res.json().revision).toBe(2)
  })

  it('冲突写入不改变云端存储', async () => {
    await putState(app, accessToken, statePayload('小桃'), 0)
    await putState(app, accessToken, statePayload('桃桃'), 1)
    await putState(app, accessToken, statePayload('旧设备'), 1)
    await putState(app, accessToken, statePayload('另一台'), 0)
    const res = await getState(app, accessToken)
    expect(res.json().revision, '存储 revision 不变').toBe(2)
    expect(res.json().data.profile.nickname, '存储 data 不变').toBe('桃桃')
  })

  it('无行且 baseRevision≠0：409 附 {data:null,revision:0}，且无 updatedAt 键', async () => {
    const res = await putState(app, accessToken, statePayload('小桃'), 1)
    expect(res.statusCode, '无行 + 非零基线应 409').toBe(409)
    const body = res.json()
    expect(body.error.code).toBe('revision_conflict')
    expect(body.data).toBeNull()
    expect(body.revision).toBe(0)
    expect('updatedAt' in body, '无行冲突不带 updatedAt').toBe(false)
  })

  it('请求体超过 256KB：413 payload_too_large', async () => {
    const payload = JSON.stringify({ data: { schemaVersion: 1, pad: 'x'.repeat(280 * 1024) }, baseRevision: 0 })
    const res = await app.inject({
      method: 'PUT',
      url: '/api/v1/state',
      headers: { authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' },
      payload,
    })
    expect(res.statusCode, '超 256KB 应 413').toBe(413)
    expect(res.json().error.code).toBe('payload_too_large')
  })

  it('content-type 非 application/json：415 unsupported_media_type', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/v1/state',
      headers: { authorization: `Bearer ${accessToken}`, 'content-type': 'text/plain' },
      payload: JSON.stringify({ data: statePayload('小桃'), baseRevision: 0 }),
    })
    expect(res.statusCode, '非 JSON content-type 应 415').toBe(415)
    expect(res.json().error.code).toBe('unsupported_media_type')
  })

  it('data.schemaVersion ≠ 1：400 invalid_body', async () => {
    const res = await putState(app, accessToken, { schemaVersion: 2 }, 0)
    expect(res.statusCode, 'schemaVersion 必须恰为 1').toBe(400)
    expect(res.json().error.code).toBe('invalid_body')
  })

  it('缺 data 字段：400 invalid_body', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/v1/state',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { baseRevision: 0 },
    })
    expect(res.statusCode, '缺 data 应 400').toBe(400)
    expect(res.json().error.code).toBe('invalid_body')
  })

  it('畸形 JSON：400 invalid_body', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/v1/state',
      headers: { authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' },
      payload: '{',
    })
    expect(res.statusCode, '非法 JSON 应 400').toBe(400)
    expect(res.json().error.code).toBe('invalid_body')
  })

  it.each([-1, 1.5, '1', null])('非法 baseRevision %p：400 invalid_body', async (baseRevision) => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/v1/state',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { data: statePayload('小桃'), baseRevision },
    })
    expect(res.statusCode, `baseRevision=${String(baseRevision)} 应 400`).toBe(400)
    expect(res.json().error.code).toBe('invalid_body')
  })

  it('环形历史：连续写 7 次仅保留最近 5 版（查仓储）', async () => {
    for (let revision = 1; revision <= 7; revision += 1) {
      const res = await putState(app, accessToken, statePayload(`第${revision}版`), revision - 1)
      expect(res.statusCode, `第 ${revision} 次写入应成功`).toBe(200)
    }
    const history = await repo.state.listHistory(familyId)
    expect(history.length, '环形槽位 N=5，只存最近 5 版').toBe(5)
    expect(
      history.map((row) => row.revision),
      '保留的是 revision 3..7',
    ).toEqual([7, 6, 5, 4, 3])
    const current = await getState(app, accessToken)
    expect(current.json().revision, '主行不受环形历史影响').toBe(7)
  })

  it('archive_wiped 防线：云端有非空 archive 而请求缺失该字段 → 400 且云端不变', async () => {
    const withArchive = { ...statePayload('小桃'), archive: { days: ['2026-10-01'] } }
    await putState(app, accessToken, withArchive, 0)
    const res = await putState(app, accessToken, statePayload('旧客户端'), 1)
    expect(res.statusCode, '静默抹档必须显式失败（RISK-01 防线）').toBe(400)
    expect(res.json().error.code).toBe('archive_wiped')
    const after = await getState(app, accessToken)
    expect(after.json().revision, '云端 revision 不变').toBe(1)
    expect(after.json().data.archive, '云端 archive 完好').toEqual({ days: ['2026-10-01'] })
  })

  it('仓储故障：503 database_request_failed 且无内部细节泄漏', async () => {
    repo.state.findByFamilyId = async () => {
      throw new Error('boom: internal driver detail')
    }
    const res = await getState(app, accessToken)
    expect(res.statusCode, '仓储故障应安全降级 503').toBe(503)
    const body = res.json()
    expect(body.ok).toBe(false)
    expect(body.error.code).toBe('database_request_failed')
    expect(JSON.stringify(body).includes('boom'), '不得泄漏内部错误细节').toBe(false)
    expect(body.error.message, 'message 为固定中文短句').toBe('服务暂时不可用，请稍后重试')
  })

  it('非 GET/PUT 方法：405 method_not_allowed 且带 Allow: GET, PUT', async () => {
    const res = await app.inject({ method: 'DELETE', url: '/api/v1/state', headers: { authorization: `Bearer ${accessToken}` } })
    expect(res.statusCode, '方法不匹配应 405').toBe(405)
    expect(res.json().error.code).toBe('method_not_allowed')
    expect(res.headers.allow, '须声明 Allow 头').toBe('GET, PUT')
  })

  it('未知路径：404 not_found（统一错误体）', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/nope' })
    expect(res.statusCode).toBe(404)
    expect(res.json().error.code).toBe('not_found')
  })

  it('每个家庭的 state 互相隔离（familyId 只信 token claims）', async () => {
    const other = await registerUser(app, 'othermom', VALID_PASSWORD)
    const otherToken = other.json().accessToken
    await putState(app, accessToken, statePayload('小桃'), 0)
    const otherRead = await getState(app, otherToken)
    expect(otherRead.statusCode).toBe(200)
    expect(otherRead.json().data, '他人家庭读到自己的空态').toBeNull()
    expect(otherRead.json().revision).toBe(0)
  })
})
