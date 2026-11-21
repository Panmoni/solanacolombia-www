// D1 queries for the reputation bot. Tables come from
// migrations/d1/0001_telegram_reputation.sql.
import type { Activity, MemberInfo } from './scoring.ts';
import type { SqlDatabase, TgUser } from './types.ts';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

interface MemberRow {
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  awaiting_join_message: number;
}

export interface ShipRow {
  id: number;
  member_id: number;
  link: string;
}

const toMemberInfo = (row: MemberRow): MemberInfo => ({
  id: row.telegram_id,
  username: row.username,
  firstName: row.first_name,
});

/**
 * Records an update id. Returns false when it was already handled, so a
 * redelivered update is skipped.
 */
export const markUpdateProcessed = async (
  db: SqlDatabase,
  updateId: number,
  now: Date,
): Promise<boolean> => {
  const result = await db
    .prepare('INSERT OR IGNORE INTO tg_processed_updates (update_id, created_at) VALUES (?, ?)')
    .bind(updateId, now.toISOString())
    .run();
  return result.meta.changes > 0;
};

export const pruneProcessedUpdates = async (db: SqlDatabase, before: Date): Promise<void> => {
  await db
    .prepare('DELETE FROM tg_processed_updates WHERE created_at < ?')
    .bind(before.toISOString())
    .run();
};

/** Inserts or refreshes a member's name and username. */
export const upsertMember = async (db: SqlDatabase, user: TgUser, now: Date): Promise<void> => {
  const at = now.toISOString();
  await db
    .prepare(
      `INSERT INTO tg_members (telegram_id, username, first_name, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (telegram_id) DO UPDATE SET
         username = excluded.username,
         first_name = excluded.first_name,
         updated_at = excluded.updated_at`,
    )
    .bind(user.id, user.username ?? null, user.first_name, at, at)
    .run();
};

export const markJoined = async (db: SqlDatabase, user: TgUser, now: Date): Promise<void> => {
  await upsertMember(db, user, now);
  await db
    .prepare('UPDATE tg_members SET joined_at = ?, awaiting_join_message = 1 WHERE telegram_id = ?')
    .bind(now.toISOString(), user.id)
    .run();
};

export const getMember = async (db: SqlDatabase, id: number): Promise<MemberRow | null> =>
  db
    .prepare(
      'SELECT telegram_id, username, first_name, awaiting_join_message FROM tg_members WHERE telegram_id = ?',
    )
    .bind(id)
    .first<MemberRow>();

export const findMemberByUsername = async (
  db: SqlDatabase,
  username: string,
): Promise<MemberInfo | null> => {
  const row = await db
    .prepare(
      `SELECT telegram_id, username, first_name, awaiting_join_message FROM tg_members
       WHERE lower(username) = lower(?) ORDER BY updated_at DESC LIMIT 1`,
    )
    .bind(username)
    .first<MemberRow>();
  return row ? toMemberInfo(row) : null;
};

/** Stores a member's first message after joining, once. */
export const recordJoinMessage = async (
  db: SqlDatabase,
  memberId: number,
  text: string,
  messageId: number,
  now: Date,
): Promise<void> => {
  await db
    .prepare(
      `INSERT OR IGNORE INTO tg_join_messages (member_id, text, message_id, created_at)
       VALUES (?, ?, ?, ?)`,
    )
    .bind(memberId, text, messageId, now.toISOString())
    .run();
  await db
    .prepare('UPDATE tg_members SET awaiting_join_message = 0 WHERE telegram_id = ?')
    .bind(memberId)
    .run();
};

export const insertShip = async (
  db: SqlDatabase,
  ship: {
    memberId: number;
    link: string;
    note: string | null;
    videoConsent: boolean;
    messageId: number;
  },
  now: Date,
): Promise<void> => {
  await db
    .prepare(
      `INSERT INTO tg_ships (member_id, link, note, video_consent, message_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      ship.memberId,
      ship.link,
      ship.note,
      ship.videoConsent ? 1 : 0,
      ship.messageId,
      now.toISOString(),
    )
    .run();
};

export const countVouchedShips = async (db: SqlDatabase, memberId: number): Promise<number> => {
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS n FROM tg_ships s JOIN tg_vouches v ON v.ship_id = s.id
       WHERE s.member_id = ?`,
    )
    .bind(memberId)
    .first<{ n: number }>();
  return row?.n ?? 0;
};

