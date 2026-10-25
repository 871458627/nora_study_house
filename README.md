# 小桃学习屋 v2（重新开发版）

给二年级孩子的学习管理应用。本仓库是 2026-10 起在原 Qoder 原型（`C:\Users\87145\Documents\Qoder\2026-10-22\3e79e069`，**只读参考，不再修改**）基础上，按主流自托管架构重新开发的新版本。

## 架构（v2）

```
浏览器 React SPA（web/）        家长/孩子设备，离线优先
   │  Bearer JWT（access ~2h）
   │  refresh httpOnly cookie（~30d，轮换可吊销）
   ▼
Fastify API（server/）           Node.js 20 + TypeScript + Zod + pino
   │  仓储接口（Memory 实现 / Prisma 实现）
   ▼
PostgreSQL 16 + Prisma           families / accounts / family_state(JSONB+revision CAS)
                                 family_state_history(环形 N 版) / refresh_tokens / security_events
```

- 状态同步契约：`GET/PUT /api/v1/state`，revision CAS，409 附云端最新，256KB 上限。
- 前端核心逻辑（计划生成、判分、进度、SRS）为纯函数，63 个单测钉死；教材内容（语文 28 课 / 数学 20 课 / 英语 18 课 2024 版）自原版拷贝。

## 目录

| 路径 | 内容 |
|---|---|
| `docs/` | 交付文档：00 章程与迭代计划、01 需求规格、02 技术架构、03 开发规范、04 测试策略、05 UI 设计、06 交互文案、07 部署运维（生产基线）、08 免费托管部署（Render+Neon）、09 服务器自部署（同机同源 + 数据安全）、10 设备支持与数据迁移策略（第一期 Redmi Pad Pro）、11 教材导入生成设计（降级为内容生产备选工具）、12 年级切换与内容包设计（现行方案） |
| `web/` | React 18 + TS + Vite 前端（离线优先 + 云同步） |
| `server/` | Fastify 后端（鉴权 + 状态 CAS 同步） |
| `deploy/` | 服务器自部署包：Dockerfile、docker-compose（nginx+api+postgres）、TLS 引导脚本、加密备份/恢复脚本 |

## 快速开始

```bash
npm install                 # 根目录（workspaces）
npm run test                # 前端 + 后端全部测试
npm run check               # 类型检查
npm run dev:server          # 本地 API（内存仓储模式）
npm run dev:web             # 前端开发服务器
```

## 部署路径速查（按手上资源选）

| 路径 | 适用 | 数据位置 | 详见 |
|---|---|---|---|
| 免费托管 Render+Neon | 没有服务器、要公网访问 | 第三方免费云（TLS/托管库） | `docs/08-免费部署指南.md`（仓库含 render.yaml，注册即部署） |
| 服务器自部署 | 有 VPS/域名、数据完全自主 | 自己的机器（内网数据库+加密备份） | `docs/09-服务器自部署指南.md`（deploy/ 部署包） |
| 本地/局域网 | 暂不上公网，单机或家里用 | 只在本机浏览器 | 离线优先架构原生支持，多设备云同步不可用 |

## 文档与决策

- 架构决策记录（脱离 Qoder 平台 → 主流自托管）见 `docs/02-技术架构方案.md` ADR-001。
- 风险台账与阶段门禁见 `docs/00-团队章程与迭代计划.md`。
