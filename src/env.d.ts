/// <reference types="astro/client" />

interface Env {
  DB: import('@cloudflare/workers-types').D1Database;
  RESEND_API_KEY: string;
  SESSION_SECRET: string;
  ADMIN_WALLET: string;
  // Telegram reputation bot (PAN-418), all Worker secrets.
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_WEBHOOK_SECRET?: string;
  TELEGRAM_GROUP_ID?: string;
  GEORGE_TELEGRAM_ID?: string;
}
