// 账号业务规则（docs/02 §3.1）：注册/登录/refresh 轮换与复用检测/登出。
// 不含 HTTP 概念：不 import fastify、不读 request/reply，错误一律抛 AppError。
import { randomUUID } from 'node:crypto'
import { AppError } from '../errors.js'
import type { Clock } from '../lib/clock.js'
import type { AccessTokenIssuer } from '../lib/jwt.js'
import { hashPassword, verifyPassword } from '../lib/argon2.js'
import { generateRefreshToken, hashRefreshToken } from '../lib/tokens.js'
import type { AccountRecord, RefreshTokenRecord, Repository } from '../repos/index.js'
import { callRepo } from './repoCall.js'

export interface CredentialsInput {
  username: string
  password: string
}

export interface IssuedTokens {
  accessToken: string
  /** 原始值，仅供 route 层写入 httpOnly cookie；库内只存哈希 */
  refreshToken: string
}

export interface AuthResult extends IssuedTokens {
  account: AccountRecord
  familyId: string
}

export interface RefreshResult extends IssuedTokens {
  familyId: string
}

const SECURITY_EVENT_REFRESH_REUSE = 'refresh-reuse'
// 机会式清理宽限（docs/02 §4.3-3）：refresh 成功路径顺带删除过期超过 7 天的行。
const EXPIRED_TOKEN_GRACE_MS = 7 * 24 * 60 * 60 * 1000

// 登录对未知用户名也要付出等价的 argon2 校验成本（docs/02 §3.1：
// 用户不存在与密码错误返回同一错误，不泄露账号存在性）。惰性生成一次、复用。
let dummyHashPromise: Promise<string> | null = null
function dummyArgon2Hash(): Promise<string> {
  dummyHashPromise ??= hashPassword(`xiaotao-dummy-${randomUUID()}`)
  return dummyHashPromise
}

export interface AuthServiceDeps {
  repo: Repository
  issuer: AccessTokenIssuer
  clock: Clock
  refreshTokenTtlSeconds: number
  logWarn?: (message: string, extra?: Record<string, unknown>) => void
}

export class AuthService {
  private readonly deps: AuthServiceDeps

  constructor(deps: AuthServiceDeps) {
    this.deps = deps
  }

  async register(input: CredentialsInput): Promise<AuthResult> {
    const username = input.username.toLowerCase()
    const passwordHash = await hashPassword(input.password)
    const account = await callRepo(() => this.deps.repo.accounts.createWithFamily({ username, passwordHash, now: this.deps.clock() }))
    const tokens = await this.issueTokens(account)
    return { ...tokens, account, familyId: account.familyId }
  }

  async login(input: CredentialsInput): Promise<AuthResult> {
    const username = input.username.toLowerCase()
    const account = await callRepo(() => this.deps.repo.accounts.findByUsername(username))
    if (!account) {
      await dummyArgon2Hash()
        .then((hash) => verifyPassword(hash, input.password))
        .catch(() => false)
      throw new AppError('invalid_credentials')
    }
    const valid = await verifyPassword(account.passwordHash, input.password)
    if (!valid) throw new AppError('invalid_credentials')
    // 每次登录发放新 refresh；旧 refresh 不吊销（多设备并存是预期场景，docs/02 §3.1）。
    const tokens = await this.issueTokens(account)
    return { ...tokens, account, familyId: account.familyId }
  }

  async refresh(rawRefreshToken: string): Promise<RefreshResult> {
    const now = this.deps.clock()
    const record = await callRepo(() => this.deps.repo.refreshTokens.findByTokenHash(hashRefreshToken(rawRefreshToken)))
    if (!record) throw new AppError('unauthorized')
    if (record.expiresAt.getTime() <= now.getTime()) throw new AppError('unauthorized')

    // 轮换 + 复用检测：吊销过的 token 再次出现即视为泄漏——全量吊销该账号
    // refresh 并写 security_events（docs/02 §3.1）。revokeIfActive 兼容并发轮换竞态。
    const stillActive = record.revokedAt === null && (await callRepo(() => this.deps.repo.refreshTokens.revokeIfActive(record.id, now)))
    if (!stillActive) {
      await this.handleReuse(record)
      throw new AppError('token_reuse_detected')
    }

    const account = await callRepo(() => this.deps.repo.accounts.findById(record.accountId))
    if (!account) throw new AppError('unauthorized')
    const tokens = await this.issueTokens(account)
    try {
      await this.deps.repo.refreshTokens.deleteExpiredBefore(new Date(now.getTime() - EXPIRED_TOKEN_GRACE_MS))
    } catch (error) {
      this.deps.logWarn?.('expired refresh token cleanup failed', { error: String(error) })
    }
    return { ...tokens, familyId: account.familyId }
  }

  async logout(rawRefreshToken: string): Promise<void> {
    const record = await callRepo(() => this.deps.repo.refreshTokens.findByTokenHash(hashRefreshToken(rawRefreshToken)))
    if (record && record.revokedAt === null) {
      await callRepo(() => this.deps.repo.refreshTokens.revokeIfActive(record.id, this.deps.clock()))
    }
  }

  private async issueTokens(account: AccountRecord): Promise<IssuedTokens> {
    const accessToken = this.deps.issuer.signAccessToken(account.id, account.familyId)
    const refreshToken = generateRefreshToken()
    const now = this.deps.clock()
    await callRepo(() =>
      this.deps.repo.refreshTokens.create({
        accountId: account.id,
        tokenHash: hashRefreshToken(refreshToken),
        expiresAt: new Date(now.getTime() + this.deps.refreshTokenTtlSeconds * 1000),
        now,
      }),
    )
    return { accessToken, refreshToken }
  }

  private async handleReuse(record: RefreshTokenRecord): Promise<void> {
    await callRepo(() => this.deps.repo.refreshTokens.revokeAllForAccount(record.accountId, this.deps.clock()))
    try {
      const account = await this.deps.repo.accounts.findById(record.accountId)
      if (account) {
        await this.deps.repo.securityEvents.create({
          familyId: account.familyId,
          type: SECURITY_EVENT_REFRESH_REUSE,
          detail: { accountId: record.accountId },
          now: this.deps.clock(),
        })
      }
    } catch (error) {
      // 审计写入是 best-effort：失败不改变「已全量吊销 + 401」的安全决策。
      this.deps.logWarn?.('security event write failed after refresh reuse', { error: String(error) })
    }
  }
}
