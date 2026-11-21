-- weekly_queue: the Reto and the opportunity the reputation bot posts in the Telegram group each
-- week. The video pipeline fills it (video/weeks/<week>/queue.sql); the bot reads the rows whose
-- week_start is the current Monday and skips a kind that has no row.
-- The bot's D1 migration owns the real table; this file is the contract it must match.
CREATE TABLE IF NOT EXISTS weekly_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  week_start TEXT NOT NULL,                -- Monday of the week, YYYY-MM-DD
  kind TEXT NOT NULL CHECK (kind IN ('reto', 'oportunidad')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (week_start, kind)
);
