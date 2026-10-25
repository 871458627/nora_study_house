import type { AccessTokenClaims } from '../lib/jwt.js'

declare module 'fastify' {
  interface FastifyRequest {
    /** 由 requireAuth 钩子写入；身份只信 token claims（docs/03 §8.4-4）。
     *  不复用 `user` 名字——@fastify/jwt 对 FastifyRequest.user 已有自带声明。 */
    principal?: AccessTokenClaims
  }
}
