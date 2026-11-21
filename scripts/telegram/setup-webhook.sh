#!/usr/bin/env bash
# Connects the Telegram reputation bot (PAN-418) to the deployed Worker:
#   1. generates a fresh TELEGRAM_WEBHOOK_SECRET,
#   2. stores it as a Worker secret (wrangler secret put),
#   3. registers https://solanacolombia.com/api/telegram/webhook with Telegram,
#      sending that secret in every update's X-Telegram-Bot-Api-Secret-Token header.
#
# Run from the repo root, after the Worker with the webhook route is deployed.
# It prompts for the bot token (from BotFather); the token is never echoed,
# never passed on a command line, and never written to disk.
#
# Usage: scripts/telegram/setup-webhook.sh [--dry-run]
#   --dry-run  checks the token with getMe and prints the plan; changes nothing.
set -euo pipefail

WEBHOOK_URL="https://solanacolombia.com/api/telegram/webhook"
dry_run=0
if [[ "${1:-}" == "--dry-run" ]]; then
  dry_run=1
fi

read -rsp "TELEGRAM_BOT_TOKEN: " token
echo
if [[ ! "$token" =~ ^[0-9]+:[A-Za-z0-9_-]+$ ]]; then
  echo "That does not look like a bot token (digits:letters)." >&2
  exit 1
fi

# Telegram API call with the token kept off the process list: curl reads the
# URL from its config on stdin.
telegram() {
  local method=$1
  shift
  printf 'url = "https://api.telegram.org/bot%s/%s"\n' "$token" "$method" |
    curl --silent --show-error --fail-with-body --config - "$@"
  echo
}

echo "Checking the token with getMe…"
telegram getMe

if ((dry_run)); then
  echo "Dry run: would set TELEGRAM_WEBHOOK_SECRET with wrangler and register ${WEBHOOK_URL}."
  exit 0
fi

secret=$(openssl rand -hex 32)

echo "Storing TELEGRAM_WEBHOOK_SECRET as a Worker secret…"
printf '%s' "$secret" | pnpm exec wrangler secret put TELEGRAM_WEBHOOK_SECRET

echo "Registering the webhook…"
telegram setWebhook \
  --data-urlencode "url=${WEBHOOK_URL}" \
  --data-urlencode "secret_token=${secret}" \
  --data-urlencode 'allowed_updates=["message"]'

echo "Webhook status:"
telegram getWebhookInfo
