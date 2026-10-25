// 健康检查（docs/02 §3.3）。
// GET /api/v1/health  鉴权：无（原因：Docker healthcheck / nginx 探活）；限速：无（无敏感数据、无后端放大）。
// 不泄露内部拓扑（无连接串、无表名）。
import type { FastifyPluginAsync } from 'fastify'
import type { Repository } from '../repos/index.js'

export type HealthRouteDeps = {
  repo: Repository
  version: string
}

export const healthRoutes: FastifyPluginAsync<HealthRouteDeps> = async (app, deps) => {
  app.get('/health', async (_request, reply) => {
    reply.header('cache-control', 'no-store')
    try {
      await deps.repo.ping()
      return { ok: true, status: 'ok', db: 'ok', version: deps.version }
    } catch {
      return await reply.code(503).send({ ok: false, status: 'degraded', db: 'down' })
    }
  })
}