export const latestUnvouchedShip = async (
  db: SqlDatabase,
  memberId: number,
): Promise<ShipRow | null> =>
  db
    .prepare(
      `SELECT s.id, s.member_id, s.link FROM tg_ships s
       LEFT JOIN tg_vouches v ON v.ship_id = s.id
       WHERE s.member_id = ? AND v.id IS NULL
       ORDER BY s.created_at DESC, s.id DESC LIMIT 1`,
    )
    .bind(memberId)
    .first<ShipRow>();

/** Returns false when the ship was vouched in the meantime. */
export const insertVouch = async (
  db: SqlDatabase,
  shipId: number,
  voucherId: number,
  now: Date,
): Promise<boolean> => {
  const result = await db
    .prepare('INSERT OR IGNORE INTO tg_vouches (ship_id, voucher_id, created_at) VALUES (?, ?, ?)')
    .bind(shipId, voucherId, now.toISOString())
    .run();
  return result.meta.changes > 0;
};

/**
 * Credits a gracias unless the same pair already has one in the last 7 days.
 * One statement, so two quick /gracias can't both pass the check.
 */
export const insertThanksIfAllowed = async (
  db: SqlDatabase,
  fromId: number,
  toId: number,
  now: Date,
): Promise<boolean> => {
  const since = new Date(now.getTime() - SEVEN_DAYS_MS).toISOString();
  const result = await db
    .prepare(
      `INSERT INTO tg_thanks (from_id, to_id, created_at)
       SELECT ?, ?, ?
       WHERE NOT EXISTS (
         SELECT 1 FROM tg_thanks WHERE from_id = ? AND to_id = ? AND created_at > ?
       )`,
    )
    .bind(fromId, toId, now.toISOString(), fromId, toId, since)
    .run();
  return result.meta.changes > 0;
};

/** Everything scoring needs, in three reads. */
export const loadActivity = async (db: SqlDatabase): Promise<Activity> => {
  const members = await db
    .prepare('SELECT telegram_id, username, first_name, awaiting_join_message FROM tg_members')
    .all<MemberRow>();
  const ships = await db
    .prepare(
      `SELECT s.member_id, s.link, v.voucher_id, v.created_at AS vouched_at
       FROM tg_vouches v JOIN tg_ships s ON s.id = v.ship_id
       ORDER BY v.created_at, v.id`,
    )
    .all<{ member_id: number; link: string; voucher_id: number; vouched_at: string }>();
  const thanks = await db
    .prepare('SELECT to_id, created_at FROM tg_thanks')
    .all<{ to_id: number; created_at: string }>();

  return {
    members: members.results.map(toMemberInfo),
    vouchedShips: ships.results.map((row) => ({
      memberId: row.member_id,
      link: row.link,
      vouchedAt: row.vouched_at,
    })),
    vouchesGiven: ships.results.map((row) => ({ memberId: row.voucher_id, at: row.vouched_at })),
    thanksReceived: thanks.results.map((row) => ({ memberId: row.to_id, at: row.created_at })),
  };
};

export interface QueueItem {
  id: number;
  body: string;
}

export const nextQueueItem = async (
  db: SqlDatabase,
  kind: 'reto' | 'oportunidad',
): Promise<QueueItem | null> =>
  db
    .prepare(
      'SELECT id, body FROM tg_weekly_queue WHERE kind = ? AND posted_at IS NULL ORDER BY id LIMIT 1',
    )
    .bind(kind)
    .first<QueueItem>();

export const markQueueItemPosted = async (
  db: SqlDatabase,
  id: number,
  now: Date,
): Promise<void> => {
  await db
    .prepare('UPDATE tg_weekly_queue SET posted_at = ? WHERE id = ?')
    .bind(now.toISOString(), id)
    .run();
};
