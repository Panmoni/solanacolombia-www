import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { handleUpdate, parseCommand, parseShipArgs, REPLIES } from '../../src/lib/telegram/bot.ts';
import { markdownToTelegramHtml } from '../../src/lib/telegram/format.ts';
import { createHarness, GEORGE, GROUP_ID, selectRows, user } from './helpers.ts';

const ANA = user(2, 'ana');
const BETO = user(3, 'beto');
const CARLA = user(4, 'carla');

type Harness = ReturnType<typeof createHarness>;

const send = async (harness: Harness, from = ANA, text = '') => {
  await handleUpdate(harness.message(from, text), harness.deps);
  return harness.lastReply();
};

const ships = (harness: Harness) =>
  selectRows(
    harness.db.raw,
    'SELECT member_id, link, note, video_consent FROM tg_ships ORDER BY id',
  );

const vouchCount = (harness: Harness) =>
  Number((harness.db.raw.prepare('SELECT COUNT(*) AS n FROM tg_vouches').get() as { n: number }).n);

describe('parsing', () => {
  test('parseCommand strips the bot suffix and lowercases', () => {
    assert.deepEqual(parseCommand('/Ship@SolanaColombiaBot https://x.dev'), {
      name: 'ship',
      args: 'https://x.dev',
    });
    assert.deepEqual(parseCommand('/rep'), { name: 'rep', args: '' });
    assert.equal(parseCommand('hola /rep'), null);
  });

  test('parseShipArgs needs an http(s) link', () => {
    assert.equal(parseShipArgs('mi proyecto'), null);
    assert.equal(parseShipArgs('ftp://x.dev'), null);
    assert.equal(parseShipArgs('www.x.dev'), null);
    assert.deepEqual(parseShipArgs('https://x.dev un dex VIDEO'), {
      link: 'https://x.dev',
      videoConsent: true,
      note: 'un dex',
    });
  });
});

describe('/ship', () => {
  test('records a ship with its link', async () => {
    const harness = createHarness();
    const reply = await send(harness, ANA, '/ship https://github.com/ana/dex mi primer dex');
    assert.equal(reply, REPLIES.shipRecorded);
    assert.deepEqual(ships(harness), [
      { member_id: 2, link: 'https://github.com/ana/dex', note: 'mi primer dex', video_consent: 0 },
    ]);
  });

  test('a message without an http(s) link is rejected in Spanish', async () => {
    const harness = createHarness();
    assert.equal(await send(harness, ANA, '/ship mi proyecto'), REPLIES.shipNeedsLink);
    assert.equal(await send(harness, ANA, '/ship'), REPLIES.shipNeedsLink);
    assert.deepEqual(ships(harness), []);
  });

  test('`video` records consent to feature the ship', async () => {
    const harness = createHarness();
    const reply = await send(harness, ANA, '/ship https://ana.dev video');
    assert.equal(reply, `${REPLIES.shipRecorded}\n${REPLIES.shipVideoConsent}`);
    assert.deepEqual(ships(harness), [
      { member_id: 2, link: 'https://ana.dev', note: null, video_consent: 1 },
    ]);
  });

  test('commands outside the group are ignored', async () => {
    const harness = createHarness();
    const update = harness.message(ANA, '/ship https://ana.dev', {
      chat: { id: ANA.id, type: 'private' },
    });
    await handleUpdate(update, harness.deps);
    assert.equal(harness.telegram.sent.length, 0);
    assert.deepEqual(ships(harness), []);
  });

  test('a redelivered update is counted once', async () => {
    const harness = createHarness();
    const update = harness.message(ANA, '/ship https://ana.dev');
    await handleUpdate(update, harness.deps);
    await handleUpdate(update, harness.deps);
    assert.equal(ships(harness).length, 1);
  });
});

