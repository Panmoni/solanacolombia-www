import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { CRON_JOBS } from '../../src/lib/telegram/cron.ts';
import { recordJoinMessage, savePollAnswer, upsertMember } from '../../src/lib/telegram/store.ts';
import {
  formatInputText,
  gatherInputs,
  parseThemes,
  runMonthlySummary,
  SUMMARY_MODEL,
  type SummaryInput,
} from '../../src/lib/telegram/summary.ts';
import type { AiClient } from '../../src/lib/telegram/types.ts';
import { createHarness, GEORGE_ID, selectRows, user } from './helpers.ts';

type Harness = ReturnType<typeof createHarness>;

// The summary runs on 2026-12-01; its window starts 2026-11-01T14:00Z.
const RUN_AT = '2026-12-01T14:00:00.000Z';

const addJoin = async (harness: Harness, id: number, text: string, at: string) => {
  const now = new Date(at);
  await upsertMember(harness.db, user(id), now);
  await recordJoinMessage(harness.db, id, text, id * 10, now);
};

const addPollAnswer = async (harness: Harness, id: number, options: string[], at: string) => {
  const now = new Date(at);
  await upsertMember(harness.db, user(id), now);
  await savePollAnswer(
    harness.db,
    {
      pollId: 'poll-1',
      memberId: id,
      question: '¿Qué quieres aprender?',
      optionIds: options.map((_, index) => index),
      optionTexts: options,
    },
    now,
  );
};

/** 4 join messages, 4 poll answers and the given YouTube comments, all inside the window. */
const fixture = async (comments: string[] = ['Hagan un tutorial de Anchor por favor']) => {
  const harness = createHarness(RUN_AT);
  await addJoin(harness, 2, 'Hola, quiero aprender Anchor', '2026-11-05T10:00:00.000Z');
  await addJoin(harness, 3, 'Busco hacer pagos con USDC', '2026-11-10T10:00:00.000Z');
  await addJoin(harness, 4, 'Me interesa  DeFi\ny préstamos', '2026-11-12T10:00:00.000Z');
  await addJoin(harness, 5, 'Quiero mi primer programa en Anchor', '2026-11-20T10:00:00.000Z');
  // Outside the window: never read.
  await addJoin(harness, 6, 'Mensaje viejo', '2026-10-20T10:00:00.000Z');
  await addPollAnswer(harness, 7, ['Anchor'], '2026-11-26T10:00:00.000Z');
  await addPollAnswer(harness, 8, ['Anchor', 'Pagos'], '2026-11-26T11:00:00.000Z');
  await addPollAnswer(harness, 9, ['DeFi'], '2026-11-27T10:00:00.000Z');
  await addPollAnswer(harness, 10, ['Pagos'], '2026-11-28T10:00:00.000Z');
  harness.deps.youtubeComments = async () => comments;
  return harness;
};

const mockAi = (response: unknown) => {
  const calls: { model: string; inputs: Record<string, unknown> }[] = [];
  const ai: AiClient = {
    run: async (model, inputs) => {
      calls.push({ model, inputs });
      return { response };
    },
  };
  return { ai, calls };
};

const THEMES = {
  temas: [
    { tema: 'Pagos con stablecoins', cantidad: 3, cita: 'Busco hacer pagos con USDC' },
    { tema: 'Anchor', cantidad: 5, cita: 'quiero aprender Anchor' },
  ],
};

const summaries = (harness: Harness) =>
  selectRows(
    harness.db.raw,
    'SELECT period_start, period_end, input_count, status, themes, message FROM tg_summaries',
  );

