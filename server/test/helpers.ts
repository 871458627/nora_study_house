// 测试设施：fastify.inject + 内存仓储注入（交付约束：测试不依赖 Docker/Postgres；
// Prisma 实现只需编译成立）。JWT secret 每次运行随机生成，绝不出现在断言或日志里（红线）。
import { randomBytes } from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import { buildApp, type BuildAppOptions } from '../src/app.js'
import { MemoryRepository } from '../src/repos/memory.js'

type TestAppOptions = Omit<BuildAppOptions, 'repo'> & { repo?: MemoryRepository }

export async function buildTestApp(options: TestAppOptions = {}): Promise<{ app: FastifyInstance; repo: MemoryRepository }> {
  const repo = options.repo ?? new MemoryRepository()
  const app = await buildApp({
    ...options,
    repo,
    logger: options.logger ?? false,
    config: { jwtSecret: randomBytes(48).toString('hex'), ...options.config },
    // 默认放宽非登录限速，避免用例间相互干扰；登录限速保持真实默认（5 次/15 分钟）。
    rateLimits: {
      register: { max: 10_000, timeWindow: 60_000 },
      authCookie: { max: 10_000, timeWindow: 60_000 },
      statePut: { max: 10_000, timeWindow: 60_000 },
      ...options.rateLimits,
    },
  })
  return { app, repo }
}

export const VALID_USERNAME = 'taomom'
export const VALID_PASSWORD = 'zht-2008-xiaotao'

export function registerUser(app: FastifyInstance, username = VALID_USERNAME, password = VALID_PASSWORD) {
  return app.inject({ method: 'POST', url: '/api/v1/auth/register', payload: { username, password } })
}

export function loginUser(app: FastifyInstance, username = VALID_USERNAME, password = VALID_PASSWORD) {
  return app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { username, password } })
}

export function authHeader(accessToken: string): Record<string, string> {
  return { authorization: `Bearer ${accessToken}` }
}

export function setCookieOf(res: { headers: Record<string, unknown> }): string {
  const raw = res.headers['set-cookie']
  return Array.isArray(raw) ? raw.join('\n') : String(raw ?? '')
}

export function extractRefreshToken(res: { cookies: Array<{ name: string; value: string }> }): string {
  const cookie = res.cookies.find((entry) => entry.name === 'xiaotao_refresh')
  if (!cookie) throw new Error('响应未携带 xiaotao_refresh cookie')
  return cookie.value
}

export function refreshWith(app: FastifyInstance, token: string) {
  return app.inject({ method: 'POST', url: '/api/v1/auth/refresh', cookies: { xiaotao_refresh: token } })
}

// 最小合法 SyncState 信封：服务端只校验 schemaVersion===1，不复制前端结构知识。
export function statePayload(nickname: string): Record<string, unknown> {
  return {
    schemaVersion: 1,
    onboarded: true,
    profile: { nickname },
    settings: { dailyMinutes: 30 },
    updatedAt: '2026-10-25T08:00:00.000Z',
  }
}

export function putState(app: FastifyInstance, accessToken: string, data: unknown, baseRevision: number) {
  return app.inject({
    method: 'PUT',
    url: '/api/v1/state',
    headers: authHeader(accessToken),
    payload: { data, baseRevision },
  })
}

export function getState(app: FastifyInstance, accessToken: string) {
  return app.inject({ method: 'GET', url: '/api/v1/state', headers: authHeader(accessToken) })
}