describe('/vouch', () => {
  test('George can vouch without a vouched ship of his own', async () => {
    const harness = createHarness();
    await send(harness, ANA, '/ship https://ana.dev');
    const reply = await send(harness, GEORGE, '/vouch @ana');
    assert.equal(reply, '✅ Vouch registrado para el ship de @ana: https://ana.dev');
    assert.equal(vouchCount(harness), 1);
  });

  test('a member with a vouched ship can vouch; one without cannot', async () => {
    const harness = createHarness();
    await send(harness, ANA, '/ship https://ana.dev');
    await send(harness, BETO, '/ship https://beto.dev');

    // Beto has no vouched ship yet: his vouch does not count.
    assert.equal(await send(harness, BETO, '/vouch @ana'), REPLIES.vouchNotEligible);
    assert.equal(vouchCount(harness), 0);

    await send(harness, GEORGE, '/vouch @beto');
    assert.equal(
      await send(harness, BETO, '/vouch @ANA'),
      '✅ Vouch registrado para el ship de @ana: https://ana.dev',
    );
    assert.equal(vouchCount(harness), 2);
  });

  test('self-vouches never count, not even for George', async () => {
    const harness = createHarness();
    await send(harness, ANA, '/ship https://ana.dev');
    await send(harness, GEORGE, '/vouch @ana');
    await send(harness, ANA, '/ship https://ana.dev/2');
    assert.equal(await send(harness, ANA, '/vouch @ana'), REPLIES.vouchSelf);

    await send(harness, GEORGE, '/ship https://george.dev');
    assert.equal(await send(harness, GEORGE, '/vouch @george'), REPLIES.vouchSelf);
    assert.equal(vouchCount(harness), 1);
  });

  test('confirms the latest unvouched ship', async () => {
    const harness = createHarness();
    await send(harness, ANA, '/ship https://ana.dev/1');
    harness.setNow('2026-11-02T12:00:00.000Z');
    await send(harness, ANA, '/ship https://ana.dev/2');
    assert.match((await send(harness, GEORGE, '/vouch @ana')) ?? '', /ana\.dev\/2$/);
    assert.match((await send(harness, GEORGE, '/vouch @ana')) ?? '', /ana\.dev\/1$/);
    assert.equal(
      await send(harness, GEORGE, '/vouch @ana'),
      '@ana no tiene ships pendientes de /vouch.',
    );
  });

  test('an unknown or missing target gets a hint', async () => {
    const harness = createHarness();
    assert.equal(
      await send(harness, GEORGE, '/vouch @nadie'),
      'No conozco a @nadie todavía. Tiene que haber escrito en el grupo.',
    );
    assert.equal(await send(harness, GEORGE, '/vouch'), REPLIES.vouchUsage);
  });

  test('replying to a message targets its author', async () => {
    const harness = createHarness();
    const noUsername = user(9);
    await send(harness, noUsername, '/ship https://nine.dev');
    const update = harness.message(GEORGE, '/vouch', {
      reply_to_message: {
        message_id: 1,
        date: 0,
        chat: { id: GROUP_ID, type: 'supergroup' },
        from: noUsername,
      },
    });
    await handleUpdate(update, harness.deps);
    assert.equal(
      harness.lastReply(),
      '✅ Vouch registrado para el ship de User9: https://nine.dev',
    );
  });
});

describe('/gracias', () => {
  test('credits help at most once per pair per 7 days', async () => {
    const harness = createHarness('2026-11-01T12:00:00.000Z');
    await send(harness, BETO, 'hola');
    assert.equal(await send(harness, ANA, '/gracias @beto'), '🙏 Gracias registradas para @beto.');

    harness.setNow('2026-11-07T12:00:00.000Z');
    assert.equal(
      await send(harness, ANA, '/gracias @beto'),
      'Ya le diste las gracias a @beto en los últimos 7 días.',
    );
    // A different pair is independent.
    assert.equal(
      await send(harness, CARLA, '/gracias @beto'),
      '🙏 Gracias registradas para @beto.',
    );

    harness.setNow('2026-11-08T12:00:01.000Z');
    assert.equal(await send(harness, ANA, '/gracias @beto'), '🙏 Gracias registradas para @beto.');

    const count = harness.db.raw.prepare('SELECT COUNT(*) AS n FROM tg_thanks').get() as {
      n: number;
    };
    assert.equal(Number(count.n), 3);
  });

  test('no gracias to yourself', async () => {
    const harness = createHarness();
    assert.equal(await send(harness, ANA, '/gracias @ana'), REPLIES.graciasSelf);
  });
});

describe('/rep and /top', () => {
  test('/rep replies with points and level', async () => {
    const harness = createHarness();
    await send(harness, ANA, '/ship https://ana.dev');
    await send(harness, GEORGE, '/vouch @ana');
    await send(harness, BETO, '/gracias @ana');
    assert.equal(await send(harness, ANA, '/rep'), '@ana: 12 puntos · nivel Constructor');
    assert.equal(await send(harness, GEORGE, '/rep'), '@george: 1 puntos · nivel Visitante');
    assert.equal(await send(harness, CARLA, '/rep'), '@carla: 0 puntos · nivel Visitante');
  });

  test('/top lists the top 10', async () => {
    const harness = createHarness();
    assert.equal(await send(harness, ANA, '/top'), REPLIES.topEmpty);

    await send(harness, ANA, '/ship https://ana.dev');
    await send(harness, GEORGE, '/vouch @ana');
    await send(harness, ANA, '/gracias @george');
    for (let id = 10; id < 22; id += 1) {
      await send(harness, user(id, `m${id}`), 'hola');
      await send(harness, ANA, `/gracias @m${id}`);
    }
    const reply = (await send(harness, ANA, '/top')) ?? '';
    const lines = reply.split('\n');
    assert.equal(lines[0], '🏆 Top 10 Solana Colombia');
    assert.equal(lines[1], '1. @ana — 10 pts (Constructor)');
    assert.equal(lines[2], '2. @george — 3 pts (Visitante)');
    assert.equal(lines[3], '3. @m10 — 2 pts (Visitante)');
    assert.equal(lines.length, 11);
  });
});

