// 状态两接口（docs/02 §3.2，CAS 语义平移自 v1 functions/handler.mjs）。鉴权/限速：
// - GET /api/v1/state  鉴权：Bearer access token；限速：无（读侧无写放大，读频由前端 60s 定时器约束）
// - PUT /api/v1/state  鉴权：Bearer access token；限速：60 次/分钟/账号（键 = accountId）
// - 其余方法 → 405 + Allow: GET, PUT（v1 method_not_allowed 语义，docs/02 §3.2 错误码表）
// 所有响应（含错误）一律 cache-control: no-store（v1 handler.mjs:5-9 平移）。
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import { AppError } from '../errors.js'
import type { AccessTokenClaims, AccessTokenIssuer } from '../lib/jwt.js'
import type { StateService } from '../services/stateService.js'
import type { RateWindow } from './auth.js'
import { statePutSchema } from './schemas.js'

const MAX_STATE_BODY_BYTES = 256 * 1024

export type StateRouteDeps = {
  stateService: StateService
  issuer: AccessTokenIssuer
  rateLimits: { put: RateWindow }
}

function requireAuth(issuer: AccessTokenIssuer) {
  return async (request: FastifyRequest): Promise<void> => {
    const header = request.headers.authorization
    if (typeof header !== 'string' || !header.toLowerCase().startsWith('bearer ')) throw new AppError('unauthorized')
    const token = header.slice(7).trim()
    if (!token) throw new AppError('unauthorized')
    request.principal = issuer.verifyAccessToken(token)
  }
}

function mustHaveUser(request: FastifyRequest): AccessTokenClaims {
  const principal = request.principal
  if (!principal) throw new AppError('unauthorized')
  return principal
}

// v1 parseWriteBody 的信封前置校验（handler.mjs:148-163）：content-type 预检
// （415）+ content-length 预检（413）；流式体积上限由路由 bodyLimit 双保险承担。
async function enforceContentRules(request: FastifyRequest): Promise<void> {
  const contentType = (request.headers['content-type'] ?? '').split(';')[0].trim().toLowerCase()
  if (contentType !== 'application/json') throw new AppError('unsupported_media_type')
  const declared = Number(request.headers['content-length'])
  if (Number.isFinite(declared) && declared > MAX_STATE_BODY_BYTES) throw new AppError('payload_too_large')
}

async function methodNotAllowed(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
  reply.header('allow', 'GET, PUT')
  throw new AppError('method_not_allowed')
}

export const stateRoutes: FastifyPluginAsync<StateRouteDeps> = async (app, deps) => {
  const auth = requireAuth(deps.issuer)

  app.addHook('onRequest', async (_request, reply) => {
    reply.header('cache-control', 'no-store')
  })

  app.get('/state', { onRequest: [auth] }, async (request) => {
    const snapshot = await deps.stateService.get(mustHaveUser(request).fid)
    if (snapshot.data === null) return { ok: true, data: null, revision: 0 }
    return { ok: true, data: snapshot.data, revision: snapshot.revision, updatedAt: snapshot.updatedAt }
  })

  app.put(
    '/state',
    {
      onRequest: [auth],
      bodyLimit: MAX_STATE_BODY_BYTES,
      preValidation: [enforceContentRules],
      config: {
        rateLimit: {
          max: deps.rateLimits.put.max,
          timeWindow: deps.rateLimits.put.timeWindow,
          // 限速在 preHandler 阶段执行（app.ts 配置），此时 req.principal 已由 onRequest 鉴权写入。
          keyGenerator: (request: FastifyRequest) => request.principal?.sub ?? request.ip,
        },
      },
    },
    async (request) => {
      const parsed = statePutSchema.safeParse(request.body)
      if (!parsed.success) {
        request.log.debug({ issues: parsed.error.issues }, 'state body rejected')
        throw new AppError('invalid_body')
      }
      const row = await deps.stateService.put(mustHaveUser(request).fid, parsed.data)
      return { ok: true, data: row.data, revision: row.revision, updatedAt: row.updatedAt.toISOString() }
    },
  )

  app.post('/state', methodNotAllowed)
  app.delete('/state', methodNotAllowed)
  app.patch('/state', methodNotAllowed)
}
