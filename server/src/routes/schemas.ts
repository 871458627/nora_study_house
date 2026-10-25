// Zod 校验只在 route 层（docs/03 §8.2）；service 收到的一律是已校验的强类型对象。
// zod 细节只进 debug 日志，响应只给固定 code + message。
import { z } from 'zod'
import { isRecord } from '../lib/guards.js'

// 用户名字符集 [a-z0-9_-]（大小写均收，service 统一小写化后判重）。
const USERNAME_PATTERN = /^[a-zA-Z0-9_-]+$/

export const credentialsSchema = z.object({
  username: z.string().min(3).max(32).regex(USERNAME_PATTERN),
  password: z.string().min(8).max(128),
})

export type Credentials = z.infer<typeof credentialsSchema>

function isStateEnvelope(value: unknown): value is Record<string, unknown> {
  // 服务端只校验信封：data 必须是对象且 schemaVersion === 1，不深验业务字段
  // （设计硬约束 ④，语义平移自 v1 handler.mjs:176-179）。
  return isRecord(value) && value['schemaVersion'] === 1
}

export const statePutSchema = z.object({
  data: z
    .unknown()
    .refine(isStateEnvelope)
    .transform((value) => value as Record<string, unknown>),
  // 非安全整数或为负 → 400（v1 handler.mjs:181-188）。
  baseRevision: z.number().refine((value) => Number.isSafeInteger(value) && value >= 0 && value < Number.MAX_SAFE_INTEGER),
})

export type StatePut = z.infer<typeof statePutSchema>
