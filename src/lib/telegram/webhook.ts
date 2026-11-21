// The Telegram webhook. Telegram sends the secret set with setWebhook in the
// X-Telegram-Bot-Api-Secret-Token header; anything without a matching header
// gets 401 before the body is read.
import { handleUpdate } from './bot.ts';
import type { BotDeps, TgUpdate } from './types.ts';

export const SECRET_HEADER = 'X-Telegram-Bot-Api-Secret-Token';

/** Constant-time comparison; an unset or empty secret never matches. */
export const isAuthorizedWebhook = (header: string | null, secret: string | undefined): boolean => {
  if (!(secret && header)) {
    return false;
  }
  const encoder = new TextEncoder();
  const a = encoder.encode(header);
  const b = encoder.encode(secret);
  let diff = a.length ^ b.length;
  for (let index = 0; index < b.length; index += 1) {
    diff |= (a[index] ?? 0) ^ b[index];
  }
  return diff === 0;
};

/**
 * `makeDeps` returns the bot's dependencies, or the names of the secrets that
 * are missing. A handler error answers 500: the update id is recorded only
 * after success, so Telegram's redelivery is handled again.
 */
export const handleWebhookRequest = async (
  request: Request,
  secret: string | undefined,
  makeDeps: () => BotDeps | string[],
): Promise<Response> => {
  if (!secret) {
    console.error('telegram webhook: TELEGRAM_WEBHOOK_SECRET is not set; rejecting every update');
  }
  if (!isAuthorizedWebhook(request.headers.get(SECRET_HEADER), secret)) {
    return new Response('Unauthorized', { status: 401 });
  }
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
  }

  let update: TgUpdate;
  try {
    update = (await request.json()) as TgUpdate;
  } catch {
    return new Response('Bad Request', { status: 400 });
  }
  if (typeof update?.update_id !== 'number') {
    return new Response('Bad Request', { status: 400 });
  }

  const deps = makeDeps();
  if (Array.isArray(deps)) {
    console.error(`telegram webhook: missing or invalid secrets: ${deps.join(', ')}`);
    return new Response('Service Unavailable', { status: 503 });
  }
  try {
    await handleUpdate(update, deps);
  } catch (error) {
    console.error(
      `telegram webhook: update ${update.update_id} failed; Telegram will retry`,
      error,
    );
    return new Response('Internal Server Error', { status: 500 });
  }
  return new Response('ok');
};
