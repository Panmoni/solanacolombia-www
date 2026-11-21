import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { createTelegramClient } from '../../src/lib/telegram/telegram-api.ts';
import { createYoutubeComments } from '../../src/lib/telegram/youtube.ts';

const TOKEN = '123456:TEST-token';

const fakeFetch =
  (respond: () => Response | Promise<Response>): typeof fetch =>
  async () =>
    respond();

describe('createTelegramClient', () => {
  test('sendPoll posts a non-anonymous multiple-answer poll and returns its ids', async () => {
    const calls: { url: string; body: unknown }[] = [];
    const client = createTelegramClient(TOKEN, async (input, init) => {
      calls.push({ url: String(input), body: JSON.parse(String(init?.body)) });
      return Response.json({ ok: true, result: { message_id: 7, poll: { id: 'p1' } } });
    });

    assert.deepEqual(await client.sendPoll(-100, '¿Qué?', ['Uno', 'Dos']), {
      messageId: 7,
      pollId: 'p1',
    });
    assert.equal(calls[0].url, `https://api.telegram.org/bot${TOKEN}/sendPoll`);
    assert.deepEqual(calls[0].body, {
      chat_id: -100,
      question: '¿Qué?',
      options: [{ text: 'Uno' }, { text: 'Dos' }],
      is_anonymous: false,
      allows_multiple_answers: true,
    });
  });

  test('sendPoll rejects a reply without a poll', async () => {
    const client = createTelegramClient(
      TOKEN,
      fakeFetch(() => Response.json({ ok: true, result: { message_id: 7 } })),
    );
    await assert.rejects(client.sendPoll(-100, '¿Qué?', ['Uno', 'Dos']), /without a poll/);
  });

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

describe('createYoutubeComments', () => {
  const page = (comments: [string, string][], nextPageToken?: string) =>
    Response.json({
      ...(nextPageToken && { nextPageToken }),
      items: comments.map(([textOriginal, publishedAt]) => ({
        snippet: { topLevelComment: { snippet: { textOriginal, publishedAt } } },
      })),
    });

  test('resolves the channel, pages by time and stops at the first comment before the window', async () => {
    const urls: URL[] = [];
    const responses = [
      Response.json({ items: [{ id: 'UC123' }] }),
      page(
        [
          ['Nuevo', '2026-11-30T00:00:00Z'],
          ['  ', '2026-11-29T00:00:00Z'],
        ],
        'next',
      ),
      page([
        ['Dentro', '2026-11-02T00:00:00Z'],
        ['Fuera', '2026-10-30T00:00:00Z'],
        ['Más fuera', '2026-10-01T00:00:00Z'],
      ]),
    ];
    const comments = createYoutubeComments('KEY', async (input) => {
      urls.push(new URL(String(input)));
      return responses.shift() ?? Response.json({});
    });

    assert.deepEqual(await comments(new Date('2026-11-01T00:00:00Z')), ['Nuevo', 'Dentro']);
    assert.equal(urls[0].pathname, '/youtube/v3/channels');
    assert.equal(urls[0].searchParams.get('forHandle'), 'SolanaColombia');
    assert.equal(urls[1].searchParams.get('allThreadsRelatedToChannelId'), 'UC123');
    assert.equal(urls[1].searchParams.get('order'), 'time');
    assert.equal(urls[1].searchParams.get('pageToken'), null);
    assert.equal(urls[2].searchParams.get('pageToken'), 'next');
    assert.equal(urls.length, 3);
  });

  test('errors name the endpoint and YouTube message, never the key', async () => {
    const forbidden = createYoutubeComments('SECRET-KEY', async () =>
      Response.json({ error: { message: 'quotaExceeded' } }, { status: 403 }),
    );
    await assert.rejects(forbidden(new Date()), (error: Error) => {
      assert.match(error.message, /YouTube channels failed \(403\): quotaExceeded/);
      assert.doesNotMatch(error.message, /SECRET-KEY/);
      return true;
    });

    const offline = createYoutubeComments('SECRET-KEY', async () => {
      throw new TypeError('fetch failed for https://…?key=SECRET-KEY');
    });
    await assert.rejects(
      offline(new Date()),
      /^Error: YouTube channels request failed: TypeError$/,
    );

    const noChannel = createYoutubeComments('SECRET-KEY', async () => Response.json({ items: [] }));
    await assert.rejects(noChannel(new Date()), /@SolanaColombia not found/);
  });
});
