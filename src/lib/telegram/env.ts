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

/**
 * The bot's dependencies, or the names of the secrets that are missing or
 * malformed, so callers can log exactly what to fix.
 */
export const botDepsFromEnv = (env: Env): BotDeps | string[] => {
  const groupId = toId(env.TELEGRAM_GROUP_ID);
  const georgeId = toId(env.GEORGE_TELEGRAM_ID);
  const problems = [
    ...(env.DB ? [] : ['DB (D1 binding)']),
    ...(env.TELEGRAM_BOT_TOKEN ? [] : ['TELEGRAM_BOT_TOKEN']),
    ...(groupId === null ? ['TELEGRAM_GROUP_ID (must be an integer)'] : []),
    ...(georgeId === null ? ['GEORGE_TELEGRAM_ID (must be an integer)'] : []),
  ];
  if (!(env.DB && env.TELEGRAM_BOT_TOKEN && groupId !== null && georgeId !== null)) {
    return problems;
  }
  return {
    db: env.DB,
    telegram: createTelegramClient(env.TELEGRAM_BOT_TOKEN),
    config: { groupId, georgeId },
    texts: { primerEnvio, reglas },
    now: () => new Date(),
  };
};
