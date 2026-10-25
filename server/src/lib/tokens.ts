// refresh token 原始值只存在于 cookie 传输中；库内只存 SHA-256 哈希（docs/02 §2.3-4）。
import { createHash, randomBytes } from 'node:crypto'

/** 256-bit crypto 随机串（opaque，非 JWT）。 */
export function generateRefreshToken(): string {
  return randomBytes(32).toString('base64url')
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}
