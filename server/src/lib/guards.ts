// unknown 收窄辅助，与前端 src/core/model.ts:183 的 isRecord 模式同款。

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
