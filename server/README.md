# xiaotao-server —— 小桃学习屋 v2 后端 API

Node.js 20 LTS + TypeScript（strict）+ Fastify 4 的自托管后端：账号鉴权（argon2id + JWT + refresh 轮换）
与家庭状态单行 CAS 同步。架构蓝图见 `docs/02-技术架构方案.md`，分层纪律见 `docs/03-开发规范.md` 第八节。

## 快速开始

```bash
cd server
npm install --workspaces=false   # 独立安装（避免 monorepo 提升造成 @fastify/static 与 fastify 双副本、类型增强失效）
npx prisma generate        # 生成 Prisma Client（编译 prisma.ts 需要）
npm run check              # tsc --noEmit
npm run test               # vitest run（65 例，全内存仓储，无需 Docker/Postgres）
npm run dev                # 本地起服务（无 DATABASE_URL 时自动退化为内存仓储并打 warn）
```

免费托管（Render + Neon，同源方案）：见 `../docs/08-免费部署指南.md` 与根目录 `render.yaml`；
本地联调同源形态：`WEB_DIST_DIR=../web/dist npm run dev`（Fastify 直接服务前端构建产物）。

生产形态：`docker compose up -d`（nginx 反代 `/api` → api 容器 → PostgreSQL 16，见 docs/07）。

## npm scripts

| 脚本 | 内容 |
|---|---|
| `dev` | `tsx watch src/app.ts`（app.ts 兼作入口：直接运行即监听 HTTP） |
| `build` | `tsc -p tsconfig.json`（产物 `dist/`，入口 `dist/src/app.js`） |
| `check` | `tsc --noEmit`（src + test 全量类型检查） |
| `test` | `vitest run`（fastify.inject + 注入内存仓储，绝不依赖 Docker） |
| `prisma:generate` / `db:migrate` | Prisma client 生成 / 本地迁移（生产只允许 `prisma migrate deploy`） |

## 环境变量

见 `.env.example`。要点（红线 docs/03 §8.4）：

- `JWT_SECRET`：≥32 字节随机串。未设置 → 使用开发默认值并打 warn；设置但过短 → 拒绝启动。
  secret 绝不出现在测试断言、日志（pino 已 redact authorization/cookie/set-cookie）或响应体。
- `ACCESS_TOKEN_TTL`（默认 7200s）/ `REFRESH_TOKEN_TTL`（默认 30 天）。
- `DATABASE_URL`：为空时 dev 退化为内存仓储（数据不持久，仅限本地联调）。
- `COOKIE_SECURE`：默认 true（生产红线）；本地 http 联调可临时设 false。

## 分层结构

```
src/
  app.ts          组装层：buildApp(options) 工厂（测试注入 repo/config/clock/限速参数）；直接运行即启动服务
  config.ts       env 读取 + 默认值 + warn
  errors.ts       集中错误码表（code → HTTP 状态 + 固定中文 message），AppError/StateConflictError
  routes/         HTTP 层：路径/方法/Zod 校验（schemas.ts）/鉴权钩子/限速挂载/错误映射
    auth.ts       register / login / refresh / logout（cookie 读写只在此层）
    state.ts      GET / PUT state（content-type、content-length 预检，no-store，405+Allow）
    health.ts     健康检查（无鉴权）
  services/       业务规则，不含 HTTP 概念：authService（轮换/复用检测/全量吊销）、stateService（CAS/环形历史/archive 防线）
  repos/          仓储接口 index.ts + 内存实现 memory.ts（测试/本地兜底）+ Prisma 实现 prisma.ts（生产）
  lib/            基础设施：argon2（参数固化）、tokens（SHA-256）、jwt（契约接口）、attemptLimiter（登录限速）、clock（可注入时钟）
  types/          fastify 模块扩充（request.principal）
prisma/schema.prisma   六表：families/accounts/family_state/family_state_history/refresh_tokens/security_events
test/            vitest 用例（auth 14 / state 26 / health 2）
```

依赖方向 `routes → services → repositories → prisma client`，禁止反向；service 不 import fastify。

## API 概要（/api/v1，鉴权/限速逐路由显式回答）

