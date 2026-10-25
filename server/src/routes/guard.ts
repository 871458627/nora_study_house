// Bearer access 鉴权守卫：state 与 security-events 路由共用。
// principal 在 onRequest 阶段写入，preHandler 阶段的限速 keyGenerator 可读取（app.ts 配置前提）。
import type { FastifyRequest } from 'fastify'
import { AppError } from '../errors.js'
import type { AccessTokenClaims, AccessTokenIssuer } from '../lib/jwt.js'

export function requireAuth(issuer: AccessTokenIssuer) {
  return async (request: FastifyRequest): Promise<void> => {
    const header = request.headers.authorization
    if (typeof header !== 'string' || !header.toLowerCase().startsWith('bearer ')) throw new AppError('unauthorized')
    const token = header.slice(7).trim()
    if (!token) throw new AppError('unauthorized')
    request.principal = issuer.verifyAccessToken(token)
  }
}

export function mustHaveUser(request: FastifyRequest): AccessTokenClaims {
  const principal = request.principal
  if (!principal) throw new AppError('unauthorized')
  return principal
}
