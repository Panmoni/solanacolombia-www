import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  handleWebhookRequest,
  isAuthorizedWebhook,
  SECRET_HEADER,
} from '../../src/lib/telegram/webhook.ts';
import { createHarness, GEORGE } from './helpers.ts';

const SECRET = 'test-secret-value';

const request = (headers: Record<string, string>, body: unknown, method = 'POST') =>
  new Request('https://solanacolombia.com/api/telegram/webhook', {
    method,
    headers,
    ...(method === 'POST' && { body: JSON.stringify(body) }),
  });

describe('isAuthorizedWebhook', () => {
  test('accepts only an exact match', () => {
    assert.equal(isAuthorizedWebhook(SECRET, SECRET), true);
    assert.equal(isAuthorizedWebhook('wrong', SECRET), false);
    assert.equal(isAuthorizedWebhook(`${SECRET}x`, SECRET), false);
    assert.equal(isAuthorizedWebhook(SECRET.slice(0, -1), SECRET), false);
    assert.equal(isAuthorizedWebhook(null, SECRET), false);
  });

  test('never matches when the secret is unset or empty', () => {
    assert.equal(isAuthorizedWebhook('', ''), false);
    assert.equal(isAuthorizedWebhook('anything', undefined), false);
    assert.equal(isAuthorizedWebhook('', undefined), false);
  });
});

describe('handleWebhookRequest', () => {
  test('a matching secret header is handled', async () => {
    const harness = createHarness();
    const update = harness.message(GEORGE, '/rep');
    const response = await handleWebhookRequest(
      request({ [SECRET_HEADER]: SECRET }, update),
      SECRET,
      () => harness.deps,
    );
    assert.equal(response.status, 200);
    assert.equal(harness.lastReply(), '@george: 0 puntos · nivel Visitante');
  });

  test('a wrong or missing secret header gets 401 and nothing runs', async () => {
    const harness = createHarness();
    const cases: Record<string, string>[] = [{ [SECRET_HEADER]: 'wrong' }, {}];
    for (const headers of cases) {
      const response = await handleWebhookRequest(
        request(headers, harness.message(GEORGE, '/rep')),
        SECRET,
        () => harness.deps,
      );
      assert.equal(response.status, 401);
    }
    assert.equal(harness.telegram.sent.length, 0);
  });

  test('an unauthenticated GET gets 401, an authenticated one 405', async () => {
    const harness = createHarness();
    const unauthenticated = await handleWebhookRequest(
      request({}, null, 'GET'),
      SECRET,
      () => harness.deps,
    );
    assert.equal(unauthenticated.status, 401);
    const authenticated = await handleWebhookRequest(
      request({ [SECRET_HEADER]: SECRET }, null, 'GET'),
      SECRET,
      () => harness.deps,
    );
    assert.equal(authenticated.status, 405);
  });

  test('a malformed body gets 400', async () => {
    const harness = createHarness();
    const response = await handleWebhookRequest(
      request({ [SECRET_HEADER]: SECRET }, { hello: 'world' }),
      SECRET,
      () => harness.deps,
    );
    assert.equal(response.status, 400);
  });

  test('missing bot secrets get 503', async () => {
    const harness = createHarness();
    const response = await handleWebhookRequest(
      request({ [SECRET_HEADER]: SECRET }, harness.message(GEORGE, '/rep')),
      SECRET,
      () => ['TELEGRAM_BOT_TOKEN'],
    );
    assert.equal(response.status, 503);
  });
});

describe('redelivery after a failure', () => {
  test('a failed update answers 500 and its redelivery records nothing twice', async () => {
    const harness = createHarness();
    const realSend = harness.deps.telegram.sendMessage;
    let failNext = true;
    harness.deps.telegram.sendMessage = async (...args) => {
      if (failNext) {
        failNext = false;
        throw new Error('Telegram sendMessage failed (502): Bad Gateway');
      }
      return realSend(...args);
    };
    const update = harness.message(GEORGE, '/ship https://george.dev');
    const send = () =>
      handleWebhookRequest(
        request({ [SECRET_HEADER]: SECRET }, update),
        SECRET,
        () => harness.deps,
      );

    assert.equal((await send()).status, 500);
    assert.equal((await send()).status, 200);
    assert.equal((await send()).status, 200);

    const ships = harness.db.raw.prepare('SELECT COUNT(*) AS n FROM tg_ships').get() as {
      n: number;
    };
    assert.equal(Number(ships.n), 1);
    assert.equal(harness.telegram.sent.length, 1);
  });
});