| 路由 | 鉴权 | 限速（默认） | 要点 |
|---|---|---|---|
| POST /auth/register | 无 | 3 次/小时/IP | 201 + access + httpOnly refresh cookie；重名 409 `username_taken` |
| POST /auth/login | 无 | 5 次/15 分钟，键=IP+用户名 | 成功清计数；错误凭证 401 `invalid_credentials`（不泄露账号存在性） |
| POST /auth/refresh | refresh cookie | 30 次/分钟/IP | 轮换；已吊销 token 复用 → 全量吊销 + 401 `token_reuse_detected` |
| POST /auth/logout | refresh cookie | 30 次/分钟/IP | 吊销当前 refresh、清 cookie |
| GET /state | Bearer access | 无（读侧无写放大） | 空态 `{ok:true,data:null,revision:0}`；一律 `cache-control: no-store` |
| PUT /state | Bearer access | 60 次/分钟/账号 | 信封校验（schemaVersion===1、baseRevision 安全整数、415/413/400）；CAS 409 附云端最新；RISK-01 防线 400 `archive_wiped` |
| GET /state/history | Bearer access | 无 | 环形历史只读视图（revision 降序，≤5 版），docs/07 数据回退路径 |
| GET /security-events | Bearer access | 无 | `?limit=1..100`（默认 20）；家长区审计列表（PIN 重置/隐私确认/refresh 复用） |
| POST /security-events | Bearer access | 10 次/分钟/账号 | type 白名单 `pin-reset` / `privacy-confirm`；detail ≤16 键，服务端注入 accountId 归因 |
| GET /health | 无 | 无 | 200/503；不泄露拓扑 |

统一错误体 `{ok:false,error:{code,message}}`；错误码集中定义于 `src/errors.ts`。
CAS 与请求校验语义逐条平移自 v1 `functions/handler.mjs`（对照表见 docs/02 §3.2、§8.2）。

## 测试策略（交付约束：不依赖 Docker/Postgres）

`buildApp(options)` 支持注入：内存仓储、配置（含随机 JWT secret）、时钟、各限速参数。
57 个用例覆盖任务交付清单全部场景（注册/登录/限速/轮换/复用全量吊销/登出、CAS 全链、
413/415/400、archive_wiped、环形历史写 7 存 5、no-store、503 无泄漏、405/404、health 两态，
以及 security-events 白名单/limit 边界/归因注入与 /state/history 恢复视图）。
Prisma 实现按「代码成立（可编译、依赖可安装、`prisma generate` 通过）」交付；
真实 PostgreSQL 语义（唯一键插入竞争、事务等）的集成用例列入遗留事项。

## 假设与口径说明

1. **同源部署，无 CORS**：默认 nginx 同域反代 `/api`，前后端同源，故未挂 CORS 插件
   （refresh cookie 的 `SameSite=Strict + Path=/api/v1/auth` 防线也以此假设为前提）。若未来拆域部署需重新评估。
2. **错误码口径**：按交付任务契约实现——鉴权失败统一 `unauthorized`（access 过期细分 `token_expired`）、
   refresh 复用 `token_reuse_detected`。docs/02 §3.2 表中的更细分码（`login_required`/`invalid_token`/
   `invalid_refresh`/`refresh_reused`）映射关系如上，如需细分只需扩展 `src/errors.ts` 与 issuer 映射。
3. **环形历史 N=5**：按交付任务口径（写 7 次仅存 5 版，常量 `HISTORY_SLOTS`）；docs/02 §4.1 的 10 槽为建议值。
4. **复用检测取严**：任何已吊销 refresh token（轮换吊销、登出吊销或全量吊销）再次出现，一律按
   `token_reuse_detected` 处理并再次全量吊销（fail-closed，实现简单且语义一致）。
5. **登录限速为自研 `AttemptLimiter`**：`@fastify/rate-limit` 无「成功后清计数」公开能力；register/refresh/
   logout/state PUT 仍由 `@fastify/rate-limit` 承担（preHandler 阶段，PUT 按账号键）。测试可注入窗口与时钟。

## 遗留事项

- Prisma/PostgreSQL 集成用例（真实库事务、插入竞争 409、`prisma migrate deploy` 流程）待 Docker 环境就绪后补充。
- docs/02 §7.10 push/report 路由为 P1 预留，未建骨架。
- 多家长共管（第二个账号加入既有 family）未实现（docs/02 §7.11 演进预留）。
