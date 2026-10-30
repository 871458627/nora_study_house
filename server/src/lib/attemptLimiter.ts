// 登录尝试限速（docs/02 §2.3-1 红线：5 次/15 分钟，键 = IP+用户名，成功清计数）。
// 独立于 @fastify/rate-limit 实现，因为后者没有「成功后清零计数」的公开能力；
// now 可注入，测试确定性（docs/03 §8.5）。

export interface AttemptLimiterOptions {
  max: number
  windowMs: number
  now?: () => number
}

interface WindowState {
  count: number
  windowStart: number
}

export class AttemptLimiter {
  private readonly windows = new Map<string, WindowState>()
  private readonly max: number
  private readonly windowMs: number
  private readonly now: () => number

  constructor(options: AttemptLimiterOptions) {
    this.max = options.max
    this.windowMs = options.windowMs
    this.now = options.now ?? (() => Date.now())
  }

  /** 过期窗口惰性回收（缺陷清单 H3）：公开端点的 key=IP×用户名不可枚举，
   * 只写不删会在常驻单机 512MB 下无界增长（OOM）。写入路径顺手清扫。 */
  private sweepExpired(now: number): void {
    for (const [key, state] of this.windows) {
      if (now - state.windowStart >= this.windowMs) this.windows.delete(key)
    }
  }

  /** 测试与运维观测用：当前驻留 key 数。 */
  get size(): number {
    return this.windows.size
  }

  isBlocked(key: string): boolean {
    const state = this.windows.get(key)
    if (!state) return false
    if (this.now() - state.windowStart >= this.windowMs) return false
    return state.count >= this.max
  }

  recordFailure(key: string): void {
    const now = this.now()
    this.sweepExpired(now)
    const state = this.windows.get(key)
    if (!state || now - state.windowStart >= this.windowMs) {
      this.windows.set(key, { count: 1, windowStart: now })
      return
    }
    state.count += 1
  }

  reset(key: string): void {
    this.windows.delete(key)
  }
}
