import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  type Activity,
  formatPoints,
  leaderboard,
  levelFor,
  pointsFor,
} from '../../src/lib/telegram/scoring.ts';

const AS_OF = new Date('2026-11-21T12:00:00.000Z');
const daysAgo = (days: number) => new Date(AS_OF.getTime() - days * 86_400_000).toISOString();

const activity = (overrides: Partial<Activity> = {}): Activity => ({
  members: [
    { id: 1, username: 'ana', firstName: 'Ana' },
    { id: 2, username: 'beto', firstName: 'Beto' },
  ],
  vouchedShips: [],
  vouchesGiven: [],
  thanksReceived: [],
  ...overrides,
});

describe('pointsFor', () => {
  test('vouched ship 10, vouch given 1, gracias received 2', () => {
    const data = activity({
      vouchedShips: [{ memberId: 1, link: 'https://a.dev', vouchedAt: daysAgo(1) }],
      vouchesGiven: [{ memberId: 1, at: daysAgo(2) }],
      thanksReceived: [{ memberId: 1, at: daysAgo(3) }],
    });
    assert.equal(pointsFor(data, 1, AS_OF), 13);
    assert.equal(pointsFor(data, 2, AS_OF), 0);
  });

  test('points older than 90 days count half', () => {
    const data = activity({
      vouchedShips: [
        { memberId: 1, link: 'https://old.dev', vouchedAt: daysAgo(91) },
        { memberId: 1, link: 'https://edge.dev', vouchedAt: daysAgo(90) },
      ],
      vouchesGiven: [{ memberId: 1, at: daysAgo(200) }],
      thanksReceived: [{ memberId: 1, at: daysAgo(120) }],
    });
    // 5 (old ship) + 10 (exactly 90 days still counts full) + 0.5 + 1
    assert.equal(pointsFor(data, 1, AS_OF), 16.5);
    assert.equal(formatPoints(16.5), '16.5');
    assert.equal(formatPoints(16), '16');
  });

  test('activity after the as-of moment is ignored', () => {
    const data = activity({
      vouchedShips: [{ memberId: 1, link: 'https://a.dev', vouchedAt: '2026-12-01T00:00:00.000Z' }],
    });
    assert.equal(pointsFor(data, 1, AS_OF), 0);
  });
});

describe('levelFor', () => {
  const ships = (memberId: number, ages: number[]) =>
    ages.map((age) => ({ memberId, link: `https://s${age}.dev`, vouchedAt: daysAgo(age) }));
  const thanks = (memberId: number, count: number) =>
    Array.from({ length: count }, (_, index) => ({ memberId, at: daysAgo(index + 1) }));

  test('no vouched ship is Visitante', () => {
    assert.equal(levelFor(activity(), 1, AS_OF), 'Visitante');
  });

  test('one vouched ship is Constructor', () => {
    assert.equal(levelFor(activity({ vouchedShips: ships(1, [5]) }), 1, AS_OF), 'Constructor');
  });

  test('three vouched ships is Shipper', () => {
    const data = activity({ vouchedShips: ships(1, [5, 100, 200]) });
    assert.equal(levelFor(data, 1, AS_OF), 'Shipper');
  });

  test('Núcleo needs 3 ships in 90 days and 3 gracias received', () => {
    assert.equal(
      levelFor(
        activity({ vouchedShips: ships(1, [1, 2, 3]), thanksReceived: thanks(1, 3) }),
        1,
        AS_OF,
      ),
      'Núcleo',
    );
    // Only two recent ships: Shipper.
    assert.equal(
      levelFor(
        activity({ vouchedShips: ships(1, [1, 2, 95]), thanksReceived: thanks(1, 3) }),
        1,
        AS_OF,
      ),
      'Shipper',
    );
    // Two gracias: Shipper.
    assert.equal(
      levelFor(
        activity({ vouchedShips: ships(1, [1, 2, 3]), thanksReceived: thanks(1, 2) }),
        1,
        AS_OF,
      ),
      'Shipper',
    );
  });
});

describe('leaderboard', () => {
  test('ranks by points and drops members with none', () => {
    const data = activity({
      vouchedShips: [{ memberId: 2, link: 'https://b.dev', vouchedAt: daysAgo(1) }],
      vouchesGiven: [{ memberId: 1, at: daysAgo(1) }],
    });
    const board = leaderboard(data, AS_OF);
    assert.deepEqual(
      board.map((row) => [row.member.username, row.points, row.level]),
      [
        ['beto', 10, 'Constructor'],
        ['ana', 1, 'Visitante'],
      ],
    );
    assert.equal(leaderboard(activity(), AS_OF).length, 0);
  });
});
