// 注册限速走 @fastify/rate-limit（preHandler），触发后必须仍是 429 + 统一错误体
// （线上曾回归为 500：errorResponseBuilder 的响应体被 setErrorHandler 重新包装）。
import { describe, expect, it } from 'vitest'
import { buildTestApp, registerUser } from './helpers.js'

describe('register 限速错误映射（回归）', () => {
  it('第 4 次注册（默认 3/小时）→ 429 rate_limited 而非 500', async () => {
    const { app } = await buildTestApp({ rateLimits: { register: { max: 3, timeWindow: 60_000 } } })
    try {
      for (let index = 0; index < 3; index += 1) {
        const res = await registerUser(app, `rl-${index}`)
        expect(res.statusCode).toBe(201)
      }
      const fourth = await registerUser(app, 'rl-over')
      expect(fourth.statusCode).toBe(429)
      expect(fourth.json()).toMatchObject({ ok: false, error: { code: 'rate_limited' } })
    } finally {
      await app.close()
    }
  })
})
