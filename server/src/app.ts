// 应用组装层：唯一允许知道 fastify 插件全貌的地方（routes → services → repositories，
// docs/03 §8.1）。导出 buildApp(options) 供测试注入内存仓储与配置；
// 直接以 `tsx watch src/app.ts` / `node dist/src/app.js` 运行时启动 HTTP 服务。
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { PrismaClient } from '@prisma/client'
import cookie from '@fastify/cookie'
import jwtPlugin from '@fastify/jwt'
import rateLimitPlugin from '@fastify/rate-limit'
import Fastify, { type FastifyBaseLogger, type FastifyInstance } from 'fastify'
import pino, { type Logger } from 'pino'
import { loadConfig, type AppConfig } from './config.js'
import { AppError, ERROR_DEFINITIONS, StateConflictError, type ErrorCode } from './errors.js'
import { AttemptLimiter } from './lib/attemptLimiter.js'
import { systemClock, type Clock } from './lib/clock.js'
import type { AccessTokenClaims, AccessTokenIssuer } from './lib/jwt.js'
import type { Repository } from './repos/index.js'
import { MemoryRepository } from './repos/memory.js'
import { createPrismaRepository } from './repos/prisma.js'
import { authRoutes, type RateWindow } from './routes/auth.js'
import { healthRoutes } from './routes/health.js'
import { securityEventsRoutes } from './routes/securityEvents.js'
import { stateRoutes } from './routes/state.js'
import { AuditService } from './services/auditService.js'
import { AuthService } from './services/authService.js'
import { StateService } from './services/stateService.js'

export interface RateLimitsConfig {
  register: RateWindow
  authCookie: RateWindow
  statePut: RateWindow
  securityEventPost: RateWindow
}

export interface BuildAppOptions {
  repo?: Repository
  config?: Partial<AppConfig>
  clock?: Clock
  logger?: boolean | Logger
  rateLimits?: Partial<RateLimitsConfig>
  loginRateLimit?: { max?: number; windowMs?: number; now?: () => number }
}

// 限速红线默认值（docs/02 §2.3-1）；测试经 buildApp 注入放宽/收紧以保证确定性。
const DEFAULT_RATE_LIMITS: RateLimitsConfig = {
  register: { max: 3, timeWindow: 60 * 60 * 1000 },
  authCookie: { max: 30, timeWindow: 60 * 1000 },
  statePut: { max: 60, timeWindow: 60 * 1000 },
  securityEventPost: { max: 10, timeWindow: 60 * 1000 },
}
const DEFAULT_LOGIN_RATE_LIMIT = { max: 5, windowMs: 15 * 60 * 1000 }

// secret 红线（docs/02 §2.3-2）：authorization/cookie/set-cookie 不进日志。
const REDACT = {
  paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]', 'authorization', 'cookie', 'set-cookie'],
  censor: '[REDACTED]',
}

function isExpiredJwtError(error: unknown): boolean {
  // @fastify/jwt v8 底层是 fast-jwt：过期抛 TokenError，code=FAST_JWT_EXPIRED；
  // 其余两个标识兼容 request.jwtVerify 路径与 jsonwebtoken 形态，保持稳健。
  const name = (error as { name?: unknown }).name
  const code = (error as { code?: unknown }).code
  return code === 'FAST_JWT_EXPIRED' || name === 'TokenExpiredError' || code === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED'
}

function errorEnvelope(code: ErrorCode): { code: ErrorCode; message: string } {
  return { code, message: ERROR_DEFINITIONS[code].message }
}

