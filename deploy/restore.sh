#!/usr/bin/env bash
# 恢复备份：./restore.sh backups/xiaotao-YYYYmmdd-HHMM.sql.gz.enc
# 危险操作：会覆盖当前数据库全部数据 —— 需输入 YES 确认。
set -euo pipefail
cd "$(dirname "$0")"
FILE=${1:-}
[ -n "$FILE" ] && [ -f "$FILE" ] || { echo "用法：$0 backups/xiaotao-YYYYmmdd-HHMM.sql.gz.enc"; exit 1; }
[ -f backup.key ] || { echo '错误：缺少 backup.key'; exit 1; }

read -r -p '将清空并恢复数据库，输入 YES 确认：' CONFIRM
[ "$CONFIRM" = 'YES' ] || { echo '已取消'; exit 1; }

echo '解密并恢复中...'
docker compose exec -T db psql -U "${POSTGRES_USER:-xiaotao}" -d postgres \
  -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='${POSTGRES_DB:-xiaotao}';" \
  -c "DROP DATABASE IF EXISTS ${POSTGRES_DB:-xiaotao};" \
  -c "CREATE DATABASE ${POSTGRES_DB:-xiaotao};"

openssl enc -d -aes-256-cbc -pbkdf2 -pass file:backup.key -in "$FILE" \
  | gunzip \
  | docker compose exec -T db psql -v ON_ERROR_STOP=1 -U "${POSTGRES_USER:-xiaotao}" -d "${POSTGRES_DB:-xiaotao}"

echo '恢复完成，自检：'
docker compose exec -T api wget -qO- http://127.0.0.1:8787/api/v1/health && echo
