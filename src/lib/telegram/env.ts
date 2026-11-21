// Builds the bot's dependencies from the Worker environment. All four values
// are Worker secrets (wrangler secret put …), never source.
import primerEnvio from '../../../content/telegram/primer-envio.md?raw';
import reglas from '../../../content/telegram/reglas.md?raw';
import { createTelegramClient } from './telegram-api.ts';
import type { BotDeps } from './types.ts';

const toId = (value: string | undefined): number | null => {
  const id = Number(value);
  return value && Number.isSafeInteger(id) ? id : null;
};

/** Null when a secret is missing, so callers log it instead of half-running. */
export const botDepsFromEnv = (env: Env): BotDeps | null => {
  const groupId = toId(env.TELEGRAM_GROUP_ID);
  const georgeId = toId(env.GEORGE_TELEGRAM_ID);
  if (!(env.DB && env.TELEGRAM_BOT_TOKEN && groupId !== null && georgeId !== null)) {
    return null;
  }
  return {
    db: env.DB,
    telegram: createTelegramClient(env.TELEGRAM_BOT_TOKEN),
    config: { groupId, georgeId },
    texts: { primerEnvio, reglas },
    now: () => new Date(),
  };
};
