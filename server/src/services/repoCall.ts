// 仓储故障归一（docs/02 §3.2 错误码表 503 database_request_failed）：
// 驱动异常细节绝不出现在响应里（v1 先例断言 dev/function-test.mjs:262-265）；
// 领域错误（AppError，如 username_taken）原样透传。
import { AppError } from '../errors.js'

export async function callRepo<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('database_request_failed')
  }
}
