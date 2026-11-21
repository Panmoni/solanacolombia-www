-- Week of 2026-11-23: the bot's weekly Reto. No opportunity this week (none verified).
-- Safe to re-run: the upsert replaces the week's row.
INSERT INTO weekly_queue (week_start, kind, title, body, link)
VALUES (
  '2026-11-23',
  'reto',
  'Tu primer programa en Solana Devnet',
  'Instala el entorno, crea un proyecto Anchor, despliega en Devnet y comparte la firma de tu transacción en el grupo antes del domingo.',
  'https://solanacolombia.com/blog/2026-challenge-01'
)
ON CONFLICT (week_start, kind) DO UPDATE SET
  title = excluded.title,
  body = excluded.body,
  link = excluded.link;
