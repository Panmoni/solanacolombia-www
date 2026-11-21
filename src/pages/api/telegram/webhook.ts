// src/pages/api/telegram/webhook.ts
// Telegram webhook for the reputation bot (PAN-418). Registered with setWebhook
// by scripts/telegram/setup-webhook.sh.
import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { botDepsFromEnv } from '../../../lib/telegram/env';
import { handleWebhookRequest } from '../../../lib/telegram/webhook';

export const prerender = false;

export const ALL: APIRoute = ({ request }) => {
  const workerEnv = env as Env;
  return handleWebhookRequest(request, workerEnv.TELEGRAM_WEBHOOK_SECRET, () =>
    botDepsFromEnv(workerEnv),
  );
};
