// Test doubles for the reputation bot: a D1-shaped wrapper over node:sqlite
// that runs the real migration, and a Telegram client that records calls.
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import type {
  BotDeps,
  SendOptions,
  SqlDatabase,
  SqlStatement,
  TelegramClient,
  TgMessage,
  TgUpdate,
  TgUser,
} from '../../src/lib/telegram/types.ts';

const MIGRATION = new URL('../../migrations/d1/0001_telegram_reputation.sql', import.meta.url);

type SqlValue = string | number | null;

const statement = (db: DatabaseSync, query: string, params: SqlValue[] = []): SqlStatement => ({
  bind: (...values: unknown[]) => statement(db, query, values as SqlValue[]),
  first: async <T>() => (db.prepare(query).get(...params) as T | undefined) ?? null,
  all: async <T>() => ({ results: db.prepare(query).all(...params) as T[] }),
  run: async () => ({ meta: { changes: Number(db.prepare(query).run(...params).changes) } }),
});

/** Plain-object rows (node:sqlite returns null-prototype objects). */
export const selectRows = (db: DatabaseSync, query: string): Record<string, unknown>[] =>
  db
    .prepare(query)
    .all()
    .map((row) => ({ ...row }));

export const createTestDb = (): SqlDatabase & { raw: DatabaseSync } => {
  const raw = new DatabaseSync(':memory:');
  raw.exec(readFileSync(MIGRATION, 'utf8'));
  return { raw, prepare: (query: string) => statement(raw, query) };
};

export interface SentMessage {
  chatId: number;
  text: string;
  options: SendOptions;
}

export const createFakeTelegram = () => {
  const sent: SentMessage[] = [];
  const pinned: { chatId: number; messageId: number }[] = [];
  let nextId = 1000;
  const client: TelegramClient = {
    sendMessage: async (chatId, text, options = {}) => {
      sent.push({ chatId, text, options });
      nextId += 1;
      return { message_id: nextId };
    },
    pinChatMessage: async (chatId, messageId) => {
      pinned.push({ chatId, messageId });
    },
  };
  return { client, sent, pinned };
};

export const GROUP_ID = -1_001_234_567_890;
export const GEORGE_ID = 1;

export const user = (id: number, username?: string): TgUser => ({
  id,
  is_bot: false,
  first_name: `User${id}`,
  ...(username && { username }),
});

export const GEORGE = user(GEORGE_ID, 'george');

export const createHarness = (startAt = '2026-11-01T12:00:00.000Z') => {
  const db = createTestDb();
  const telegram = createFakeTelegram();
  let now = new Date(startAt);
  let updateId = 0;
  let messageId = 0;
  const deps: BotDeps = {
    db,
    telegram: telegram.client,
    config: { groupId: GROUP_ID, georgeId: GEORGE_ID },
    texts: {
      primerEnvio: '# Primer Envío\n\nUsa `/ship <link>`.',
      reglas: '# Reglas\n\n**Sé amable.**',
    },
    now: () => now,
  };

  const message = (from: TgUser, text: string, extra: Partial<TgMessage> = {}): TgUpdate => {
    messageId += 1;
    updateId += 1;
    const entities = [...text.matchAll(/@[A-Za-z0-9_]+/g)].map((match) => ({
      type: 'mention',
      offset: match.index,
      length: match[0].length,
    }));
    return {
      update_id: updateId,
      message: {
        message_id: messageId,
        date: Math.floor(now.getTime() / 1000),
        chat: { id: GROUP_ID, type: 'supergroup' },
        from,
        text,
        entities,
        ...extra,
      },
    };
  };

  return {
    db,
    deps,
    telegram,
    message,
    setNow: (iso: string) => {
      now = new Date(iso);
    },
    lastReply: () => telegram.sent.at(-1)?.text,
  };
};
