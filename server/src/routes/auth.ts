// 认证三接口 + 登出（docs/02 §3.1）。每个路由显式回答鉴权/限速（docs/03 §8.4-3 红线）：
// - POST /api/v1/auth/register  鉴权：无（账号尚不存在）；限速：默认 3 次/小时/IP（@fastify/rate-limit）
// - POST /api/v1/auth/login     鉴权：无；限速：5 次/15 分钟，键 = IP+用户名（AttemptLimiter，成功清零）
// - POST /api/v1/auth/refresh   鉴权：凭 httpOnly refresh cookie；限速：默认 30 次/分钟/IP
// - POST /api/v1/auth/logout    鉴权：凭 httpOnly refresh cookie；限速：默认 30 次/分钟/IP
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import { AppError } from '../errors.js'
import type { AppConfig } from '../config.js'
import type { AttemptLimiter } from '../lib/attemptLimiter.js'
import type { AuthService, CredentialsInput } from '../services/authService.js'
import { credentialsSchema } from './schemas.js'

export const REFRESH_COOKIE_NAME = 'xiaotao_refresh'
const REFRESH_COOKIE_PATH = '/api/v1/auth'
// 认证类路由 bodyLimit 4KB（docs/02 §3.2 校验链第 2 条）。
const AUTH_BODY_LIMIT = 4096

export type RateWindow = { max: number; timeWindow: number }

export type AuthRouteDeps = {
  authService: AuthService
  config: AppConfig
  loginLimiter: AttemptLimiter
  rateLimits: { register: RateWindow; authCookie: RateWindow }
}

function parseCredentials(request: FastifyRequest): CredentialsInput {
  const parsed = credentialsSchema.safeParse(request.body)
  if (!parsed.success) {
    // zod 细节只进 debug 日志，客户端只拿固定 invalid_body（docs/03 §8.2）。
    request.log.debug({ issues: parsed.error.issues }, 'auth body rejected')
    throw new AppError('invalid_body')
  }
  return parsed.data
}

export const authRoutes: FastifyPluginAsync<AuthRouteDeps> = async (app, deps) => {
  const setRefreshCookie = (reply: FastifyReply, rawToken: string): void => {
    reply.setCookie(REFRESH_COOKIE_NAME, rawToken, {
      path: REFRESH_COOKIE_PATH,
      httpOnly: true,
      secure: deps.config.cookieSecure,
      sameSite: 'strict',
      maxAge: deps.config.refreshTokenTtlSeconds,
    })
  }
  const clearRefreshCookie = (reply: FastifyReply): void => {
    reply.clearCookie(REFRESH_COOKIE_NAME, {
      path: REFRESH_COOKIE_PATH,
      httpOnly: true,
      secure: deps.config.cookieSecure,
      sameSite: 'strict',
    })
  }
  const authPayload = (result: { account: { id: string; username: string }; familyId: string; accessToken: string }) => ({
    ok: true,
    account: { id: result.account.id, username: result.account.username },
    familyId: result.familyId,
    accessToken: result.accessToken,
  })

  app.post(
    '/auth/register',
    {
      bodyLimit: AUTH_BODY_LIMIT,
      config: { rateLimit: { max: deps.rateLimits.register.max, timeWindow: deps.rateLimits.register.timeWindow } },
    },
    async (request, reply) => {
      const credentials = parseCredentials(request)
      const result = await deps.authService.register(credentials)
      setRefreshCookie(reply, result.refreshToken)
      return await reply.code(201).send(authPayload(result))
    },
  )

  app.post('/auth/login', { bodyLimit: AUTH_BODY_LIMIT }, async (request, reply) => {
    const credentials = parseCredentials(request)
    const limiterKey = `${request.ip}|${credentials.username.toLowerCase()}`
    if (deps.loginLimiter.isBlocked(limiterKey)) throw new AppError('rate_limited')
    try {
      const result = await deps.authService.login(credentials)
      deps.loginLimiter.reset(limiterKey)
      setRefreshCookie(reply, result.refreshToken)
      return await reply.code(200).send(authPayload(result))
    } catch (error) {
      if (error instanceof AppError && error.code === 'invalid_credentials') deps.loginLimiter.recordFailure(limiterKey)
      throw error
    }
  })

  app.post(
    '/auth/refresh',
    {
      bodyLimit: 64,
      config: { rateLimit: { max: deps.rateLimits.authCookie.max, timeWindow: deps.rateLimits.authCookie.timeWindow } },
    },
    async (request, reply) => {
      const raw = request.cookies[REFRESH_COOKIE_NAME]
      if (!raw) {
        clearRefreshCookie(reply)
        throw new AppError('unauthorized')
      }
      try {
        const result = await deps.authService.refresh(raw)
        setRefreshCookie(reply, result.refreshToken)
        return { ok: true, familyId: result.familyId, accessToken: result.accessToken }
      } catch (error) {
        if (error instanceof AppError && error.status === 401) clearRefreshCookie(reply)
        throw error
      }
    },
  )

  app.post(
    '/auth/logout',
    {
      bodyLimit: 64,
      config: { rateLimit: { max: deps.rateLimits.authCookie.max, timeWindow: deps.rateLimits.authCookie.timeWindow } },
    },
    async (request, reply) => {
      const raw = request.cookies[REFRESH_COOKIE_NAME]
      if (raw) await deps.authService.logout(raw)
      clearRefreshCookie(reply)
      return { ok: true }
    },
  )
}
