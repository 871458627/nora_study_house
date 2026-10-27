import { describe, expect, it } from 'vitest';
import { credentialProblem } from '../src/app/auth';

describe('credentialProblem（注册前本地校验，口径对齐服务端）', () => {
  it('合法用户名与 8 位以上密码：通过', () => {
    expect(credentialProblem('nora', 'nora-2026-pw')).toBeNull();
    expect(credentialProblem('Nora_1', '12345678')).toBeNull();
  });

  it('密码不足 8 位：给出具体原因（历史上被笼统文案掩盖）', () => {
    expect(credentialProblem('nora', 'nora')).toBe('密码至少 8 位。');
    expect(credentialProblem('nora', '')).toBe('密码至少 8 位。');
  });

  it('用户名过短/含非法字符：给出格式要求', () => {
    expect(credentialProblem('no', '12345678')).toContain('3-32 位');
    expect(credentialProblem('小白白', '12345678')).toContain('3-32 位');
    expect(credentialProblem('a'.repeat(33), '12345678')).toContain('3-32 位');
  });
});
