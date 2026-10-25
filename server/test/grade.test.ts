// 年级切换端到端（docs/12 v1.1）：
// 首切封存 → 二下全新 → 切回恢复（单副本）→ 归档列表 → 鉴权与校验。
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { authHeader, buildTestApp, loginUser, putState, registerUser } from './helpers.js'

function stateWith(grade: number | undefined, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    onboarded: true,
    profile: { nickname: '果果' },
    ...(grade === undefined ? {} : { grade, semesterOverride: 's1' }),
    lessons: { 'cn-u1-l1': { status: 'reviewed', mastery: 1, attempts: 2, correct: 2 } },
    pointers: { chinese: 1, math: 0, english: 0 },
    mistakes: [{ questionId: 'cn-u1-l1-q1', lessonId: 'cn-u1-l1', wrongAt: '2026-10-25' }],
    weakness: { 'cn-u1-l1-p1': { wrong: 1, right: 1 } },
    dictationQueue: {},
    ...extra,
  }
}

async function tokenOf(app: FastifyInstance, username: string): Promise<string> {
  await registerUser(app, username)
  const res = await loginUser(app, username)
  return (res.json() as { accessToken: string }).accessToken
}

function switchGrade(app: FastifyInstance, token: string, body: Record<string, unknown>) {
  return app.inject({ method: 'POST', url: '/api/v1/grade/switch', headers: authHeader(token), payload: body })
}

describe('年级切换', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    const built = await buildTestApp()
    app = built.app
  })
  afterAll(async () => {
    await app.close()
  })

  it('未带 token → 401', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/grade/switch', payload: { grade: 2, semester: 's2', fromKey: 'g2s1' } })
    expect(res.statusCode).toBe(401)
  })

  it('非法 body（grade=9 / fromKey 格式错）→ 400', async () => {
    const token = await tokenOf(app, 'grade-bad')
    for (const body of [{ grade: 9, semester: 's2', fromKey: 'g2s1' }, { grade: 2, semester: 's2', fromKey: 'xxx' }]) {
      const res = await switchGrade(app, token, body)
      expect(res.statusCode).toBe(400)
      expect(res.json()).toMatchObject({ error: { code: 'invalid_body' } })
    }
  })

  it('同 key 切换 → 400', async () => {
    const token = await tokenOf(app, 'grade-same')
    const res = await switchGrade(app, token, { grade: 2, semester: 's1', fromKey: 'g2s1' })
    expect(res.statusCode).toBe(400)
  })

  it('端到端：二上有进度 → 切二下封存并清空 → 切回恢复 → 归档列表正确', async () => {
    const token = await tokenOf(app, 'grade-e2e')
    // 先把二上进度推上云（revision 1）
    const put = await putState(app, token, stateWith(undefined), 0)
    expect(put.statusCode).toBe(200)

    // 切到二下：封存 g2s1、清空切片、grade/semesterOverride 写入
    const sw = await switchGrade(app, token, { grade: 2, semester: 's2', fromKey: 'g2s1' })
    expect(sw.statusCode).toBe(200)
    const body = sw.json() as { ok: boolean; state: Record<string, unknown>; revision: number; archived: string | null; restored: boolean }
    expect(body.ok).toBe(true)
    expect(body.archived).toBe('g2s1')
    expect(body.restored).toBe(false)
    expect(body.state['grade']).toBe(2)
    expect(body.state['semesterOverride']).toBe('s2')
    expect(body.state['lessons']).toEqual({})
    expect(body.state['mistakes']).toEqual([])
    expect(body.revision).toBe(2)

    // 二下期间产生的进度不与其他年级混淆
    const put2 = await putState(app, token, stateWith(2, { lessons: { 'cn2-u1-l1': { status: 'mastered', mastery: 3, attempts: 3, correct: 3 } } }), body.revision)
    expect(put2.statusCode).toBe(200)

    // 切回二上：恢复存档（lessons 回来、二下切片封存进 g2s2）
    const back = await switchGrade(app, token, { grade: 2, semester: 's1', fromKey: 'g2s2' })
    expect(back.statusCode).toBe(200)
    const backBody = back.json() as { state: Record<string, unknown>; archived: string | null; restored: boolean }
    expect(backBody.restored).toBe(true)
    expect(backBody.archived).toBe('g2s2')
    const lessons = backBody.state['lessons'] as Record<string, unknown>
    expect(Object.keys(lessons)).toEqual(['cn-u1-l1'])
    expect(backBody.state['grade']).toBe(2)
    expect(backBody.state['semesterOverride']).toBe('s1')

    // 归档列表：g2s2 在档（g2s1 已恢复删除），摘要可读
    const list = await app.inject({ method: 'GET', url: '/api/v1/grade-archives', headers: authHeader(token) })
    expect(list.statusCode).toBe(200)
    const archives = (list.json() as { archives: Array<{ gradeKey: string; summary: Record<string, unknown> }> }).archives
    expect(archives).toHaveLength(1)
    expect(archives[0]!.gradeKey).toBe('g2s2')
    expect(archives[0]!.summary).toMatchObject({ lessons: 1 })
  })

  it('空进度切换：不产生归档', async () => {
    const token = await tokenOf(app, 'grade-empty')
    await putState(app, token, { schemaVersion: 1, onboarded: true, profile: { nickname: 'x' }, lessons: {}, mistakes: [], weakness: {}, dictationQueue: {} }, 0)
    const sw = await switchGrade(app, token, { grade: 3, semester: 's1', fromKey: 'g2s1' })
    expect(sw.statusCode).toBe(200)
    expect((sw.json() as { archived: string | null }).archived).toBeNull()
    const list = await app.inject({ method: 'GET', url: '/api/v1/grade-archives', headers: authHeader(token) })
    expect((list.json() as { archives: unknown[] }).archives).toHaveLength(0)
  })

  it('响应 no-store', async () => {
    const token = await tokenOf(app, 'grade-headers')
    const res = await switchGrade(app, token, { grade: 2, semester: 's2', fromKey: 'g2s1' })
    expect(res.headers['cache-control']).toBe('no-store')
  })
})
