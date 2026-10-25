// 同源静态托管（docs/08）：SPA 兜底、资源缓存头、API 命名空间保持 JSON 404、未配置时行为不变。
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { FastifyInstance } from 'fastify'
import { buildTestApp } from './helpers.js'

const INDEX_MARKER = '<title>xiaotao-fixture</title>'

describe('静态托管（同源部署）', () => {
  let app: FastifyInstance
  let fixtureDir: string
  let plainApp: FastifyInstance

  beforeAll(async () => {
    fixtureDir = mkdtempSync(join(tmpdir(), 'xiaotao-dist-'))
    writeFileSync(join(fixtureDir, 'index.html'), `<!doctype html><html>${INDEX_MARKER}</html>`)
    writeFileSync(join(fixtureDir, 'favicon.svg'), '<svg/>')
    writeFileSync(join(fixtureDir, 'manifest.webmanifest'), '{}')
    mkdirSync(join(fixtureDir, 'assets'))
    writeFileSync(join(fixtureDir, 'assets', 'app-a1b2c3.js'), 'console.log(1)')

    app = (await buildTestApp({ staticDir: fixtureDir })).app
    plainApp = (await buildTestApp({ staticDir: null })).app
  })
  afterAll(async () => {
    await app.close()
    await plainApp.close()
    rmSync(fixtureDir, { recursive: true, force: true })
  })

  it('GET / → index.html，no-store', async () => {
    const res = await app.inject({ method: 'GET', url: '/' })
    expect(res.statusCode).toBe(200)
    expect(res.body).toContain(INDEX_MARKER)
    expect(res.headers['cache-control']).toBe('no-store')
  })

  it('GET /assets/app-a1b2c3.js → 一年不可变缓存', async () => {
    const res = await app.inject({ method: 'GET', url: '/assets/app-a1b2c3.js' })
    expect(res.statusCode).toBe(200)
    expect(res.headers['cache-control']).toBe('public, max-age=31536000, immutable')
  })

  it('根级文件（favicon / manifest）→ 协商缓存', async () => {
    for (const file of ['/favicon.svg', '/manifest.webmanifest']) {
      const res = await app.inject({ method: 'GET', url: file })
      expect(res.statusCode).toBe(200)
      expect(res.headers['cache-control']).toBe('no-cache')
    }
  })

  it('未知页面路径 → SPA 兜底 index.html', async () => {
    const res = await app.inject({ method: 'GET', url: '/records/some-deep/route' })
    expect(res.statusCode).toBe(200)
    expect(res.body).toContain(INDEX_MARKER)
    expect(res.headers['cache-control']).toBe('no-store')
  })

  it('未知 /api/* → 仍是 JSON 404（不被 SPA 兜底劫持）', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/definitely-not-a-route' })
    expect(res.statusCode).toBe(404)
    expect(res.json()).toMatchObject({ ok: false, error: { code: 'not_found' } })
  })

  it('API 与静态共存：/api/v1/health 正常', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/health' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ ok: true })
  })

  it('路径穿越尝试（..）→ 落回 index.html，不读仓库文件', async () => {
    const res = await app.inject({ method: 'GET', url: '/..%2F..%2Fpackage.json' })
    expect(res.statusCode).toBe(200)
    expect(res.body).toContain(INDEX_MARKER)
  })

  it('未配置 staticDir 时 GET / → JSON 404（回归保护）', async () => {
    const res = await plainApp.inject({ method: 'GET', url: '/' })
    expect(res.statusCode).toBe(404)
    expect(res.json()).toMatchObject({ ok: false, error: { code: 'not_found' } })
  })
})
