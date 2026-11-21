// Minimal Telegram Bot API client. The token is only ever part of the request
// URL; errors carry Telegram's description, never the URL.
import type { SendOptions, TelegramClient } from './types.ts';

interface ApiResponse<T> {
  ok: boolean;
  result?: T;
  description?: string;
}

export const createTelegramClient = (
  token: string,
  fetchImpl: typeof fetch = fetch,
): TelegramClient => {
  const call = async <T>(method: string, body: Record<string, unknown>): Promise<T> => {
    const response = await fetchImpl(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = (await response.json()) as ApiResponse<T>;
    if (!(data.ok && data.result !== undefined)) {
      throw new Error(`Telegram ${method} failed: ${data.description ?? response.status}`);
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