describe('summary inputs', () => {
  test('builds the input text from the last month of joins, poll answers and YouTube', async () => {
    const harness = await fixture();
    const since = new Date('2026-11-01T14:00:00.000Z');
    let youtubeSince: Date | undefined;
    harness.deps.youtubeComments = async (date) => {
      youtubeSince = date;
      return ['Hagan un tutorial de Anchor por favor'];
    };

    const { inputs, youtubeNote } = await gatherInputs(harness.deps, since);

    assert.equal(youtubeNote, null);
    assert.deepEqual(youtubeSince, since);
    assert.equal(
      formatInputText(inputs),
      [
        '1. [unión] Hola, quiero aprender Anchor',
        '2. [unión] Busco hacer pagos con USDC',
        '3. [unión] Me interesa DeFi y préstamos',
        '4. [unión] Quiero mi primer programa en Anchor',
        '5. [encuesta] ¿Qué quieres aprender? → Anchor',
        '6. [encuesta] ¿Qué quieres aprender? → Anchor, Pagos',
        '7. [encuesta] ¿Qué quieres aprender? → DeFi',
        '8. [encuesta] ¿Qué quieres aprender? → Pagos',
        '9. [YouTube] Hagan un tutorial de Anchor por favor',
      ].join('\n'),
    );
  });

  test('without YOUTUBE_API_KEY or with a YouTube error, D1 inputs still count and the note says why', async () => {
    const harness = await fixture();
    harness.deps.youtubeComments = undefined;
    const missing = await gatherInputs(harness.deps, new Date('2026-11-01T14:00:00.000Z'));
    assert.equal(missing.inputs.length, 8);
    assert.match(missing.youtubeNote ?? '', /falta el secreto YOUTUBE_API_KEY/);

    harness.deps.youtubeComments = async () => {
      throw new Error('YouTube commentThreads failed (403): quota');
    };
    const failed = await gatherInputs(harness.deps, new Date('2026-11-01T14:00:00.000Z'));
    assert.equal(failed.inputs.length, 8);
    assert.match(failed.youtubeNote ?? '', /403\): quota/);
  });
});

describe('parseThemes', () => {
  const inputs: SummaryInput[] = [
    { source: 'unión', text: 'Hola, quiero aprender Anchor' },
    { source: 'unión', text: 'Busco hacer pagos con USDC' },
  ];

  test('accepts an object or a JSON string, sorts by count and caps at 5', () => {
    const many = Array.from({ length: 7 }, (_, index) => ({
      tema: `T${index}`,
      cantidad: index % 2 === 0 ? 1 : 2,
      cita: 'quiero aprender',
    }));
    const themes = parseThemes({ response: JSON.stringify({ temas: many }) }, inputs);
    assert.equal(themes.length, 5);
    assert.deepEqual(
      themes.map((theme) => theme.cantidad),
      [2, 2, 2, 1, 1],
    );
    assert.deepEqual(parseThemes({ response: { temas: [many[0]] } }, inputs), [
      { tema: 'T0', cantidad: 1, cita: 'quiero aprender' },
    ]);
  });

  test('drops invented quotes, bad counts and malformed items', () => {
    const themes = parseThemes(
      {
        response: {
          temas: [
            { tema: 'Inventado', cantidad: 1, cita: 'algo que nadie dijo' },
            { tema: 'Demasiados', cantidad: 3, cita: 'pagos con USDC' },
            { tema: 'Cero', cantidad: 0, cita: 'pagos con USDC' },
            { tema: '', cantidad: 1, cita: 'pagos con USDC' },
            { tema: 'Sin cita', cantidad: 1 },
            { tema: 'Corta', cantidad: 1, cita: 'Anchor' },
            { tema: 'Empalmada', cantidad: 1, cita: 'aprender Anchor Busco hacer' },
            'texto',
            { tema: 'Bueno', cantidad: 1, cita: '«Busco hacer  pagos»' },
          ],
        },
      },
      inputs,
    );
    assert.deepEqual(themes, [{ tema: 'Bueno', cantidad: 1, cita: 'Busco hacer  pagos' }]);
  });

  test('returns no themes for unparseable output', () => {
    assert.deepEqual(parseThemes({ response: 'no es JSON' }, inputs), []);
    assert.deepEqual(parseThemes({ response: { otro: 1 } }, inputs), []);
    assert.deepEqual(parseThemes(null, inputs), []);
  });
});

