// 钉死：账号体系对外契约（docs/02 §3.1）——注册/登录/refresh 轮换与复用检测/登出，
// 以及凭据红线：argon2id 落库（非明文）、不泄露账号存在性、限速 5 次/15 分钟（IP+用户名）、
// 成功登录清计数、复用即全量吊销。平移并改写自 v1 dev/function-test.mjs 的鉴权相关组。
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { MemoryRepository } from '../src/repos/memory.js'
import {
  VALID_PASSWORD,
  VALID_USERNAME,
  buildTestApp,
  extractRefreshToken,
  loginUser,
  refreshWith,
  registerUser,
  setCookieOf,
} from './helpers.js'

describe('auth: 注册 / 登录 / 刷新 / 登出', () => {
  let app: FastifyInstance
  let repo: MemoryRepository

  beforeEach(async () => {
    ;({ app, repo } = await buildTestApp())
  })

  afterEach(async () => {
    await app.close()
  })

  it('注册成功：201 返回 token 与账号信息，并下发 httpOnly refresh cookie', async () => {
    const res = await registerUser(app)
    expect(res.statusCode, '注册应返回 201').toBe(201)
    const body = res.json()
    expect(body.ok, '成功体应带 ok:true').toBe(true)
    expect(body.account.username, '应返回用户名').toBe(VALID_USERNAME)
    expect(typeof body.account.id, '应返回账号 id（docs/02 §3.1）').toBe('string')
    expect(typeof body.familyId, '应返回 familyId').toBe('string')
    expect(typeof body.accessToken, '应返回 accessToken').toBe('string')
    const cookie = setCookieOf(res).toLowerCase()
    expect(cookie, '应下发 xiaotao_refresh cookie').toContain('xiaotao_refresh=')
    expect(cookie, 'cookie 必须 httpOnly').toContain('httponly')
    expect(cookie, 'cookie 须限定 auth 路径').toContain('path=/api/v1/auth')
    expect(cookie, 'cookie 须 SameSite=Strict').toContain('samesite=strict')
    expect(cookie, 'cookie 须带 Secure 属性（生产红线）').toContain('secure')
  })

  it('用户名重复：409 username_taken（小写化后判重）', async () => {
    await registerUser(app, 'CaseUser')
    const res = await registerUser(app, 'caseuser')
    expect(res.statusCode, '重复用户名应 409').toBe(409)
    expect(res.json().error.code).toBe('username_taken')
  })

  it('非法用户名（<3 字符）：400 invalid_body', async () => {
    const res = await registerUser(app, 'ab', VALID_PASSWORD)
    expect(res.statusCode, '用户名 3-32 位约束').toBe(400)
    expect(res.json().error.code).toBe('invalid_body')
  })

  it('非法密码（<8 位）：400 invalid_body', async () => {
    const res = await registerUser(app, 'taomom2', 'short7')
    expect(res.statusCode, '密码至少 8 位').toBe(400)
    expect(res.json().error.code).toBe('invalid_body')
  })

  it('密码只存 argon2id 哈希，明文绝不落库', async () => {
    await registerUser(app)
    const account = await repo.accounts.findByUsername(VALID_USERNAME)
    expect(account, '账号应已创建').not.toBeNull()
    expect(account?.passwordHash.startsWith('$argon2id$'), '哈希算法必须是 argon2id').toBe(true)
    expect(account?.passwordHash.includes(VALID_PASSWORD), '哈希中不得含明文密码').toBe(false)
  })

  it('登录成功：200 返回 token 与 cookie', async () => {
    await registerUser(app)
    const res = await loginUser(app)
    expect(res.statusCode, '登录应返回 200').toBe(200)
    const body = res.json()
    expect(body.ok).toBe(true)
    expect(body.account.username).toBe(VALID_USERNAME)
    expect(typeof body.accessToken).toBe('string')
    expect(setCookieOf(res), '登录应下发 refresh cookie').toContain('xiaotao_refresh=')
  })

  it('密码错误：401 invalid_credentials', async () => {
    await registerUser(app)
    const res = await loginUser(app, VALID_USERNAME, 'wrong-password-1')
    expect(res.statusCode, '错误凭证应 401').toBe(401)
    expect(res.json().error.code).toBe('invalid_credentials')
  })

  it('用户不存在：与密码错误同码同文案（不泄露账号存在性）', async () => {
    await registerUser(app)
    const wrong = await loginUser(app, VALID_USERNAME, 'wrong-password-1')
    const unknown = await loginUser(app, 'ghost-user', 'whatever-pass')
    expect(unknown.statusCode, '未知用户也应 401').toBe(401)
    expect(unknown.json().error.code, '错误码必须一致').toBe('invalid_credentials')
    expect(unknown.json().error.message, '文案必须一致（不泄露存在性）').toBe(wrong.json().error.message)
  })

  it('登录限速：同 IP+用户名 第 6 次尝试 429 rate_limited', async () => {
    await registerUser(app, 'victim')
    for (let i = 0; i < 5; i += 1) {
      const res = await loginUser(app, 'victim', 'wrong-password-1')
      expect(res.statusCode, `第 ${i + 1} 次失败应为 401`).toBe(401)
    }
    const sixth = await loginUser(app, 'victim', VALID_PASSWORD)
    expect(sixth.statusCode, '超限后第 6 次应 429（即使密码正确）').toBe(429)
    expect(sixth.json().error.code).toBe('rate_limited')
  })

  it('成功登录清零计数：清零后再失败不受旧计数牵连', async () => {
    await registerUser(app, 'resetuser', 'good-password-99')
    for (let i = 0; i < 2; i += 1) {
      expect((await loginUser(app, 'resetuser', 'wrong-password-1')).statusCode).toBe(401)
    }
    expect((await loginUser(app, 'resetuser', 'good-password-99')).statusCode, '成功登录应放行').toBe(200)
    for (let i = 0; i < 3; i += 1) {
      const res = await loginUser(app, 'resetuser', 'wrong-password-1')
      expect(res.statusCode, `清零后第 ${i + 1} 次失败应为 401 而非 429`).toBe(401)
    }
  })

  it('refresh 轮换：新 token 对下发，被轮换的旧 token 立即失效', async () => {
    const register = await registerUser(app)
    const oldToken = extractRefreshToken(register)
    const first = await refreshWith(app, oldToken)
    expect(first.statusCode, '有效 refresh 应 200').toBe(200)
    const body = first.json()
    expect(body.ok).toBe(true)
    expect(typeof body.familyId, '应返回 familyId（docs/02 §3.1）').toBe('string')
    expect(typeof body.accessToken).toBe('string')
    const newToken = extractRefreshToken(first)
    expect(newToken !== oldToken, 'refresh 必须轮换为全新值').toBe(true)

    const replay = await refreshWith(app, oldToken)
    expect(replay.statusCode, '旧 token 复用应 401').toBe(401)
    expect(replay.json().error.code).toBe('token_reuse_detected')
  })

  it('复用检测：吊销该账号全部 refresh（第二台设备同时失效）并落审计事件', async () => {
    const register = await registerUser(app)
    const deviceOne = extractRefreshToken(register)
    const secondLogin = await loginUser(app)
    const deviceTwo = extractRefreshToken(secondLogin)

    await refreshWith(app, deviceOne) // 设备一正常轮换
    const replay = await refreshWith(app, deviceOne) // 旧值复用 → 泄漏判定
    expect(replay.statusCode).toBe(401)
    expect(replay.json().error.code).toBe('token_reuse_detected')

    const afterReuse = await refreshWith(app, deviceTwo)
    expect(afterReuse.statusCode, '该账号全部 refresh 应被吊销').toBe(401)
    // 交付语义取严：任何已吊销 token 再出现都按复用处理（token_reuse_detected），
    // 不区分「轮换吊销」与「全量吊销」两种来源。
    expect(afterReuse.json().error.code).toBe('token_reuse_detected')

    const account = await repo.accounts.findByUsername(VALID_USERNAME)
    const events = await repo.securityEvents.listByFamily(account?.familyId ?? '', 10)
    expect(events.some((event) => event.type === 'refresh-reuse'), '应写入 refresh-reuse 审计事件').toBe(true)
  })

  it('无 cookie 访问 refresh：401 unauthorized', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/auth/refresh' })
    expect(res.statusCode, '无 cookie 应 401').toBe(401)
    expect(res.json().error.code).toBe('unauthorized')
  })

  it('logout：吊销当前 refresh、清 cookie，此后该 token 不可再续期', async () => {
    const register = await registerUser(app)
    const token = extractRefreshToken(register)

    const logout = await app.inject({ method: 'POST', url: '/api/v1/auth/logout', cookies: { xiaotao_refresh: token } })
    expect(logout.statusCode, '登出应 200').toBe(200)
    expect(logout.json().ok).toBe(true)
    const cleared = setCookieOf(logout)
    expect(cleared.includes('xiaotao_refresh='), '应清空 cookie 值').toBe(true)
    expect(cleared.includes('Thu, 01 Jan 1970'), 'cookie 应立即过期').toBe(true)

    const after = await refreshWith(app, token)
    expect(after.statusCode, '登出后的 refresh 应失效').toBe(401)
    expect(after.json().error.code, '已吊销 token 再出现按复用处理（安全取严）').toBe('token_reuse_detected')
  })
})
