-- Migration 0001: Telegram reputation bot (PAN-418)
-- Applied with `wrangler d1 migrations apply solana_builders` (migrations_dir in wrangler.toml).
-- All timestamps are UTC ISO-8601 strings from Date.prototype.toISOString(), so they sort as text.

-- Everyone the bot has seen in the group. telegram_id is Telegram's user id.
CREATE TABLE IF NOT EXISTS tg_members (
  telegram_id INTEGER PRIMARY KEY,
  username TEXT, -- without the leading @; NULL when the user has none
  first_name TEXT,
  joined_at TEXT, -- set when the bot sees the member join
  awaiting_join_message INTEGER NOT NULL DEFAULT 0, -- 1 until the member's first message is stored
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tg_members_username ON tg_members (lower(username));

-- A /ship: one public link. It earns points only once vouched.
CREATE TABLE IF NOT EXISTS tg_ships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER NOT NULL REFERENCES tg_members (telegram_id),
  link TEXT NOT NULL,
  note TEXT,
  video_consent INTEGER NOT NULL DEFAULT 0, -- 1 when sent as `/ship <link> video`
  message_id INTEGER NOT NULL UNIQUE, -- the group message; makes redelivery a no-op
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tg_ships_member ON tg_ships (member_id, created_at);

-- A /vouch confirms exactly one ship. Only vouches that count are stored.
CREATE TABLE IF NOT EXISTS tg_vouches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ship_id INTEGER NOT NULL UNIQUE REFERENCES tg_ships (id),
  voucher_id INTEGER NOT NULL REFERENCES tg_members (telegram_id),
  message_id INTEGER NOT NULL UNIQUE, -- the /vouch message
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tg_vouches_voucher ON tg_vouches (voucher_id);

-- A /gracias: help credited from one member to another, at most once per pair per 7 days.
CREATE TABLE IF NOT EXISTS tg_thanks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_id INTEGER NOT NULL REFERENCES tg_members (telegram_id),
  to_id INTEGER NOT NULL REFERENCES tg_members (telegram_id),
  message_id INTEGER NOT NULL UNIQUE, -- the /gracias message
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tg_thanks_pair ON tg_thanks (from_id, to_id, created_at);
CREATE INDEX IF NOT EXISTS idx_tg_thanks_to ON tg_thanks (to_id);

-- The first message a member sends after joining.
CREATE TABLE IF NOT EXISTS tg_join_messages (
  member_id INTEGER PRIMARY KEY REFERENCES tg_members (telegram_id),
  text TEXT NOT NULL,
  message_id INTEGER,
  created_at TEXT NOT NULL
);

-- Answers to the bot's polls (written by the builder-wants poll, PAN-435).
CREATE TABLE IF NOT EXISTS tg_poll_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  poll_id TEXT NOT NULL,
  member_id INTEGER NOT NULL REFERENCES tg_members (telegram_id),
  question TEXT NOT NULL,
  option_ids TEXT NOT NULL, -- JSON array of chosen option indexes
  option_texts TEXT, -- JSON array of chosen option texts
  created_at TEXT NOT NULL,
  UNIQUE (poll_id, member_id)
);

-- Retos and opportunities for the weekly group post, filled by the video pipeline.
CREATE TABLE IF NOT EXISTS tg_weekly_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL CHECK (kind IN ('reto', 'oportunidad')),
  body TEXT NOT NULL,
  created_at TEXT NOT NULL,
  posted_at TEXT -- NULL until the weekly post uses it
);

CREATE INDEX IF NOT EXISTS idx_tg_weekly_queue_pending ON tg_weekly_queue (kind, posted_at, id);

-- Telegram update ids already handled, so a redelivered update never counts twice.
CREATE TABLE IF NOT EXISTS tg_processed_updates (
  update_id INTEGER PRIMARY KEY,
  created_at TEXT NOT NULL
);
