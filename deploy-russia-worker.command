#!/bin/bash
# Деплой Russia TV Worker на Cloudflare Workers
# Требует: npx wrangler, учётная запись Cloudflare с правами Workers

set -e
cd "$(dirname "$0")"

echo "📡 Деплой Russia TV Worker..."

# Если папки russia-worker нет — создаём её
if [ ! -d "$HOME/russia-worker" ]; then
  mkdir -p "$HOME/russia-worker/src"
  cat > "$HOME/russia-worker/wrangler.toml" << 'TOML'
name = "russia-worker"
main = "src/index.js"
compatibility_date = "2024-01-01"
TOML
  echo "✅ Создана папка ~/russia-worker"
fi

cp ~/russia-tv-hub/russia-worker.js "$HOME/russia-worker/src/index.js"
echo "✅ Скопирован russia-worker.js"

cd "$HOME/russia-worker"
npx wrangler deploy

echo ""
echo "✅ Russia Worker задеплоен: https://russia-worker.dyaltd.workers.dev"
echo ""
read -p "Нажмите Enter для закрытия..."
