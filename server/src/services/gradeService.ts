// 年级切换业务（docs/12 v1.1 / ADR-003）：封存当前年级学习切片 → 恢复目标年级存档 →
// 更新 state.grade 与指针。单写者语义：客户端在家长区触发，逐次调用走 state CAS。
import { AppError } from '../errors.js'
import type { Clock } from '../lib/clock.js'
import { isRecord } from '../lib/guards.js'
import type { Repository } from '../repos/index.js'
import { callRepo } from './repoCall.js'

export type Grade = 1 | 2 | 3 | 4 | 5 | 6
export type Semester = 's1' | 's2'

const GRADE_KEY_PATTERN = /^g[1-6]s[12]$/

export function gradeKeyOf(grade: Grade, semester: Semester): string {
  return `g${grade}${semester}`
}

export function parseGradeKey(value: string): string {
  if (!GRADE_KEY_PATTERN.test(value)) throw new AppError('invalid_body')
  return value
}

/** 学习切片：切换年级时封存/恢复的全部字段。 */
interface LearningSlice {
  lessons: unknown
  pointers: unknown
  mistakes: unknown
  weakness: unknown
  dictationQueue: unknown
}

function isNonEmptySlice(slice: LearningSlice): boolean {
  return (
    isRecord(slice.lessons) && Object.keys(slice.lessons).length > 0 ||
    Array.isArray(slice.mistakes) && slice.mistakes.length > 0 ||
    isRecord(slice.weakness) && Object.keys(slice.weakness).length > 0 ||
    isRecord(slice.dictationQueue) && Object.keys(slice.dictationQueue).length > 0
  )
}

function sliceOf(data: Record<string, unknown>): LearningSlice {
  return {
    lessons: data['lessons'] ?? {},
    pointers: data['pointers'] ?? {},
    mistakes: data['mistakes'] ?? [],
    weakness: data['weakness'] ?? {},
    dictationQueue: data['dictationQueue'] ?? {},
  }
}

function archiveSummary(slice: LearningSlice): Record<string, unknown> {
  const lessons = isRecord(slice.lessons) ? Object.keys(slice.lessons).length : 0
  const mistakes = Array.isArray(slice.mistakes) ? slice.mistakes.filter((m) => isRecord(m) && !isRecord(m) ? true : !(m as { resolvedAt?: unknown }).resolvedAt).length : 0
  return { lessons, unresolvedMistakes: mistakes, archivedAt: new Date().toISOString() }
}

export interface SwitchGradeResult {
  state: Record<string, unknown>
  revision: number
  updatedAt: string
  archived: string | null
  restored: boolean
}

export interface GradeServiceDeps {
  repo: Repository
  clock: Clock
  logWarn?: (message: string, extra?: Record<string, unknown>) => void
}

export class GradeService {
  private readonly deps: GradeServiceDeps

  constructor(deps: GradeServiceDeps) {
    this.deps = deps
  }

  async listArchives(familyId: string): Promise<Array<{ gradeKey: string; summary: Record<string, unknown>; createdAt: string; snapshot: Record<string, unknown> }>> {
    const rows = await callRepo(() => this.deps.repo.gradeArchives.listByFamily(familyId))
    return rows.map((row) => ({
      gradeKey: row.gradeKey,
      summary: row.summary,
      createdAt: row.createdAt.toISOString(),
      snapshot: row.snapshot,
    }))
  }

  /**
   * 切换年级：fromKey 封存 → toKey 存档恢复（有则接续，无则全新）→ state 落库。
   * 客户端传 fromKey（它知道自己正在哪个包上）；服务端只校验格式，归档标签错误
   * 只影响归档命名，不破坏数据（快照内容始终来自服务端 state 原文）。
   */
  async switch(
    familyId: string,
    input: { grade: Grade; semester: Semester; fromKey: string },
  ): Promise<SwitchGradeResult> {
    const fromKey = parseGradeKey(input.fromKey)
    const toKey = gradeKeyOf(input.grade, input.semester)
    if (toKey === fromKey) throw new AppError('invalid_body')

    const now = this.deps.clock()
    const row = await callRepo(() => this.deps.repo.state.findByFamilyId(familyId))

    if (!row) {
      // 未上过云的设备（理论应在 onboard 后先推送再切换）：直接创建仅含年级标记的初始态。
      const created = await callRepo(() =>
        this.deps.repo.state.insertFirst({
          familyId,
          data: { schemaVersion: 1, grade: input.grade, semesterOverride: input.semester },
          now,
        }),
      )
      if (created.outcome === 'conflict') throw new AppError('revision_conflict')
      return {
        state: created.row.data,
        revision: created.row.revision,
        updatedAt: created.row.updatedAt.toISOString(),
        archived: null,
        restored: false,
      }
    }

    const data = { ...row.data }
    const slice = sliceOf(data)

    // 1) 封存当前年级（非空才存，避免垃圾空档）
    let archived: string | null = null
    if (isNonEmptySlice(slice)) {
      await callRepo(() =>
        this.deps.repo.gradeArchives.upsert({
          familyId,
          gradeKey: fromKey,
          snapshot: slice as unknown as Record<string, unknown>,
          summary: archiveSummary(slice),
          now,
        }),
      )
      archived = fromKey
    }

    // 2) 目标年级有存档 → 恢复接续（单副本语义：恢复后删除档）
    let restored = false
    const existing = await callRepo(() => this.deps.repo.gradeArchives.findByKey(familyId, toKey))
    if (existing && isRecord(existing.snapshot)) {
      const snap = existing.snapshot
      data['lessons'] = snap['lessons'] ?? {}
      data['pointers'] = snap['pointers'] ?? { chinese: 0, math: 0, english: 0 }
      data['mistakes'] = snap['mistakes'] ?? []
      data['weakness'] = snap['weakness'] ?? {}
      data['dictationQueue'] = snap['dictationQueue'] ?? {}
      restored = true
    } else {
      data['lessons'] = {}
      data['pointers'] = { chinese: 0, math: 0, english: 0 }
      data['mistakes'] = []
      data['weakness'] = {}
      data['dictationQueue'] = {}
    }
    if (restored) await callRepo(() => this.deps.repo.gradeArchives.delete(familyId, toKey))

    // 3) 年级标记写入（dates 键日志天然保留，不复位）
    data['grade'] = input.grade
    data['semesterOverride'] = input.semester
    data['updatedAt'] = now.toISOString()

    // 4) CAS 落库 + 环形历史（与手改 state 同一通道，多设备可见）
    const cas = await callRepo(() =>
      this.deps.repo.state.casUpdate({ familyId, baseRevision: row.revision, data, now }),
    )
    if (cas.outcome !== 'updated') throw new AppError('revision_conflict')
    try {
      await callRepo(() =>
        this.deps.repo.state.upsertHistorySlot({
          familyId,
          slot: cas.row.revision % 5,
          data: cas.row.data,
          revision: cas.row.revision,
          updatedAt: cas.row.updatedAt,
        }),
      )
    } catch (error) {
      this.deps.logWarn?.('grade switch history slot write failed', { error: String(error) })
    }

    return {
      state: cas.row.data,
      revision: cas.row.revision,
      updatedAt: cas.row.updatedAt.toISOString(),
      archived,
      restored,
    }
  }
}
