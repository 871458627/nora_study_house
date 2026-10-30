// 年级切换服务·并发安全（缺陷清单 H1 回归）：
// 旧实现「先删 toKey 存档、后 CAS」——CAS 409 时存档已被删、恢复未落库，
// 重试只能「全新开始」，进度条件性清零。修复后：CAS 成功才消费存档。
// 直接以 GradeService + MemoryRepository（包装 spy）做单元验证。
import { describe, expect, it } from 'vitest'
import { MemoryRepository } from '../src/repos/memory.js'
import type { Repository } from '../src/repos/index.js'
import { GradeService } from '../src/services/gradeService.js'
import type { Clock } from '../src/lib/clock.js'

const clock: Clock = () => new Date('2026-10-27T08:00:00Z')

const SEEDED_SLICE = {
  lessons: { 'cn-u1-l1': { status: 'reviewed', mastery: 1, attempts: 2, correct: 2 } },
  pointers: { chinese: 1, math: 0, english: 0 },
  mistakes: [{ questionId: 'q1', lessonId: 'cn-u1-l1', wrongAt: '2026-10-25' }],
  weakness: { p1: { wrong: 1, right: 1 } },
  dictationQueue: {},
}

async function makeService(options: { conflictNext?: () => boolean } = {}): Promise<{
  service: GradeService
  familyId: string
  deletedKeys: string[]
  setConflictNext: (value: boolean) => void
}> {
  const base = new MemoryRepository()
  const familyId = 'fam-h1'
  await base.state.insertFirst({
    familyId,
    data: {
      schemaVersion: 1,
      onboarded: true,
      grade: 2,
      ...SEEDED_SLICE,
    },
    now: clock(),
  })

  const deletedKeys: string[]
    = []
  let conflictNext = options.conflictNext ?? (() => false)

  // spread 会丢 this 绑定（MemoryRepository 方法依赖实例 Map），必须 bind 后再覆盖
  const boundState = Object.fromEntries(
    Object.entries(base.state).map(([k, v]) => [k, typeof v === 'function' ? (v as Function).bind(base.state) : v]),
  )
  const boundArchives = Object.fromEntries(
    Object.entries(base.gradeArchives).map(([k, v]) => [k, typeof v === 'function' ? (v as Function).bind(base.gradeArchives) : v]),
  )

  const repo = {
    ...base,
    gradeArchives: {
      ...boundArchives,
      delete: async (fid: string, gradeKey: string) => {
        deletedKeys.push(gradeKey)
        return base.gradeArchives.delete(fid, gradeKey)
      },
    },
    state: {
      ...boundState,
      casUpdate: async (input: Parameters<typeof base.state.casUpdate>[0]) => {
        try {
          if (conflictNext()) return { outcome: 'missing' } as const
          return await base.state.casUpdate(input)
        } catch (e) {
          console.log('DEBUG-CAS-ERR:', (e as Error)?.stack ?? String(e))
          throw e
        }
      },
    },
  } as unknown as Repository

  return {
    service: new GradeService({ repo, clock }),
    familyId,
    deletedKeys,
    setConflictNext: (value: boolean) => {
      conflictNext = () => value
    },
  }
}

describe('年级切换服务（缺陷清单 H1）', () => {
  it('正常切换：恢复目标存档后消费（delete 恰好一次）', async () => {
    const t = await makeService()
    // 第一次切换：封存 g2s1、g2s2 全新（无存档可恢复）
    await t.service.switch(t.familyId, { grade: 2, semester: 's2', fromKey: 'g2s1' })
    // 切回 g2s1：g2s1 有封存 → 恢复 → 消费（delete 一次）
    await t.service.switch(t.familyId, { grade: 2, semester: 's1', fromKey: 'g2s2' })
    expect(t.deletedKeys).toEqual(['g2s1'])
  })

  it('CAS 冲突时 toKey 存档不被删除（先恢复后删档）', async () => {
    const t = await makeService()
    await t.service.switch(t.familyId, { grade: 2, semester: 's2', fromKey: 'g2s1' })
    // 切回 g2s1：toKey=g2s1 有存档（restored=true），但 CAS 被强制冲突
    t.setConflictNext(true)
    await expect(
      t.service.switch(t.familyId, { grade: 2, semester: 's1', fromKey: 'g2s2' }),
    ).rejects.toMatchObject({ code: 'revision_conflict' })
    // 存档必须还在（未被先删），家长重试仍能接续
    expect(t.deletedKeys).not.toContain('g2s1')
    const list = await t.service.listArchives(t.familyId)
    expect(list.map(row => row.gradeKey)).toContain('g2s1')
  })
})
