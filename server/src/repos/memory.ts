// 内存仓储：单进程原子（JS 单线程，Map 操作即原子），供测试注入与本地 dev 无库兜底。
// 行为语义与 prisma.ts 一一对应；测试不依赖 Docker/Postgres（交付约束）。
import { randomUUID } from 'node:crypto'
import { AppError } from '../errors.js'
import type {
  AccountRecord,
  CasUpdateResult,
  GradeArchiveRecord,
  HistoryRecord,
  InsertFirstResult,
  RefreshTokenRecord,
  Repository,
  SecurityEventRecord,
  StateRecord,
} from './index.js'

export class MemoryRepository implements Repository {
  private readonly accountsByUsername = new Map<string, AccountRecord>()
  private readonly accountsById = new Map<string, AccountRecord>()
  private readonly refreshTokensById = new Map<string, RefreshTokenRecord>()
  private readonly refreshTokenIdByHash = new Map<string, string>()
  private readonly stateByFamilyId = new Map<string, StateRecord>()
  private readonly historyByFamilySlot = new Map<string, HistoryRecord>()
  private readonly gradeArchiveMap = new Map<string, GradeArchiveRecord>()
  private readonly securityEventLog: SecurityEventRecord[] = []
  /** 插入序号：createdAt 同毫秒时的确定性次级排序（测试可重复性的基础设施保障）。 */
  private readonly securityEventSeq = new Map<string, number>()
  private securityEventCounter = 0

  async ping(): Promise<void> {
    /* memory store is always reachable */
  }

  readonly accounts = {
    createWithFamily: async (input: { username: string; passwordHash: string; now: Date }): Promise<AccountRecord> => {
      if (this.accountsByUsername.has(input.username)) throw new AppError('username_taken')
      const familyId = randomUUID()
      const account: AccountRecord = {
        id: randomUUID(),
        username: input.username,
        passwordHash: input.passwordHash,
        familyId,
        createdAt: input.now,
      }
      this.accountsByUsername.set(account.username, account)
      this.accountsById.set(account.id, account)
      return account
    },
    findByUsername: async (username: string): Promise<AccountRecord | null> => this.accountsByUsername.get(username) ?? null,
    findById: async (id: string): Promise<AccountRecord | null> => this.accountsById.get(id) ?? null,
  }

  readonly refreshTokens = {
    create: async (input: { accountId: string; tokenHash: string; expiresAt: Date; now: Date }): Promise<RefreshTokenRecord> => {
      const record: RefreshTokenRecord = {
        id: randomUUID(),
        accountId: input.accountId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        revokedAt: null,
        createdAt: input.now,
      }
      this.refreshTokensById.set(record.id, record)
      this.refreshTokenIdByHash.set(record.tokenHash, record.id)
      return record
    },
    findByTokenHash: async (tokenHash: string): Promise<RefreshTokenRecord | null> => {
      const id = this.refreshTokenIdByHash.get(tokenHash)
      if (id === undefined) return null
      return this.refreshTokensById.get(id) ?? null
    },
    revokeIfActive: async (id: string, at: Date): Promise<boolean> => {
      const record = this.refreshTokensById.get(id)
      if (!record || record.revokedAt !== null) return false
      record.revokedAt = at
      return true
    },
    revokeAllForAccount: async (accountId: string, at: Date): Promise<number> => {
      let count = 0
      for (const record of this.refreshTokensById.values()) {
        if (record.accountId === accountId && record.revokedAt === null) {
          record.revokedAt = at
          count += 1
        }
      }
      return count
    },
    deleteExpiredBefore: async (cutoff: Date): Promise<number> => {
      let count = 0
      for (const [id, record] of this.refreshTokensById) {
        if (record.expiresAt.getTime() < cutoff.getTime()) {
          this.refreshTokensById.delete(id)
          this.refreshTokenIdByHash.delete(record.tokenHash)
          count += 1
        }
      }
      return count
    },
  }

  readonly state = {
    findByFamilyId: async (familyId: string): Promise<StateRecord | null> => this.stateByFamilyId.get(familyId) ?? null,
    insertFirst: async (input: { familyId: string; data: Record<string, unknown>; now: Date }): Promise<InsertFirstResult> => {
      const existing = this.stateByFamilyId.get(input.familyId)
      if (existing) return { outcome: 'conflict', row: existing }
      const row: StateRecord = { familyId: input.familyId, data: input.data, revision: 1, updatedAt: input.now }
      this.stateByFamilyId.set(input.familyId, row)
      return { outcome: 'inserted', row }
    },
    casUpdate: async (input: { familyId: string; baseRevision: number; data: Record<string, unknown>; now: Date }): Promise<CasUpdateResult> => {
      const current = this.stateByFamilyId.get(input.familyId)
      if (!current || current.revision !== input.baseRevision) return { outcome: 'missing' }
      current.data = input.data
      current.revision = input.baseRevision + 1
      current.updatedAt = input.now
      return { outcome: 'updated', row: current }
    },
    upsertHistorySlot: async (input: { familyId: string; slot: number; data: Record<string, unknown>; revision: number; updatedAt: Date }): Promise<void> => {
      this.historyByFamilySlot.set(`${input.familyId}:${input.slot}`, {
        familyId: input.familyId,
        slot: input.slot,
        data: input.data,
        revision: input.revision,
        updatedAt: input.updatedAt,
      })
    },
    listHistory: async (familyId: string): Promise<HistoryRecord[]> =>
      [...this.historyByFamilySlot.values()].filter((row) => row.familyId === familyId).sort((a, b) => b.revision - a.revision),
  }

  readonly gradeArchives = {
    upsert: async (input: { familyId: string; gradeKey: string; snapshot: Record<string, unknown>; summary: Record<string, unknown>; now: Date }): Promise<void> => {
      this.gradeArchiveMap.set(`${input.familyId}:${input.gradeKey}`, {
        familyId: input.familyId,
        gradeKey: input.gradeKey,
        snapshot: input.snapshot,
        summary: input.summary,
        createdAt: input.now,
      })
    },
    findByKey: async (familyId: string, gradeKey: string): Promise<GradeArchiveRecord | null> =>
      this.gradeArchiveMap.get(`${familyId}:${gradeKey}`) ?? null,
    delete: async (familyId: string, gradeKey: string): Promise<void> => {
      this.gradeArchiveMap.delete(`${familyId}:${gradeKey}`)
    },
    listByFamily: async (familyId: string): Promise<GradeArchiveRecord[]> =>
      [...this.gradeArchiveMap.values()].filter((row) => row.familyId === familyId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
  }

  readonly securityEvents = {
    create: async (input: { familyId: string; type: string; detail: Record<string, unknown> | null; now: Date }): Promise<SecurityEventRecord> => {
      const record: SecurityEventRecord = {
        id: randomUUID(),
        familyId: input.familyId,
        type: input.type,
        detail: input.detail,
        createdAt: input.now,
      }
      this.securityEventLog.push(record)
      this.securityEventCounter += 1
      this.securityEventSeq.set(record.id, this.securityEventCounter)
      return record
    },
    listByFamily: async (familyId: string, limit: number): Promise<SecurityEventRecord[]> =>
      this.securityEventLog
        .filter((event) => event.familyId === familyId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || (this.securityEventSeq.get(b.id) ?? 0) - (this.securityEventSeq.get(a.id) ?? 0))
        .slice(0, limit),
  }
}
