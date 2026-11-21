import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';
import { handleUpdate } from '../../src/lib/telegram/bot.ts';
import { CRON_JOBS } from '../../src/lib/telegram/cron.ts';
import { parseEncuesta, runMonthlyPoll } from '../../src/lib/telegram/poll.ts';
import { runMonthlySummary } from '../../src/lib/telegram/summary.ts';
import type { TgUpdate, TgUser } from '../../src/lib/telegram/types.ts';
import { runWeekly } from '../../src/lib/telegram/weekly.ts';
import { createHarness, GROUP_ID, selectRows, user } from './helpers.ts';

const ANA = user(2, 'ana');

type Harness = ReturnType<typeof createHarness>;

let nextUpdateId = 10_000;
const pollAnswer = (pollId: string, voter: TgUser | undefined, optionIds: number[]): TgUpdate => {
  nextUpdateId += 1;
  return {
    update_id: nextUpdateId,
    poll_answer: { poll_id: pollId, ...(voter && { user: voter }), option_ids: optionIds },
  };
};

const results = (harness: Harness) =>
  selectRows(
    harness.db.raw,
    'SELECT poll_id, member_id, question, option_ids, option_texts, created_at FROM tg_poll_results ORDER BY member_id',
  );

/** Posts the monthly poll and returns its Telegram poll id. */
const postPoll = async (harness: Harness): Promise<string> => {
  await runMonthlyPoll(harness.deps);
  const [row] = selectRows(harness.db.raw, 'SELECT poll_id FROM tg_polls');
  return String(row.poll_id);
};

describe('parseEncuesta', () => {
  test('the heading is the question, bullets are options, other lines are ignored', () => {
    assert.deepEqual(parseEncuesta('# ¿Qué?\n\nNota para editores.\n\n- Uno\n-  Dos \n'), {
      question: '¿Qué?',
      options: ['Uno', 'Dos'],
    });
  });

  test('the repo file parses within Telegram limits', () => {
    const markdown = readFileSync(
      new URL('../../content/telegram/encuesta.md', import.meta.url),
      'utf8',
    );
    const poll = parseEncuesta(markdown);
    assert.equal(poll.question, '¿Qué quieres construir o aprender el próximo mes?');
    assert.ok(poll.options.length >= 2 && poll.options.length <= 10);
  });

  test('rejects content Telegram would refuse', () => {
    assert.throws(() => parseEncuesta('- Uno\n- Dos'), /question/);
    assert.throws(() => parseEncuesta('# ¿Qué?\n- Uno'), /2-10 options, found 1/);
    assert.throws(() => parseEncuesta(`# ¿Qué?\n- Uno\n- ${'x'.repeat(101)}`), /1-100 characters/);
    assert.throws(() => parseEncuesta('# ¿Qué?\n- Uno\n- Uno'), /unique/);
    const eleven = Array.from({ length: 11 }, (_, index) => `- Opción ${index}`).join('\n');
    assert.throws(() => parseEncuesta(`# ¿Qué?\n${eleven}`), /found 11/);
  });
});

describe('monthly poll', () => {
  test('posts the encuesta to the group and stores the poll', async () => {
    const harness = createHarness();
    await runMonthlyPoll(harness.deps);

    assert.deepEqual(harness.telegram.polls, [
      {
        chatId: GROUP_ID,
        question: '¿Qué quieres aprender?',
        options: ['Anchor', 'Pagos', 'DeFi'],
      },
    ]);
    assert.deepEqual(selectRows(harness.db.raw, 'SELECT * FROM tg_polls'), [
      {
        poll_id: 'poll-1001',
        message_id: 1001,
        question: '¿Qué quieres aprender?',
        options: '["Anchor","Pagos","DeFi"]',
        created_at: '2026-11-01T12:00:00.000Z',
      },
    ]);
  });

  test('a bad encuesta fails the run without posting', async () => {
    const harness = createHarness();
    harness.deps.texts.encuesta = '# ¿Qué?\n- Solo una';
    await assert.rejects(runMonthlyPoll(harness.deps), /found 1/);
    assert.equal(harness.telegram.polls.length, 0);
  });

  test('a poll that posts but cannot be stored fails the run, naming the poll', async () => {
    const harness = createHarness();
    harness.db.raw.exec('DROP TABLE tg_polls');
    await assert.rejects(
      runMonthlyPoll(harness.deps),
      /posted poll poll-1001 \(message 1001\) but could not store it/,
    );
    assert.equal(harness.telegram.polls.length, 1);
  });

  test('every cron in wrangler.toml has a job, and every job a cron', () => {
    const toml = readFileSync(new URL('../../wrangler.toml', import.meta.url), 'utf8');
    const crons = JSON.parse(toml.match(/^crons = (\[.*\])$/m)?.[1] ?? '[]') as string[];
    assert.deepEqual(crons.sort(), Object.keys(CRON_JOBS).sort());
    assert.equal(CRON_JOBS['0 14 * * 1'].run, runWeekly);
    assert.equal(CRON_JOBS['0 14 25 * *'].run, runMonthlyPoll);
    assert.equal(CRON_JOBS['0 14 1 * *'].run, runMonthlySummary);
  });
});

describe('poll answers', () => {
  test('stores each answer with the poll id, member, chosen options and date', async () => {
    const harness = createHarness();
    const pollId = await postPoll(harness);
    harness.setNow('2026-11-02T08:00:00.000Z');

    await handleUpdate(pollAnswer(pollId, ANA, [0, 2]), harness.deps);

    assert.deepEqual(results(harness), [
      {
        poll_id: pollId,
        member_id: 2,
        question: '¿Qué quieres aprender?',
        option_ids: '[0,2]',
        option_texts: '["Anchor","DeFi"]',
        created_at: '2026-11-02T08:00:00.000Z',
      },
    ]);
    // A voter the bot has never seen in the group becomes a member row.
    assert.equal(
      selectRows(harness.db.raw, 'SELECT * FROM tg_members WHERE telegram_id = 2').length,
      1,
    );
  });

  test('a changed vote replaces the earlier one; a retracted vote removes it', async () => {
    const harness = createHarness();
    const pollId = await postPoll(harness);

    await handleUpdate(pollAnswer(pollId, ANA, [0]), harness.deps);
    harness.setNow('2026-11-03T08:00:00.000Z');
    await handleUpdate(pollAnswer(pollId, ANA, [1]), harness.deps);
    assert.deepEqual(
      results(harness).map((row) => [row.option_texts, row.created_at]),
      [['["Pagos"]', '2026-11-03T08:00:00.000Z']],
    );

    await handleUpdate(pollAnswer(pollId, ANA, []), harness.deps);
    assert.deepEqual(results(harness), []);
  });

  test('a redelivered answer is handled once', async () => {
    const harness = createHarness();
    const pollId = await postPoll(harness);
    const update = pollAnswer(pollId, ANA, [0]);

    await handleUpdate(update, harness.deps);
    harness.db.raw.exec('DELETE FROM tg_poll_results');
    await handleUpdate(update, harness.deps);

    assert.deepEqual(results(harness), []);
  });

  test('answers for an unknown poll, from a chat, or from a bot are skipped', async () => {
    const harness = createHarness();
    const pollId = await postPoll(harness);

    await handleUpdate(pollAnswer('someone-elses-poll', ANA, [0]), harness.deps);
    await handleUpdate(pollAnswer(pollId, undefined, [0]), harness.deps);
    await handleUpdate(pollAnswer(pollId, { ...user(9), is_bot: true }, [0]), harness.deps);

    assert.deepEqual(results(harness), []);
  });
});
