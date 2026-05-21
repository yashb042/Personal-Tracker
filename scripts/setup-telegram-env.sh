#!/usr/bin/env bash
# Creates .env for local MCP + documents GitHub secret values.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/.env"

echo "Telegram setup for Personal Tracker"
echo "===================================="
echo ""

read -rsp "Telegram Bot Token (from @BotFather): " TOKEN
echo ""
read -rp "Telegram Chat ID (numeric, from @userinfobot) [auto-detect]: " CHAT_ID
echo ""

if [[ -z "$CHAT_ID" ]]; then
  echo "Fetching chat ID from recent bot messages (send /start to your bot first)..."
  RESP=$(curl -s "https://api.telegram.org/bot${TOKEN}/getUpdates")
  CHAT_ID=$(echo "$RESP" | node -e "
    const d=JSON.parse(require('fs').readFileSync(0,'utf8'));
    const u=(d.result||[]).filter(x=>x.message?.chat?.id).pop();
    if(u) console.log(u.message.chat.id);
  " 2>/dev/null || true)
  if [[ -z "$CHAT_ID" ]]; then
    echo "Could not auto-detect. Message your bot, then re-run or enter ID manually."
    exit 1
  fi
  echo "Detected chat ID: $CHAT_ID"
fi

cat > "$ENV_FILE" <<EOF
TELEGRAM_BOT_TOKEN=${TOKEN}
TELEGRAM_CHAT_ID=${CHAT_ID}
EOF
chmod 600 "$ENV_FILE"
echo ""
echo "Wrote $ENV_FILE"
echo ""
echo "GitHub Actions secrets (repo → Settings → Secrets):"
echo "  TELEGRAM_BOT_TOKEN = (same token)"
echo "  TELEGRAM_CHAT_ID   = ${CHAT_ID}"
echo ""
echo "Restart Cursor to load Telegram MCP (.cursor/mcp.json)."
