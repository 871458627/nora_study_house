#!/usr/bin/env bash
# 一键生成强随机密钥并写入 deploy/.env（不覆盖已填的 DOMAIN/ACME_EMAIL）
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -f .env ]; then
  cp .env.example .env
  echo '[1/3] 已创建 .env（请先填 DOMAIN 与 ACME_EMAIL，然后重跑本脚本）'
  exit 0
fi

DB_PASS=$(openssl rand -hex 24)
JWT=$(openssl rand -hex 48)

sed -i.bak \
  -e "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${DB_PASS}|" \
  -e "s|^DATABASE_URL=.*|DATABASE_URL=postgresql://xiaotao:${DB_PASS}@db:5432/xiaotao?schema=public|" \
  -e "s|^JWT_SECRET=.*|JWT_SECRET=${JWT}|" \
  .env
rm -f .env.bak

# 备份加密密钥（仅本机保留；丢失后历史备份不可解密）
if [ ! -f backup.key ]; then
  openssl rand -hex 32 > backup.key
  chmod 600 backup.key
  echo '[2/3] 已生成备份加密密钥 backup.key —— 请另行抄存一份（密码管理器/纸面保险柜）'
else
  echo '[2/3] backup.key 已存在，保持不变'
fi

echo '[3/3] 完成。密钥已写入 .env（该文件已被 .gitignore 排除，绝不入仓库）'
