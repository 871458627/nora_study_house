# syntax=docker/dockerfile:1
# 小桃学习屋一体化镜像：构建前端 + 后端，运行时由 Fastify 同源托管静态文件（docs/08/09）。
# 构建上下文 = 仓库根（compose 里 context: ..）。

FROM node:20-alpine AS build-web
# monorepo 统一安装（根 lock 覆盖 web+server）
WORKDIR /app
COPY package.json package-lock.json ./
COPY web/package.json web/
COPY server/package.json server/
RUN npm ci
COPY web/ web/
RUN npm run build --workspace web

FROM node:20-alpine AS build-server
RUN apk add --no-cache openssl
WORKDIR /app
COPY package.json package-lock.json ./
COPY web/package.json web/
COPY server/package.json server/
RUN npm ci
COPY server/ server/
RUN npm run build --workspace server && npm run postbuild --workspace server

FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app/server
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8787 \
    XTAO_REPO=prisma \
    WEB_DIST_DIR=/app/web-dist
# 保留根 node_modules（提升布局：包在 /app/node_modules），prisma CLI 供 migrate deploy
COPY --from=build-server /app/node_modules /app/node_modules
COPY --from=build-server /app/server/dist ./dist
COPY --from=build-server /app/server/prisma ./prisma
COPY --from=build-server /app/server/package.json ./
COPY --from=build-web /app/web/dist /app/web-dist
USER node
EXPOSE 8787
CMD ["node", "dist/src/app.js"]
