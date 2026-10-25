// Prisma 仓储：生产实现（PostgreSQL 16，schema 见 prisma/schema.prisma）。
// 仅代码成立即可（编译通过 + 依赖可安装）；自动化测试全部走内存仓储，
// 不依赖 Docker/Postgres（交付约束）。CAS 一律 updateMany 条件更新（docs/03 §8.3）。
import { Prisma, PrismaClient } from '@prisma/client'
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

function toStateRecord(row: { familyId: string; data: unknown; revision: number; updatedAt: Date }): StateRecord {
  // data 列为 JSONB 原文，服务端只校验过信封；此处仅做结构收窄，不做业务判断。
  return { familyId: row.familyId, data: row.data as Record<string, unknown>, revision: row.revision, updatedAt: row.updatedAt }
}

function toHistoryRecord(row: { familyId: string; slot: number; data: unknown; revision: number; updatedAt: Date }): HistoryRecord {
  return { familyId: row.familyId, slot: row.slot, data: row.data as Record<string, unknown>, revision: row.revision, updatedAt: row.updatedAt }
}

function isUniqueViolation(error: unknown): boolean {
  return (error as { code?: unknown }).code === 'P2002'
}

// JSONB 写入需要 Prisma 的 InputJsonValue；信封已在 route/service 校验，原文存储即可。
function toJson(data: Record<string, unknown>): Prisma.InputJsonValue {
  return data as unknown as Prisma.InputJsonValue
}

