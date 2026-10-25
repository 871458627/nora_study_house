// 环境变量配置读取（docs/03 §8.4 红线：secret 只从 env 来，本地开发缺省给默认值并打 warn；
// 测试经 buildApp({ config }) 注入覆盖，不读真实环境）。

export interface AppConfig {
  jwtSecret: string
  accessTokenTtlSeconds: number
  refreshTokenTtlSeconds: number
  cookieSecure: boolean
  databaseUrl: string
  port: number
  host: string
  logLevel: string
  appVersion: string
}

export interface LoadConfigOptions {
  env?: Record<string, string | undefined>
  warn?: (message: string) => void
}

// ≥32 字节，仅供本地开发；使用时必然伴随 warn（正式环境由 JWT_SECRET 提供）。
const DEV_FALLBACK_JWT_SECRET = 'dev-only-insecure-jwt-secret-do-not-use-in-production-0001'
const MIN_JWT_SECRET_BYTES = 32

const DEFAULT_ACCESS_TOKEN_TTL = 7200 // 2h（docs/02 §3.1 token 规格表）
const DEFAULT_REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60 // 30 天

function parsePositiveInt(raw: string | undefined, fallback: number, name: string, warn: (message: string) => void): number {
  if (raw === undefined || raw === '') return fallback
  const value = Number(raw)
  if (!Number.isSafeInteger(value) || value <= 0) {
    warn(`${name} 配置非法（${raw}），使用默认值 ${fallback}`)
    return fallback
  }
  return value
}

export function loadConfig(options: LoadConfigOptions = {}): AppConfig {
  const env = options.env ?? process.env
  const warn = options.warn ?? ((message: string) => console.warn(`[config] ${message}`))

  let jwtSecret = env.JWT_SECRET
  if (!jwtSecret) {
    warn('JWT_SECRET 未配置，使用本地开发默认值；生产环境必须设置 ≥32 字节随机密钥')
    jwtSecret = DEV_FALLBACK_JWT_SECRET
  } else if (jwtSecret.length < MIN_JWT_SECRET_BYTES) {
    throw new Error(`JWT_SECRET 长度必须不少于 ${MIN_JWT_SECRET_BYTES} 字节`)
  }

  const accessTokenTtlSeconds = parsePositiveInt(env.ACCESS_TOKEN_TTL, DEFAULT_ACCESS_TOKEN_TTL, 'ACCESS_TOKEN_TTL', warn)
  const refreshTokenTtlSeconds = parsePositiveInt(env.REFRESH_TOKEN_TTL, DEFAULT_REFRESH_TOKEN_TTL, 'REFRESH_TOKEN_TTL', warn)
  const port = parsePositiveInt(env.PORT, 3000, 'PORT', warn)

  const cookieSecure = env.COOKIE_SECURE !== 'false'
  if (!cookieSecure) warn('COOKIE_SECURE=false 仅限本地 http 联调使用')

  return {
    jwtSecret,
    accessTokenTtlSeconds,
    refreshTokenTtlSeconds,
    cookieSecure,
    databaseUrl: env.DATABASE_URL ?? '',
    port,
    host: env.HOST ?? '0.0.0.0',
    logLevel: env.LOG_LEVEL ?? 'info',
    appVersion: env.APP_VERSION ?? 'dev',
  }
}
