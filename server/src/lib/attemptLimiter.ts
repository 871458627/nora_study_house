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

  isBlocked(key: string): boolean {
    const state = this.windows.get(key)
    if (!state) return false
    if (this.now() - state.windowStart >= this.windowMs) return false
    return state.count >= this.max
  }

  recordFailure(key: string): void {
    const now = this.now()
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