export function createPrismaRepository(prisma: PrismaClient): Repository {
  return {
    async ping(): Promise<void> {
      await prisma.$queryRaw`SELECT 1`
    },

    accounts: {
      // 事务理由：families 行与首个 accounts 行必须同生共死，
      // 半途失败会留下无账号的孤儿家庭（docs/03 §8.3：事务只允许在 service/repo 封装层并注释）。
      async createWithFamily(input: { username: string; passwordHash: string; now: Date }): Promise<AccountRecord> {
        try {
          return await prisma.$transaction(async (tx) => {
            const family = await tx.family.create({ data: { createdAt: input.now } })
            return await tx.account.create({
              data: { username: input.username, passwordHash: input.passwordHash, familyId: family.id, createdAt: input.now },
            })
          })
        } catch (error) {
          if (isUniqueViolation(error)) throw new AppError('username_taken')
          throw error
        }
      },
      async findByUsername(username: string): Promise<AccountRecord | null> {
        return await prisma.account.findUnique({ where: { username } })
      },
      async findById(id: string): Promise<AccountRecord | null> {
        return await prisma.account.findUnique({ where: { id } })
      },
    },

    refreshTokens: {
      async create(input: { accountId: string; tokenHash: string; expiresAt: Date; now: Date }): Promise<RefreshTokenRecord> {
        return await prisma.refreshToken.create({
          data: { accountId: input.accountId, tokenHash: input.tokenHash, expiresAt: input.expiresAt, createdAt: input.now },
        })
      },
      async findByTokenHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
        return await prisma.refreshToken.findUnique({ where: { tokenHash } })
      },
      async revokeIfActive(id: string, at: Date): Promise<boolean> {
        const result = await prisma.refreshToken.updateMany({ where: { id, revokedAt: null }, data: { revokedAt: at } })
        return result.count === 1
      },
      async revokeAllForAccount(accountId: string, at: Date): Promise<number> {
        const result = await prisma.refreshToken.updateMany({ where: { accountId, revokedAt: null }, data: { revokedAt: at } })
        return result.count
      },
      async deleteExpiredBefore(cutoff: Date): Promise<number> {
        const result = await prisma.refreshToken.deleteMany({ where: { expiresAt: { lt: cutoff } } })
        return result.count
      },
    },

    state: {
      async findByFamilyId(familyId: string): Promise<StateRecord | null> {
        const row = await prisma.familyState.findUnique({ where: { familyId } })
        return row ? toStateRecord(row) : null
      },
      async insertFirst(input: { familyId: string; data: Record<string, unknown>; now: Date }): Promise<InsertFirstResult> {
        try {
          const row = await prisma.familyState.create({
            data: { familyId: input.familyId, data: toJson(input.data), revision: 1, updatedAt: input.now },
          })
          return { outcome: 'inserted', row: toStateRecord(row) }
        } catch (error) {
          if (!isUniqueViolation(error)) throw error
          const winner = await prisma.familyState.findUnique({ where: { familyId: input.familyId } })
          if (!winner) throw error // 撞唯一键却读不到行：异常兜底交由 service 归一为 503
          return { outcome: 'conflict', row: toStateRecord(winner) }
        }
      },
      async casUpdate(input: { familyId: string; baseRevision: number; data: Record<string, unknown>; now: Date }): Promise<CasUpdateResult> {
        const result = await prisma.familyState.updateMany({
          where: { familyId: input.familyId, revision: input.baseRevision },
          data: { data: toJson(input.data), revision: input.baseRevision + 1, updatedAt: input.now },
        })
        if (result.count === 0) return { outcome: 'missing' }
        const row = await prisma.familyState.findUnique({ where: { familyId: input.familyId } })
        if (!row) return { outcome: 'missing' }
        return { outcome: 'updated', row: toStateRecord(row) }
      },
      async upsertHistorySlot(input: { familyId: string; slot: number; data: Record<string, unknown>; revision: number; updatedAt: Date }): Promise<void> {
        await prisma.familyStateHistory.upsert({
          where: { familyId_slot: { familyId: input.familyId, slot: input.slot } },
          create: { familyId: input.familyId, slot: input.slot, data: toJson(input.data), revision: input.revision, updatedAt: input.updatedAt },
          update: { data: toJson(input.data), revision: input.revision, updatedAt: input.updatedAt },
        })
      },
      async listHistory(familyId: string): Promise<HistoryRecord[]> {
        const rows = await prisma.familyStateHistory.findMany({ where: { familyId }, orderBy: { revision: 'desc' } })
        return rows.map(toHistoryRecord)
      },
    },

    securityEvents: {
      async create(input: { familyId: string; type: string; detail: Record<string, unknown> | null; now: Date }): Promise<SecurityEventRecord> {
        const row = await prisma.securityEvent.create({
          // 可空 Json 列写 null 须用 Prisma.JsonNull（驱动区分 JSON null 与 SQL NULL）。
          data: { familyId: input.familyId, type: input.type, detail: input.detail ? toJson(input.detail) : Prisma.JsonNull, createdAt: input.now },
        })
        return { ...row, detail: row.detail as Record<string, unknown> | null }
      },
      async listByFamily(familyId: string, limit: number): Promise<SecurityEventRecord[]> {
        const rows = await prisma.securityEvent.findMany({ where: { familyId }, orderBy: { createdAt: 'desc' }, take: limit })
        return rows.map((row) => ({ ...row, detail: row.detail as Record<string, unknown> | null }))
      },
    },

    gradeArchives: {
      async upsert(input: { familyId: string; gradeKey: string; snapshot: Record<string, unknown>; summary: Record<string, unknown>; now: Date }): Promise<void> {
        await prisma.gradeArchive.upsert({
          where: { familyId_gradeKey: { familyId: input.familyId, gradeKey: input.gradeKey } },
          create: { familyId: input.familyId, gradeKey: input.gradeKey, snapshot: toJson(input.snapshot), summary: toJson(input.summary), createdAt: input.now },
          update: { snapshot: toJson(input.snapshot), summary: toJson(input.summary) },
        })
      },
      async findByKey(familyId: string, gradeKey: string): Promise<GradeArchiveRecord | null> {
        const row = await prisma.gradeArchive.findUnique({ where: { familyId_gradeKey: { familyId, gradeKey } } })
        return row ? { ...row, snapshot: row.snapshot as Record<string, unknown>, summary: row.summary as Record<string, unknown> } : null
      },
      async delete(familyId: string, gradeKey: string): Promise<void> {
        await prisma.gradeArchive.deleteMany({ where: { familyId, gradeKey } })
      },
      async listByFamily(familyId: string): Promise<GradeArchiveRecord[]> {
        const rows = await prisma.gradeArchive.findMany({ where: { familyId }, orderBy: { createdAt: 'desc' } })
        return rows.map((row) => ({ ...row, snapshot: row.snapshot as Record<string, unknown>, summary: row.summary as Record<string, unknown> }))
      },
    },
  }
}
