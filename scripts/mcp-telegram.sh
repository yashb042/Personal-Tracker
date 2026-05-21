#!/usr/bin/env bash
# Launches Telegram Bot MCP using credentials from .env (never commit .env).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "$ROOT/.env"
  set +a
fi
if [[ -z "${TELEGRAM_BOT_TOKEN:-}" ]]; then
  echo "TELEGRAM_BOT_TOKEN missing. Run: $ROOT/scripts/setup-telegram-env.sh" >&2
  exit 1
fi
exec npx -y @node2flow/telegram-bot-mcp
