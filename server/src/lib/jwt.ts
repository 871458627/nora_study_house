// access token 契约（docs/02 §3.1 token 规格表）：JWT HS256，claims 含 typ 防 token 混用。
// 签发/校验的实际实现在 HTTP 组装层（app.ts，由 @fastify/jwt 承担）；
// service 只依赖此接口，保持自身不含 HTTP 概念（docs/03 §8.1）。

export interface AccessTokenClaims {
  /** accountId */
  sub: string
  /** familyId——身份只信 token claims，绝不取自请求体（docs/03 §8.4-4） */
  fid: string
  typ: 'access'
}

export interface AccessTokenIssuer {
  signAccessToken(accountId: string, familyId: string): string
  /** 校验失败抛 AppError：过期 → token_expired，其余（签名/格式/typ 错）→ unauthorized */
  verifyAccessToken(token: string): AccessTokenClaims
}
