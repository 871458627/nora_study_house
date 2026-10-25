#!/usr/bin/env bash
# 每日加密备份：pg_dump → gzip → AES-256 加密 → backups/（保留 14 份）
# crontab 示例（每天 03:30）：30 3 * * * /opt/xiaotao/deploy/backup.sh
set -euo pipefail
cd "$(dirname "$0")"
[ -f backup.key ] || { echo '错误：缺少 backup.key（gen-secrets.sh 生成）'; exit 1; }

STAMP=$(date +%Y%m%d-%H%M)
OUT="backups/xiaotao-${STAMP}.sql.gz.enc"

docker compose exec -T db pg_dump -U "${POSTGRES_USER:-xiaotao}" "${POSTGRES_DB:-xiaotao}" \
  | gzip \
  | openssl enc -aes-256-cbc -salt -pbkdf2 -pass file:backup.key \
    -out "$OUT"
chmod 600 "$OUT"

# 保留最近 14 份
ls -1t backups/xiaotao-*.sql.gz.enc 2>/dev/null | tail -n +15 | xargs -r rm -f
echo "已备份 ${OUT}（$(du -h "$OUT" | cut -f1)）。建议配置 rclone/网盘同步实现异地容灾（docs/09 §4.3）。"
