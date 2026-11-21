-- Migration 0002: polls the reputation bot posts (PAN-435)
-- A poll_answer update carries only the poll id and option indexes, so the
-- question and option texts are kept here, keyed by Telegram's poll id.
CREATE TABLE IF NOT EXISTS tg_polls (
  poll_id TEXT PRIMARY KEY,
  message_id INTEGER NOT NULL,
  question TEXT NOT NULL,
  options TEXT NOT NULL, -- JSON array of option texts, in Telegram's order
  created_at TEXT NOT NULL
);
