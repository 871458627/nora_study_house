// 凭据存储红线（docs/02 §2.3-4、docs/03 §8.4-2）：密码只存 argon2id 哈希，
// 参数固化为常量；升级参数须支持对旧哈希的就地重哈希（P1 预留，当前仅固化）。
import argon2 from 'argon2'

export const ARGON2_OPTIONS = Object.freeze({
  type: argon2.argon2id,
  memoryCost: 19456, // 19 MiB（OWASP 推荐下限档）
  timeCost: 2,
  parallelism: 1,
})

export function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, ARGON2_OPTIONS)
}

export function verifyPassword(hash: string, password: string): Promise<boolean> {
  // 校验参数取自哈希串本身（argon2 编码自带），与哈希时固化的常量一致。
  return argon2.verify(hash, password)
}
