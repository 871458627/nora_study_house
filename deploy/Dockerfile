# syntax=docker/dockerfile:1
# 小桃学习屋一体化镜像：构建前端 + 后端，运行时由 Fastify 同源托管静态文件（docs/08/09）。
# 构建上下文 = 仓库根（compose 里 context: ..）。

FROM node:20-alpine AS build-web
WORKDIR /app/web
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

FROM node:20-alpine AS build-server
# Prisma 引擎在 alpine 上需要 openssl 兼容层
RUN apk add --no-cache openssl
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci --workspaces=false
COPY server/ ./
RUN npx prisma generate && npm run build

FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app/server
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8787 \
    XTAO_REPO=prisma \
    WEB_DIST_DIR=/app/web-dist
# 保留完整 node_modules（含 prisma CLI），供 `docker compose run --rm api npx prisma migrate deploy`
COPY --from=build-server /app/server/node_modules ./node_modules
COPY --from=build-server /app/server/dist ./dist
COPY --from=build-server /app/server/prisma ./prisma
COPY --from=build-server /app/server/package.json ./
COPY --from=build-web /app/web/dist /app/web-dist
USER node
EXPOSE 8787
CMD ["node", "dist/src/app.js"]