describe('monthly summary', () => {
  test('sends George at most 5 themes in Spanish, each with a count and a quote, and stores them', async () => {
    const harness = await fixture(['Hagan un tutorial de Anchor por favor', 'Más de Solana Pay']);
    const { ai, calls } = mockAi(THEMES);
    harness.deps.ai = ai;

    await runMonthlySummary(harness.deps);

    assert.equal(calls.length, 1);
    assert.equal(calls[0].model, SUMMARY_MODEL);
    const messages = calls[0].inputs.messages as { role: string; content: string }[];
    assert.match(messages[0].content, /máximo de 5 temas/);
    assert.match(messages[1].content, /^1\. \[unión\] Hola, quiero aprender Anchor$/m);

    const expected = [
      'Resumen mensual: qué quieren los builders',
      'Del 2026-11-01 al 2026-12-01 · 10 entradas (unión: 4, encuesta: 4, YouTube: 2)',
      '',
      '1. Anchor (5)',
      '   «quiero aprender Anchor»',
      '2. Pagos con stablecoins (3)',
      '   «Busco hacer pagos con USDC»',
    ].join('\n');
    assert.deepEqual(harness.telegram.sent, [{ chatId: GEORGE_ID, text: expected, options: {} }]);
    assert.deepEqual(summaries(harness), [
      {
        period_start: '2026-11-01T14:00:00.000Z',
        period_end: RUN_AT,
        input_count: 10,
        status: 'themes',
        themes: JSON.stringify([
          { tema: 'Anchor', cantidad: 5, cita: 'quiero aprender Anchor' },
          { tema: 'Pagos con stablecoins', cantidad: 3, cita: 'Busco hacer pagos con USDC' },
        ]),
        message: expected,
      },
    ]);
  });

  test('with fewer than 10 inputs, says the data is too thin and lists the raw inputs', async () => {
    const harness = await fixture();
    const { ai, calls } = mockAi(THEMES);
    harness.deps.ai = ai;

    await runMonthlySummary(harness.deps);

    assert.equal(calls.length, 0);
    const text = harness.telegram.sent[0].text;
    assert.equal(harness.telegram.sent[0].chatId, GEORGE_ID);
    assert.match(text, /^Resumen mensual: pocos datos \(menos de 10 entradas\)/);
    assert.match(text, /9 entradas/);
    assert.match(text, /^Entradas:$/m);
    assert.match(text, /^- \[unión\] Hola, quiero aprender Anchor$/m);
    assert.match(text, /^- \[encuesta\] ¿Qué quieres aprender\? → Anchor, Pagos$/m);
    assert.match(text, /^- \[YouTube\] Hagan un tutorial de Anchor por favor$/m);
    assert.doesNotMatch(text, /Mensaje viejo/);
    const [row] = summaries(harness);
    assert.equal(row.status, 'thin');
    assert.equal(row.themes, null);
    assert.equal(row.message, text);
  });

  test('an empty month still sends a DM', async () => {
    const harness = createHarness(RUN_AT);
    await runMonthlySummary(harness.deps);
    assert.match(harness.telegram.sent[0].text, /No hay entradas este mes\./);
    assert.match(harness.telegram.sent[0].text, /falta el secreto YOUTUBE_API_KEY/);
  });

  test('when the AI fails or returns nothing usable, the raw inputs go out instead', async () => {
    for (const ai of [
      {
        run: async () => {
          throw new Error('3036: daily free allocation used');
        },
      },
      mockAi({ temas: [{ tema: 'X', cantidad: 1, cita: 'inventado' }] }).ai,
      undefined,
    ]) {
      const harness = await fixture(['Hagan un tutorial de Anchor por favor', 'Más de Solana Pay']);
      harness.deps.ai = ai;
      await runMonthlySummary(harness.deps);
      const text = harness.telegram.sent[0].text;
      assert.match(text, /van las entradas sin resumir/);
      assert.match(text, /^- \[YouTube\] Más de Solana Pay$/m);
      assert.equal(summaries(harness)[0].status, 'ai_failed');
    }
  });

  test('a long list is cut to fit one Telegram message', async () => {
    const harness = createHarness(RUN_AT);
    harness.deps.youtubeComments = async () =>
      Array.from({ length: 60 }, (_, index) => `Comentario ${index} ${'x'.repeat(200)}`);
    await runMonthlySummary(harness.deps);
    const text = harness.telegram.sent[0].text;
    assert.ok(text.length <= 4096);
    assert.match(text, /… y \d+ más$/);
  });

  test('stores the summary before the DM, and a failed DM fails the run', async () => {
    const harness = await fixture();
    harness.deps.telegram.sendMessage = async () => {
      throw new Error('Telegram sendMessage failed (403): bot was blocked');
    };
    await assert.rejects(runMonthlySummary(harness.deps), /bot was blocked/);
    assert.equal(summaries(harness).length, 1);
  });

  test('reads back one calendar month, so a 31-day month leaves no gap', async () => {
    const harness = createHarness('2027-01-01T14:00:00.000Z');
    await runMonthlySummary(harness.deps);
    assert.equal(summaries(harness)[0].period_start, '2026-12-01T14:00:00.000Z');
  });

  test('runs on the 1st of the month', () => {
    assert.equal(CRON_JOBS['0 14 1 * *'].run, runMonthlySummary);
  });
});