function registerErrorHandling(app: FastifyInstance): void {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof StateConflictError) {
      const remote = error.remote
      reply.code(error.status).send({
        ok: false,
        error: { code: error.code, message: error.message },
        data: remote.data,
        revision: remote.revision,
        ...(remote.updatedAt === undefined ? {} : { updatedAt: remote.updatedAt }),
      })
      return
    }
    if (error instanceof AppError) {
      reply.code(error.status).send({ ok: false, error: { code: error.code, message: error.message } })
      return
    }
    // Fastify 框架错误映射为统一错误体：content-type/体积/JSON 解析等。
    const statusCode = (error as { statusCode?: unknown }).statusCode
    const frameworkCode = (error as { code?: unknown }).code
    if (frameworkCode === 'FST_ERR_CTP_INVALID_MEDIA_TYPE' || frameworkCode === 'FST_ERR_CTP_EMPTY_CONTENT_TYPE' || statusCode === 415) {
      reply.code(415).send({ ok: false, error: errorEnvelope('unsupported_media_type') })
      return
    }
    if (frameworkCode === 'FST_ERR_CTP_BODY_TOO_LARGE' || frameworkCode === 'FST_ERR_BODY_TOO_LARGE' || statusCode === 413) {
      reply.code(413).send({ ok: false, error: errorEnvelope('payload_too_large') })
      return
    }
    if (statusCode === 400) {
      reply.code(400).send({ ok: false, error: errorEnvelope('invalid_body') })
      return
    }
    request.log.error({ err: error }, 'unhandled error')
    reply.code(500).send({ ok: false, error: errorEnvelope('internal_error') })
  })

  app.setNotFoundHandler((_request, reply) => {
    reply.code(404).send({ ok: false, error: errorEnvelope('not_found') })
  })
}

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const warnings: string[] = []
  const config: AppConfig = { ...loadConfig({ warn: (message) => warnings.push(message) }), ...options.config }
  const clock: Clock = options.clock ?? systemClock
  const logger: boolean | FastifyBaseLogger = options.logger ?? pino({ level: config.logLevel, redact: REDACT })

  const app = Fastify({ logger })

  // 错误/404 处理器必须在任何 `await app.register` 之前挂到根上下文：
  // await 之后再 set 会落入 avvio 的隐式兄弟插件作用域，路由永远看不到。
  registerErrorHandling(app)

  let repo: Repository
  if (options.repo) {
    repo = options.repo
  } else if (config.databaseUrl) {
    repo = createPrismaRepository(new PrismaClient({ datasources: { db: { url: config.databaseUrl } } }))
  } else {
    warnings.push('DATABASE_URL 未配置，使用内存仓储（数据不持久，仅限本地开发）')
    repo = new MemoryRepository()
  }

  await app.register(cookie)
  await app.register(jwtPlugin, { secret: config.jwtSecret })
  // global:false——仅对显式声明 config.rateLimit 的路由生效；hook:'preHandler' 使
  // PUT /state 的 keyGenerator 能读到 onRequest 鉴权写入的 req.user（按账号限速）。
  await app.register(rateLimitPlugin, {
    global: false,
    hook: 'preHandler',
    errorResponseBuilder: () => ({ ok: false, error: errorEnvelope('rate_limited') }),
  })

  const issuer: AccessTokenIssuer = {
    // iat/exp 从注入时钟计算（docs/03 §8.4-5「时间一律注入」）：测试固定时钟即可
    // 确定性构造已过期/未过期 token，无需真实等待。
    signAccessToken: (accountId, familyId) => {
      const iat = Math.floor(clock().getTime() / 1000)
      return app.jwt.sign({ sub: accountId, fid: familyId, typ: 'access', iat, exp: iat + config.accessTokenTtlSeconds })
    },
    verifyAccessToken: (token) => {
      let claims: AccessTokenClaims
      try {
        claims = app.jwt.verify<AccessTokenClaims>(token)
      } catch (error) {
        if (isExpiredJwtError(error)) throw new AppError('token_expired')
        throw new AppError('unauthorized')
      }
      if (claims.typ !== 'access') throw new AppError('unauthorized')
      return claims
    },
  }

  const authService = new AuthService({ repo, issuer, clock, refreshTokenTtlSeconds: config.refreshTokenTtlSeconds })
  const auditService = new AuditService({ repo, clock })
  const stateService = new StateService({
    repo,
    clock,
    logWarn: (message, extra) => {
      app.log.warn(extra ?? {}, message)
    },
  })
  const loginLimiter = new AttemptLimiter({
    max: options.loginRateLimit?.max ?? DEFAULT_LOGIN_RATE_LIMIT.max,
    windowMs: options.loginRateLimit?.windowMs ?? DEFAULT_LOGIN_RATE_LIMIT.windowMs,
    now: options.loginRateLimit?.now,
  })
  const rateLimits: RateLimitsConfig = { ...DEFAULT_RATE_LIMITS, ...options.rateLimits }

  await app.register(authRoutes, {
    prefix: '/api/v1',
    authService,
    config,
    loginLimiter,
    rateLimits: { register: rateLimits.register, authCookie: rateLimits.authCookie },
  })
  await app.register(stateRoutes, { prefix: '/api/v1', stateService, issuer, rateLimits: { put: rateLimits.statePut } })
  await app.register(securityEventsRoutes, {
    prefix: '/api/v1',
    auditService,
    issuer,
    rateLimits: { post: rateLimits.securityEventPost },
  })
  await app.register(healthRoutes, { prefix: '/api/v1', repo, version: config.appVersion })

  await app.ready()
  for (const warning of warnings) app.log.warn(warning)
  return app
}

const isMainModule = ((): boolean => {
  const entry = process.argv[1]
  if (!entry) return false
  try {
    return import.meta.url === pathToFileURL(path.resolve(entry)).href
  } catch {
    return false
  }
})()

async function runServer(): Promise<void> {
  const config = loadConfig()
  const app = await buildApp({ config })
  const shutdown = (signal: string): void => {
    app.log.warn({ signal }, 'shutting down')
    void app.close().finally(() => process.exit(0))
  }
  process.once('SIGINT', () => shutdown('SIGINT'))
  process.once('SIGTERM', () => shutdown('SIGTERM'))
  await app.listen({ port: config.port, host: config.host })
}

if (isMainModule) void runServer()
