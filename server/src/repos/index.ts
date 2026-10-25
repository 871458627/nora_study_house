// 仓储契约（docs/03 §8.1）：方法名与参数用领域词汇（casUpdateState 式），不含 HTTP 词汇；
// 本文件只有接口——内存实现供测试/本地 dev 注入，Prisma 实现供生产。

export interface AccountRecord {
  id: string
  username: string
  passwordHash: string
  familyId: string
  createdAt: Date
}

export interface RefreshTokenRecord {
  id: string
  accountId: string
  tokenHash: string
  expiresAt: Date
  revokedAt: Date | null
  createdAt: Date
}

export interface StateRecord {
  familyId: string
  data: Record<string, unknown>
  revision: number
  updatedAt: Date
}

export interface HistoryRecord {
  familyId: string
  slot: number
  data: Record<string, unknown>
  revision: number
  updatedAt: Date
}

export interface GradeArchiveRecord {
  familyId: string
  gradeKey: string
  snapshot: Record<string, unknown>
  summary: Record<string, unknown>
  createdAt: Date
}

export interface SecurityEventRecord {
  id: string
  familyId: string
  type: string
  detail: Record<string, unknown> | null
  createdAt: Date
}

export type InsertFirstResult =
  | { outcome: 'inserted'; row: StateRecord }
  | { outcome: 'conflict'; row: StateRecord }

export type CasUpdateResult =
  | { outcome: 'updated'; row: StateRecord }
  | { outcome: 'missing' }

export interface Repository {
  ping(): Promise<void>
  accounts: {
    /** 原子创建 family 行 + 首个 account 行（注册事务语义）；
     * 归一化用户名已存在时抛 AppError('username_taken')。 */
    createWithFamily(input: { username: string; passwordHash: string; now: Date }): Promise<AccountRecord>
    findByUsername(username: string): Promise<AccountRecord | null>
    findById(id: string): Promise<AccountRecord | null>
  }
  refreshTokens: {
    create(input: { accountId: string; tokenHash: string; expiresAt: Date; now: Date }): Promise<RefreshTokenRecord>
    findByTokenHash(tokenHash: string): Promise<RefreshTokenRecord | null>
    /** 原子「仅当未吊销时吊销」：已不存在/已吊销返回 false（轮换竞态判定用）。 */
    revokeIfActive(id: string, at: Date): Promise<boolean>
    revokeAllForAccount(accountId: string, at: Date): Promise<number>
    deleteExpiredBefore(cutoff: Date): Promise<number>
  }
  state: {
    findByFamilyId(familyId: string): Promise<StateRecord | null>
    /** 惰性首写（v1 语义平移，functions/handler.mjs:219-225）：revision=1；
     * 插入撞唯一键（并发抢先）返回冲突方行。 */
    insertFirst(input: { familyId: string; data: Record<string, unknown>; now: Date }): Promise<InsertFirstResult>
    /** 原子 CAS：仅当 revision === baseRevision 时更新为 baseRevision+1；
     * 未命中返回 missing，由 service 重读最新后决断（禁止先读后写假装原子）。 */
    casUpdate(input: { familyId: string; baseRevision: number; data: Record<string, unknown>; now: Date }): Promise<CasUpdateResult>
    /** 环形历史槽位覆写（UPDATE 语义，免 DELETE；槽位 = revision % N 由 service 决定）。 */
    upsertHistorySlot(input: { familyId: string; slot: number; data: Record<string, unknown>; revision: number; updatedAt: Date }): Promise<void>
    listHistory(familyId: string): Promise<HistoryRecord[]>
  }
  securityEvents: {
    create(input: { familyId: string; type: string; detail: Record<string, unknown> | null; now: Date }): Promise<SecurityEventRecord>
    listByFamily(familyId: string, limit: number): Promise<SecurityEventRecord[]>
  }
  /** 年级切换归档（docs/12 v1.1）：同 (familyId, gradeKey) 只存一行，封存即覆写。 */
  gradeArchives: {
    upsert(input: { familyId: string; gradeKey: string; snapshot: Record<string, unknown>; summary: Record<string, unknown>; now: Date }): Promise<void>
    findByKey(familyId: string, gradeKey: string): Promise<GradeArchiveRecord | null>
    delete(familyId: string, gradeKey: string): Promise<void>
    listByFamily(familyId: string): Promise<GradeArchiveRecord[]>
  }
}
