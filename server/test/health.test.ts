// 钉死：健康检查（docs/02 §3.3）——无鉴权、DB 可达 200、DB 故障 503、不泄露内部拓扑。
import { afterEach, describe, expect, it } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { MemoryRepository } from '../src/repos/memory.js'
import { buildTestApp } from './helpers.js'

describe('health: 健康检查', () => {
  let app: FastifyInstance
  let repo: MemoryRepository

  afterEach(async () => {
    await app.close()
  })

  it('仓储可达：200 {ok:true,status:ok,db:ok}，无需鉴权', async () => {
    ;({ app, repo } = await buildTestApp())
    const res = await app.inject({ method: 'GET', url: '/api/v1/health' })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.ok).toBe(true)
    expect(body.status).toBe('ok')
    expect(body.db).toBe('ok')
  })

  it('仓储不可达：503 degraded，不泄漏故障细节', async () => {
    ;({ app, repo } = await buildTestApp())
    repo.ping = async () => {
      throw new Error('connection refused at postgres:5432')
    }
    const res = await app.inject({ method: 'GET', url: '/api/v1/health' })
    expect(res.statusCode, 'DB 故障应 503').toBe(503)
    const body = res.json()
    expect(body.status).toBe('degraded')
    expect(body.db).toBe('down')
    expect(JSON.stringify(body).includes('postgres'), '不得泄漏内部拓扑').toBe(false)
  })
})
