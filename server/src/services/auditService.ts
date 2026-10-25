// 家长区审计事件业务规则（docs/02 §3.4）：PIN 重置 / 隐私确认由前端上报（type 白名单），
// refresh 复用检测由 authService 内部写入；家长周报侧只读列表。不含 HTTP 概念。
import type { Clock } from '../lib/clock.js'
import type { Repository, SecurityEventRecord } from '../repos/index.js'
import { callRepo } from './repoCall.js'

/** 前端可上报的事件类型白名单；服务端内部事件（refresh-reuse）不在其列。 */
export const REPORTABLE_EVENT_TYPES = ['pin-reset', 'privacy-confirm'] as const
export type ReportableEventType = (typeof REPORTABLE_EVENT_TYPES)[number]

export const MAX_EVENT_DETAIL_KEYS = 16
export const MAX_SECURITY_EVENTS_RESPONSE = 100

export interface ReportEventInput {
  type: ReportableEventType
  detail: Record<string, unknown> | null
}

export interface AuditServiceDeps {
  repo: Repository
  clock: Clock
}

export class AuditService {
  private readonly deps: AuditServiceDeps

  constructor(deps: AuditServiceDeps) {
    this.deps = deps
  }

  async list(familyId: string, limit: number): Promise<SecurityEventRecord[]> {
    return callRepo(() => this.deps.repo.securityEvents.listByFamily(familyId, limit))
  }

  /** detail 追加 accountId 归因（与 handleReuse 的写入形态一致），客户端无法伪造归属。 */
  async report(accountId: string, familyId: string, input: ReportEventInput): Promise<SecurityEventRecord> {
    const detail = input.detail === null ? null : { ...input.detail, accountId }
    return callRepo(() =>
      this.deps.repo.securityEvents.create({
        familyId,
        type: input.type,
        detail,
        now: this.deps.clock(),
      }),
    )
  }
}
