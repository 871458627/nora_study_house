// 登录限速器惰性回收（缺陷清单 H3 回归）：
// 公开端点的 key = IP×用户名不可枚举，只写不删会在常驻单机 512MB 下无界增长。
// now 注入（docs/03 §8.5），断言过期窗口被写入路径顺手清扫。
import { describe, expect, it } from 'vitest';
import { AttemptLimiter } from '../src/lib/attemptLimiter.js';

describe('AttemptLimiter 过期回收（缺陷清单 H3）', () => {
  it('窗口整体过期后，写入路径清扫全部过期 key', () => {
    let now = 1_000_000;
    const limiter = new AttemptLimiter({ max: 5, windowMs: 15 * 60 * 1000, now: () => now });
    for (let index = 0; index < 50; index += 1) {
      limiter.recordFailure(`10.0.0.1|user${index}`);
    }
    expect(limiter.size).toBe(50);

    now += 15 * 60 * 1000; // 全部过期
    limiter.recordFailure('10.0.0.2|fresh');
    expect(limiter.size).toBe(1);
  });

  it('窗口内未过期条目不被误删', () => {
    let now = 1_000_000;
    const limiter = new AttemptLimiter({ max: 5, windowMs: 15 * 60 * 1000, now: () => now });
    limiter.recordFailure('ip|a');
    now += 1000;
    limiter.recordFailure('ip|b');
    expect(limiter.size).toBe(2);
    expect(limiter.isBlocked('ip|a')).toBe(false); // 计数在但未达上限
  });

  it('过期 key 的 isBlocked 恒 false', () => {
    let now = 1_000_000;
    const limiter = new AttemptLimiter({ max: 1, windowMs: 15 * 60 * 1000, now: () => now });
    limiter.recordFailure('ip|a');
    limiter.recordFailure('ip|a');
    expect(limiter.isBlocked('ip|a')).toBe(true);
    now += 15 * 60 * 1000;
    expect(limiter.isBlocked('ip|a')).toBe(false);
  });
});
