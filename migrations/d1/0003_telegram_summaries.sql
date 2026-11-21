-- Migration 0003: the monthly builder-wants summary (PAN-421)
-- One row per run, written before the Telegram DM to George is sent.
CREATE TABLE IF NOT EXISTS tg_summaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  period_start TEXT NOT NULL, -- inputs created at or after this instant
  period_end TEXT NOT NULL, -- the run time
  input_count INTEGER NOT NULL,
  -- themes: Workers AI summarised the inputs; thin: fewer than 10 inputs;
  -- ai_failed: the model failed or returned nothing usable, so the raw inputs were sent.
  status TEXT NOT NULL CHECK (status IN ('themes', 'thin', 'ai_failed')),
  themes TEXT, -- JSON array of {tema, cantidad, cita}; NULL unless status = 'themes'
  message TEXT NOT NULL, -- the DM text exactly as sent
  created_at TEXT NOT NULL
);
