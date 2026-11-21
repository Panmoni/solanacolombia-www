import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { createTelegramClient } from '../../src/lib/telegram/telegram-api.ts';

const TOKEN = '123456:TEST-token';

const fakeFetch =
  (respond: () => Response | Promise<Response>): typeof fetch =>
  async () =>
    respond();

describe('createTelegramClient', () => {
  test('returns the result of a successful call', async () => {
    const client = createTelegramClient(
      TOKEN,
      fakeFetch(() => Response.json({ ok: true, result: { message_id: 7 } })),
    );
    assert.deepEqual(await client.sendMessage(1, 'hola'), { message_id: 7 });
  });

  test('an API error names the method and code, never the token', async () => {
    const client = createTelegramClient(
      TOKEN,
      fakeFetch(() =>
        Response.json(
          { ok: false, error_code: 403, description: 'Forbidden: bot is not a member' },
          { status: 403 },
        ),
      ),
    );
    await assert.rejects(client.sendMessage(1, 'hola'), (error: Error) => {
      assert.equal(
        error.message,
        'Telegram sendMessage failed (403): Forbidden: bot is not a member',
      );
      return true;
    });
  });

  test('a non-JSON body reports the HTTP status', async () => {
    const client = createTelegramClient(
      TOKEN,
      fakeFetch(() => new Response('<html>Bad Gateway</html>', { status: 502 })),
    );
    await assert.rejects(client.pinChatMessage(1, 2), {
      message: 'Telegram pinChatMessage returned HTTP 502 with a non-JSON body',
    });
  });

  test('a network failure never echoes the URL', async () => {
    const client = createTelegramClient(
      TOKEN,
      fakeFetch(() => {
        throw new TypeError(`fetch failed: https://api.telegram.org/bot${TOKEN}/sendMessage`);
      }),
    );
    await assert.rejects(client.sendMessage(1, 'hola'), (error: Error) => {
      assert.equal(error.message, 'Telegram sendMessage request failed: TypeError');
      assert.ok(!error.message.includes(TOKEN));
      return true;
    });
  });
});
