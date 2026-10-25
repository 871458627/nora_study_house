// 集中错误码表（docs/03 §8.2）：全部 error.code + HTTP 状态码 + 固定中文 message
// 都定义在这一个文件里。禁止在 route/service 里散落字符串字面量。
// message 是面向用户的中文短句，不含堆栈/SQL/内部路径等细节
// （沿袭 v1「503 无 message 泄漏」用例断言，dev/function-test.mjs:262-265）。

export type ErrorCode =
  | 'invalid_body'
  | 'unsupported_media_type'
  | 'payload_too_large'
  | 'username_taken'
  | 'invalid_credentials'
  | 'unauthorized'
  | 'token_expired'
  | 'token_reuse_detected'
  | 'rate_limited'
  | 'revision_conflict'
  | 'archive_wiped'
  | 'method_not_allowed'
  | 'not_found'
  | 'database_request_failed'
  | 'internal_error'

export interface ErrorDefinition {
  status: number
  message: string
}

export const ERROR_DEFINITIONS: Readonly<Record<ErrorCode, ErrorDefinition>> = {
  invalid_body: { status: 400, message: '请求体格式不正确' },
  unsupported_media_type: { status: 415, message: '仅支持 application/json 请求' },
  payload_too_large: { status: 413, message: '请求体超过大小限制' },
  username_taken: { status: 409, message: '用户名已被使用' },
  invalid_credentials: { status: 401, message: '用户名或密码不正确' },
  unauthorized: { status: 401, message: '未登录或凭证无效' },
  token_expired: { status: 401, message: '登录已过期' },
  token_reuse_detected: { status: 401, message: '凭证被复用，请重新登录' },
  rate_limited: { status: 429, message: '尝试过于频繁，请稍后再试' },
  revision_conflict: { status: 409, message: '云端已有更新的数据' },
  archive_wiped: { status: 400, message: '缺少归档数据，已拒绝本次写入' },
  method_not_allowed: { status: 405, message: '请求方法不被支持' },
  not_found: { status: 404, message: '资源不存在' },
  database_request_failed: { status: 503, message: '服务暂时不可用，请稍后重试' },
  internal_error: { status: 500, message: '服务器内部错误' },
}

export class AppError extends Error {
  readonly code: ErrorCode
  readonly status: number

  constructor(code: ErrorCode, messageOverride?: string) {
    const definition = ERROR_DEFINITIONS[code]
    super(messageOverride ?? definition.message)
    this.name = 'AppError'
    this.code = code
    this.status = definition.status
  }
}

/** 云端最新快照，409 revision_conflict 响应体附带给前端 ConflictError.remote 消费
 * （docs/02 §3.2；无行冲突时为 { data: null, revision: 0 }，与 v1 conflict(null) 一致）。 */
export interface ConflictRemote {
  data: Record<string, unknown> | null
  revision: number
  updatedAt?: string
}

export class StateConflictError extends AppError {
  readonly remote: ConflictRemote

  constructor(remote: ConflictRemote) {
    super('revision_conflict')
    this.remote = remote
  }
}
