// 年级切换路由（docs/12 v1.1）：
// - POST /api/v1/grade/switch   鉴权：Bearer access；体 {grade, semester, fromKey}
// - GET  /api/v1/grade-archives 鉴权：Bearer access；历史年级列表（含快照，供只读视图与导出）
// 均为家长区低频操作：限速沿用鉴权路由默认之外的独立窗口（30 次/分钟）。
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import { AppError } from '../errors.js'
import type { AccessTokenIssuer } from '../lib/jwt.js'
import { GradeService } from '../services/gradeService.js'
import { mustHaveUser, requireAuth } from './guard.js'
import { z } from 'zod'

export type GradeRouteDeps = {
  gradeService: GradeService
  issuer: AccessTokenIssuer
  rateLimits: { switch: { max: number; timeWindow: number } }
}

const switchSchema = z.object({
  grade: z.number().refine((v) => Number.isInteger(v) && v >= 1 && v <= 6),
  semester: z.enum(['s1', 's2']),
  fromKey: z.string().regex(/^g[1-6]s[12]$/),
})

export const gradeRoutes: FastifyPluginAsync<GradeRouteDeps> = async (app, deps) => {
  const auth = requireAuth(deps.issuer)

  app.addHook('onRequest', async (_request, reply) => {
    reply.header('cache-control', 'no-store')
  })

  app.post(
    '/grade/switch',
    {
      onRequest: [auth],
      bodyLimit: 4096,
      config: { rateLimit: { max: deps.rateLimits.switch.max, timeWindow: deps.rateLimits.switch.timeWindow } },
    },
    async (request) => {
      const parsed = switchSchema.safeParse(request.body)
      if (!parsed.success) {
        request.log.debug({ issues: parsed.error.issues }, 'grade switch body rejected')
        throw new AppError('invalid_body')
      }
      const principal = mustHaveUser(request)
      const body = parsed.data
      const result = await deps.gradeService.switch(principal.fid, {
        grade: body.grade as 1 | 2 | 3 | 4 | 5 | 6,
        semester: body.semester,
        fromKey: body.fromKey,
      })
      return { ok: true, ...result }
    },
  )

  app.get('/grade-archives', { onRequest: [auth], config: { rateLimit: { max: deps.rateLimits.switch.max, timeWindow: deps.rateLimits.switch.timeWindow } } }, async (request) => {
    const archives = await deps.gradeService.listArchives(mustHaveUser(request).fid)
    return { ok: true, archives }
  })

  const notAllowed = async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    reply.header('allow', 'POST')
    throw new AppError('method_not_allowed')
  }
  app.get('/grade/switch', notAllowed)
}