describe('chat activity', () => {
  test('plain messages earn nothing', async () => {
    const harness = createHarness();
    for (let index = 0; index < 20; index += 1) {
      await send(harness, ANA, `mensaje ${index}`);
    }
    assert.equal(await send(harness, ANA, '/rep'), '@ana: 0 puntos · nivel Visitante');
  });
});

describe('group hygiene', () => {
  test('a new member gets the Primer Envío and their first message is stored', async () => {
    const harness = createHarness();
    const joinUpdate = harness.message(ANA, '', { new_chat_members: [ANA] });
    await handleUpdate(joinUpdate, harness.deps);

    const welcome = harness.telegram.sent.at(-1);
    assert.equal(welcome?.text, markdownToTelegramHtml(harness.deps.texts.primerEnvio));
    assert.equal(welcome?.options.html, true);
    assert.equal(welcome?.options.replyTo, joinUpdate.message?.message_id);

    await send(harness, ANA, 'Hola, soy Ana y quiero aprender Anchor');
    await send(harness, ANA, 'segundo mensaje');
    const rows = selectRows(harness.db.raw, 'SELECT member_id, text FROM tg_join_messages');
    assert.deepEqual(rows, [{ member_id: 2, text: 'Hola, soy Ana y quiero aprender Anchor' }]);
  });

  test('members who were here before the bot have no join message', async () => {
    const harness = createHarness();
    await send(harness, BETO, 'hola');
    const rows = harness.db.raw.prepare('SELECT * FROM tg_join_messages').all();
    assert.deepEqual(rows, []);
  });

  test('/reglas from George posts and pins the rules; from anyone else does nothing', async () => {
    const harness = createHarness();
    await send(harness, ANA, '/reglas');
    assert.equal(harness.telegram.sent.length, 0);

    await send(harness, GEORGE, '/reglas');
    const posted = harness.telegram.sent.at(-1);
    assert.equal(posted?.text, '<b>Reglas</b>\n\n<b>Sé amable.</b>');
    assert.equal(posted?.chatId, GROUP_ID);
    assert.equal(harness.telegram.pinned.length, 1);
    assert.equal(harness.telegram.pinned[0].chatId, GROUP_ID);
  });

  test('markdownToTelegramHtml escapes HTML and maps the files’ Markdown', () => {
    assert.equal(
      markdownToTelegramHtml('# Título\n\n- uno `/ship <link>`\n**negrita** & más'),
      '<b>Título</b>\n\n• uno <code>/ship &lt;link&gt;</code>\n<b>negrita</b> &amp; más',
    );
  });
});

describe('review fixes', () => {
  test('a command sent first is not stored as the join message', async () => {
    const harness = createHarness();
    await handleUpdate(harness.message(ANA, '', { new_chat_members: [ANA] }), harness.deps);
    await send(harness, ANA, '/ship https://ana.dev');
    await send(harness, ANA, 'Hola a todos');
    const rows = selectRows(harness.db.raw, 'SELECT text FROM tg_join_messages');
    assert.deepEqual(rows, [{ text: 'Hola a todos' }]);
  });

  test('a username that moved to another account resolves to its new owner', async () => {
    const harness = createHarness();
    await send(harness, user(50, 'dev'), 'hola');
    harness.setNow('2026-11-02T12:00:00.000Z');
    await send(harness, user(51, 'dev'), '/ship https://new-owner.dev');
    // The old owner speaks again under a new username.
    await send(harness, user(50, 'dev_old'), 'sigo aquí');
    assert.equal(
      await send(harness, GEORGE, '/vouch @dev'),
      '✅ Vouch registrado para el ship de @dev: https://new-owner.dev',
    );
  });

  test('a failed pin tells George instead of failing the update', async () => {
    const harness = createHarness();
    harness.deps.telegram.pinChatMessage = async () => {
      throw new Error('Telegram pinChatMessage failed (400): not enough rights');
    };
    await send(harness, GEORGE, '/reglas');
    const dm = harness.telegram.sent.at(-1);
    assert.equal(dm?.chatId, GEORGE.id);
    assert.match(dm?.text ?? '', /no pude fijarlas: Telegram pinChatMessage failed \(400\)/);
  });
});
