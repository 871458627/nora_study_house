// 家长区审计事件接口（docs/02 §3.4）：
// - GET /api/v1/security-events   鉴权：Bearer access；限速：无；?limit=1..100，默认 20
// - POST /api/v1/security-events  鉴权：Bearer access；限速：10 次/分钟/账号；type 白名单 pin-reset / privacy-confirm
// 前端 P0「PIN 重置审计外显」与「隐私确认留痕」的上云通道；refresh-reuse 由服务端内部写入。
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import { AppError } from '../errors.js'
import type { AccessTokenIssuer } from '../lib/jwt.js'
import type { AuditService } from '../services/auditService.js'
import type { SecurityEventRecord } from '../repos/index.js'
import type { RateWindow } from './auth.js'
import { mustHaveUser, requireAuth } from './guard.js'
import { securityEventListQuerySchema, securityEventPostSchema } from './schemas.js'

const EVENT_BODY_LIMIT = 4096

export type SecurityEventsRouteDeps = {
  auditService: AuditService
  issuer: AccessTokenIssuer
  rateLimits: { post: RateWindow }
}

function toEventJson(event: SecurityEventRecord) {
  return { id: event.id, type: event.type, detail: event.detail, createdAt: event.createdAt.toISOString() }
}

export const securityEventsRoutes: FastifyPluginAsync<SecurityEventsRouteDeps> = async (app, deps) => {
  const auth = requireAuth(deps.issuer)

  app.addHook('onRequest', async (_request, reply) => {
    reply.header('cache-control', 'no-store')
  })

  app.get('/security-events', { onRequest: [auth] }, async (request) => {
    const parsed = securityEventListQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      request.log.debug({ issues: parsed.error.issues }, 'security-events query rejected')
      throw new AppError('invalid_body')
    }
    const events = await deps.auditService.list(mustHaveUser(request).fid, parsed.data.limit)
    return { ok: true, events: events.map(toEventJson) }
  })

  app.post(
    '/security-events',
    {
      onRequest: [auth],
      bodyLimit: EVENT_BODY_LIMIT,
      config: {
        rateLimit: {
          max: deps.rateLimits.post.max,
          timeWindow: deps.rateLimits.post.timeWindow,
          keyGenerator: (request: FastifyRequest) => request.principal?.sub ?? request.ip,
        },
      },
    },
    async (request, reply) => {
      const parsed = securityEventPostSchema.safeParse(request.body)
      if (!parsed.success) {
        request.log.debug({ issues: parsed.error.issues }, 'security-event body rejected')
        throw new AppError('invalid_body')
      }
      const principal = mustHaveUser(request)
      const event = await deps.auditService.report(principal.sub, principal.fid, {
        type: parsed.data.type,
        detail: parsed.data.detail ?? null,
      })
      return await reply.code(201).send({ ok: true, event: toEventJson(event) })
    },
  )

  const notAllowed = async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    reply.header('allow', 'GET, POST')
    throw new AppError('method_not_allowed')
  }
  app.put('/security-events', notAllowed)
  app.delete('/security-events', notAllowed)
  app.patch('/security-events', notAllowed)
}
