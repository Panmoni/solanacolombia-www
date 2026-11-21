import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { handleUpdate } from '../../src/lib/telegram/bot.ts';
import { loadActivity } from '../../src/lib/telegram/store.ts';
import { buildDigest, levelUps, runWeekly } from '../../src/lib/telegram/weekly.ts';
import { createHarness, GEORGE, GEORGE_ID, GROUP_ID, selectRows, user } from './helpers.ts';

const ANA = user(2, 'ana');
const BETO = user(3, 'beto');

type Harness = ReturnType<typeof createHarness>;

const send = (harness: Harness, from: typeof ANA, text: string) =>
  handleUpdate(harness.message(from, text), harness.deps);

const enqueue = (harness: Harness, kind: string, body: string) =>
  harness.db.raw
    .prepare('INSERT INTO tg_weekly_queue (kind, body, created_at) VALUES (?, ?, ?)')
    .run(kind, body, '2026-10-01T00:00:00.000Z');

describe('weekly group post', () => {
  test('an empty queue skips the Reto and opportunity lines', async () => {
    const harness = createHarness();
    await send(harness, ANA, '/ship https://ana.dev');
    await send(harness, GEORGE, '/vouch @ana');
    harness.telegram.sent.length = 0;

    await runWeekly(harness.deps);

    const post = harness.telegram.sent.find((message) => message.chatId === GROUP_ID);
    assert.equal(
      post?.text,
      '🏆 Top 10 de la semana\n1. @ana — 10 pts (Constructor)\n2. @george — 1 pts (Visitante)',
    );
  });

  test('a full queue adds the oldest Reto and opportunity and marks them posted', async () => {
    const harness = createHarness();
    enqueue(harness, 'reto', 'Despliega un programa Anchor en devnet.');
    enqueue(harness, 'reto', 'Segundo reto.');
    enqueue(harness, 'oportunidad', 'Hackatón Colosseum: inscripciones abiertas.');

    await runWeekly(harness.deps);

    const post = harness.telegram.sent.find((message) => message.chatId === GROUP_ID);
    assert.equal(
      post?.text,
      [
        '🏆 Top 10 de la semana\nTodavía no hay puntos. Manda tu primer /ship.',
        '🎯 Reto de la semana\nDespliega un programa Anchor en devnet.',
        '💼 Oportunidad de la semana\nHackatón Colosseum: inscripciones abiertas.',
      ].join('\n\n'),
    );
    const pending = selectRows(
      harness.db.raw,
      'SELECT body FROM tg_weekly_queue WHERE posted_at IS NULL',
    );
    assert.deepEqual(pending, [{ body: 'Segundo reto.' }]);
  });
});

describe('weekly digest to George', () => {
  test('lists every member who crossed a level this week, with ship links', async () => {
    const harness = createHarness('2026-11-01T12:00:00.000Z');
    // Ana reached Constructor before this week.
    await send(harness, ANA, '/ship https://ana.dev/1');
    await send(harness, GEORGE, '/vouch @ana');

    harness.setNow('2026-11-18T12:00:00.000Z');
    // This week: Beto reaches Constructor, Ana adds a second ship (no level change).
    await send(harness, BETO, '/ship https://beto.dev');
    await send(harness, GEORGE, '/vouch @beto');
    await send(harness, ANA, '/ship https://ana.dev/2');
    await send(harness, GEORGE, '/vouch @ana');

    harness.setNow('2026-11-23T14:00:00.000Z');
    harness.telegram.sent.length = 0;
    await runWeekly(harness.deps);

    const digest = harness.telegram.sent.find((message) => message.chatId === GEORGE_ID);
    assert.equal(
      digest?.text,
      'Resumen semanal: subieron de nivel\n• @beto: Visitante → Constructor\n   https://beto.dev',
    );
  });

  test('says so when nobody moved up', () => {
    assert.equal(buildDigest([]), 'Resumen semanal: nadie subió de nivel esta semana.');
  });

  test('Shipper with all ship links', async () => {
    const harness = createHarness('2026-11-20T12:00:00.000Z');
    for (const path of ['1', '2', '3']) {
      await send(harness, ANA, `/ship https://ana.dev/${path}`);
      await send(harness, GEORGE, '/vouch @ana');
    }
    const ups = levelUps(await loadActivity(harness.db), new Date('2026-11-21T00:00:00.000Z'));
    assert.equal(
      buildDigest(ups),
      [
        'Resumen semanal: subieron de nivel',
        '• @ana: Visitante → Shipper',
        '   https://ana.dev/1',
        '   https://ana.dev/2',
        '   https://ana.dev/3',
      ].join('\n'),
    );
  });
});

describe('weekly failures', () => {
  test('a failed group post still sends the digest, then the run fails', async () => {
    const harness = createHarness();
    enqueue(harness, 'reto', 'Reto pendiente.');
    const realSend = harness.deps.telegram.sendMessage;
    harness.deps.telegram.sendMessage = async (chatId, text, options) => {
      if (chatId === GROUP_ID) {
        throw new Error('Telegram sendMessage failed (500): Internal Server Error');
      }
      return realSend(chatId, text, options);
    };

    await assert.rejects(runWeekly(harness.deps), AggregateError);
    assert.equal(harness.telegram.sent.at(-1)?.chatId, GEORGE_ID);
    // The Reto was never posted, so it stays queued.
    const pending = selectRows(
      harness.db.raw,
      'SELECT body FROM tg_weekly_queue WHERE posted_at IS NULL',
    );
    assert.deepEqual(pending, [{ body: 'Reto pendiente.' }]);
  });
});
