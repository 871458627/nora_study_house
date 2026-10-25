// 状态 CAS 同步业务规则（docs/02 §3.2）：语义逐条平移自 v1 functions/handler.mjs
// （无行冲突/惰性首写 revision=1/原子条件更新/409 附云端最新/环形历史吞错）。
// 服务端只校验信封，不复制前端 SyncState 结构知识（设计硬约束 ④）；
// 唯一例外是 RISK-01 防线的 archive 存在性检查（docs/02 §6.4）。
import { AppError, StateConflictError } from '../errors.js'
import type { Clock } from '../lib/clock.js'
import { isRecord } from '../lib/guards.js'
import type { Repository, StateRecord } from '../repos/index.js'
import { callRepo } from './repoCall.js'

// 交付口径：环形历史 N=5（写 7 次仅存 5 版）；docs/02 §4.1 的 10 槽为建议值，
// 若采纳只需改此常量（槽位 = revision % N）。
export const HISTORY_SLOTS = 5

export interface StateSnapshot {
  data: Record<string, unknown> | null
  revision: number
  updatedAt?: string
}

export interface PutStateInput {
  data: Record<string, unknown>
  baseRevision: number
}

function hasNonEmptyArchive(data: Record<string, unknown>): boolean {
  const archive = data['archive']
  return isRecord(archive) && Object.keys(archive).length > 0
}

function toRemote(row: StateRecord): { data: Record<string, unknown>; revision: number; updatedAt: string } {
  return { data: row.data, revision: row.revision, updatedAt: row.updatedAt.toISOString() }
}

export interface StateServiceDeps {
  repo: Repository
  clock: Clock
  logWarn?: (message: string, extra?: Record<string, unknown>) => void
}

export class StateService {
  private readonly deps: StateServiceDeps

  constructor(deps: StateServiceDeps) {
    this.deps = deps
  }

  async get(familyId: string): Promise<StateSnapshot> {
    const row = await callRepo(() => this.deps.repo.state.findByFamilyId(familyId))
    if (!row) return { data: null, revision: 0 }
    return { data: row.data, revision: row.revision, updatedAt: row.updatedAt.toISOString() }
  }

  async put(familyId: string, input: PutStateInput): Promise<StateRecord> {
    const now = this.deps.clock()
    const current = await callRepo(() => this.deps.repo.state.findByFamilyId(familyId))

    if (!current) {
      // 无行：baseRevision≠0 → 409 附 {data:null, revision:0}；=0 → 惰性插入 revision=1
      // （v1 handler.mjs:219-225）。
      if (input.baseRevision !== 0) throw new StateConflictError({ data: null, revision: 0 })
      const inserted = await callRepo(() => this.deps.repo.state.insertFirst({ familyId, data: input.data, now }))
      if (inserted.outcome === 'inserted') {
        await this.writeHistory(inserted.row)
        return inserted.row
      }
      // 插入撞唯一键（并发抢先）→ 以抢先者为云端最新返回 409。
      throw new StateConflictError(toRemote(inserted.row))
    }

    // RISK-01 服务端防线（docs/02 §3.2 校验链第 6 条）：云端有非空 archive 而请求
    // 缺失该字段 → 显式失败，防旧客户端静默抹档。仅检查「缺失」，显式覆盖不拦。
    if (hasNonEmptyArchive(current.data) && !('archive' in input.data)) throw new AppError('archive_wiped')

    if (current.revision !== input.baseRevision) throw new StateConflictError(toRemote(current))

    const cas = await callRepo(() =>
      this.deps.repo.state.casUpdate({ familyId, baseRevision: input.baseRevision, data: input.data, now }),
    )
    if (cas.outcome === 'updated') {
      await this.writeHistory(cas.row)
      return cas.row
    }
    // 条件更新未命中 → 重读最新再决断（v1 handler.mjs:239-241）。
    const latest = await callRepo(() => this.deps.repo.state.findByFamilyId(familyId))
    if (!latest) throw new AppError('database_request_failed')
    throw new StateConflictError(toRemote(latest))
  }

  private async writeHistory(row: StateRecord): Promise<void> {
    try {
      await this.deps.repo.state.upsertHistorySlot({
        familyId: row.familyId,
        slot: row.revision % HISTORY_SLOTS,
        data: row.data,
        revision: row.revision,
        updatedAt: row.updatedAt,
      })
    } catch (error) {
      // 环形历史是恢复辅助，绝不能阻断主推送（docs/02 §6.3）。
      this.deps.logWarn?.('family_state_history write failed; push still succeeds', {
        familyId: row.familyId,
        revision: row.revision,
        error: String(error),
      })
    }
  }
}
