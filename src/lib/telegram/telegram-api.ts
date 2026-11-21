// Minimal Telegram Bot API client. The token is only ever part of the request
// URL; errors carry Telegram's description, never the URL.
import type { SendOptions, TelegramClient } from './types.ts';

interface ApiResponse<T> {
  ok: boolean;
  result?: T;
  error_code?: number;
  description?: string;
}

const REQUEST_TIMEOUT_MS = 10_000;

export const createTelegramClient = (
  token: string,
  fetchImpl: typeof fetch = fetch,
): TelegramClient => {
  const call = async <T>(method: string, body: Record<string, unknown>): Promise<T> => {
    let response: Response;
    try {
      response = await fetchImpl(`https://api.telegram.org/bot${token}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      // Only the error name: a runtime's message may quote the URL, token included.
      const name = error instanceof Error ? error.name : 'unknown error';
      throw new Error(`Telegram ${method} request failed: ${name}`);
    }
    let data: ApiResponse<T>;
    try {
      data = (await response.json()) as ApiResponse<T>;
    } catch {
      throw new Error(`Telegram ${method} returned HTTP ${response.status} with a non-JSON body`);
    }
    if (!(data.ok && data.result !== undefined)) {
      const code = data.error_code ?? response.status;
      throw new Error(
        `Telegram ${method} failed (${code}): ${data.description ?? 'no description'}`,
      );
    }
    return data.result;
  };

  return {
    sendMessage: (chatId: number, text: string, options: SendOptions = {}) =>
      call<{ message_id: number }>('sendMessage', {
        chat_id: chatId,
        text,
        ...(options.html && { parse_mode: 'HTML' }),
        ...(options.replyTo && {
          reply_parameters: { message_id: options.replyTo, allow_sending_without_reply: true },
        }),
        link_preview_options: { is_disabled: true },
      }),
    pinChatMessage: async (chatId: number, messageId: number) => {
      await call<boolean>('pinChatMessage', { chat_id: chatId, message_id: messageId });
    },
  };
};
