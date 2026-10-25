#!/usr/bin/env bash
# 首次部署引导：签发证书 → 起全栈 → 建表 → 自检
# 前提：服务器已装 Docker；DNS A 记录已指向本机；.env 已填 DOMAIN/ACME_EMAIL（可先跑 gen-secrets.sh）
set -euo pipefail
cd "$(dirname "$0")"
DOMAIN=$(grep -E '^DOMAIN=' .env | cut -d= -f2-)
ACME_EMAIL=$(grep -E '^ACME_EMAIL=' .env | cut -d= -f2-)
[ -n "$DOMAIN" ] && [ -n "$ACME_EMAIL" ] || { echo '错误：.env 缺少 DOMAIN 或 ACME_EMAIL'; exit 1; }

mkdir -p nginx/conf.d certbot/conf certbot/www backups

echo '[1/6] 引导配置（仅 HTTP + ACME）并启动 nginx ...'
sed "s/\${DOMAIN}/${DOMAIN}/g" nginx/bootstrap.conf.src > nginx/conf.d/app.conf
docker compose up -d nginx
sleep 2

echo '[2/6] 申请 Let'"'"'s Encrypt 证书（webroot）...'
docker compose run --rm --entrypoint certbot certbot \
  certonly --webroot -w /var/www/certbot \
  -d "$DOMAIN" -m "$ACME_EMAIL" --agree-tos --no-eff-email --keep-until-expiring

echo '[3/6] 切换到最终 TLS 配置并启动全栈（含构建镜像，首次约 3-8 分钟）...'
sed "s/\${DOMAIN}/${DOMAIN}/g" nginx/app.conf.src > nginx/conf.d/app.conf
docker compose up -d --build

echo '[4/6] 等待服务就绪...'
for i in $(seq 1 30); do
  if docker compose exec -T api wget -qO- http://127.0.0.1:8787/api/v1/health >/dev/null 2>&1; then break; fi
  sleep 2
done

echo '[5/6] 建表（prisma migrate deploy）...'
docker compose run --rm api npx prisma migrate deploy

echo '[6/6] 外网自检...'
echo "  https://${DOMAIN}/api/v1/health ->"
curl -fsS "https://${DOMAIN}/api/v1/health" && echo
echo "完成。验证清单见 docs/09-服务器自部署指南.md 第六节。"
