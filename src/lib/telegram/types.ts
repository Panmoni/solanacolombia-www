// The subset of the Telegram Bot API and of D1 that the reputation bot uses.
// Kept structural so the unit tests can stand in a node:sqlite database and a
// fake Telegram client.

export interface TgUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  username?: string;
}

export interface TgChat {
  id: number;
  type: string;
}

export interface TgMessageEntity {
  type: string;
  offset: number;
  length: number;
  user?: TgUser;
}

export interface TgMessage {
  message_id: number;
  date: number;
  chat: TgChat;
  from?: TgUser;
  text?: string;
  caption?: string;
  entities?: TgMessageEntity[];
  reply_to_message?: TgMessage;
  new_chat_members?: TgUser[];
}

/** A vote in a non-anonymous poll the bot posted. Empty option_ids = vote retracted. */
export interface TgPollAnswer {
  poll_id: string;
  /** Absent when the member voted on behalf of an anonymous chat. */
  user?: TgUser;
  option_ids: number[];
}

export interface TgUpdate {
  update_id: number;
  message?: TgMessage;
  poll_answer?: TgPollAnswer;
}

export interface SendOptions {
  /** Message to reply to. */
  replyTo?: number;
  /** Send `text` as Telegram HTML instead of plain text. */
  html?: boolean;
}

export interface SentPoll {
  messageId: number;
  pollId: string;
}

export interface TelegramClient {
  sendMessage(chatId: number, text: string, options?: SendOptions): Promise<{ message_id: number }>;
  pinChatMessage(chatId: number, messageId: number): Promise<void>;
  /** Posts a non-anonymous, multiple-answer poll. */
  sendPoll(chatId: number, question: string, options: string[]): Promise<SentPoll>;
}

export interface SqlStatement {
  bind(...values: unknown[]): SqlStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<{ meta: { changes: number } }>;
}

export interface SqlDatabase {
  prepare(query: string): SqlStatement;
}

export interface BotConfig {
  groupId: number;
  georgeId: number;
}

export interface BotTexts {
  /** content/telegram/primer-envio.md */
  primerEnvio: string;
  /** content/telegram/reglas.md */
  reglas: string;
  /** content/telegram/encuesta.md */
  encuesta: string;
}

export interface BotDeps {
  db: SqlDatabase;
  telegram: TelegramClient;
  config: BotConfig;
  texts: BotTexts;
  now: () => Date;
}
