/// <reference types="astro/client" />

interface Env {
  DB: import('@cloudflare/workers-types').D1Database;
  RESEND_API_KEY: string;
  SESSION_SECRET: string;
  ADMIN_WALLET: string;
}
