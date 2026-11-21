// The bot's Cron Triggers, keyed by the exact expressions in wrangler.toml
// `[triggers] crons` (a test keeps the two in sync).
import { runMonthlyPoll } from './poll.ts';
import type { BotDeps } from './types.ts';
import { runWeekly } from './weekly.ts';

export const CRON_JOBS: Record<string, { name: string; run: (deps: BotDeps) => Promise<void> }> = {
  // Mondays 14:00 UTC (09:00 in Bogotá).
  '0 14 * * 1': { name: 'weekly', run: runWeekly },
  // The 25th at 14:00 UTC, days before the monthly summary reads the answers.
  '0 14 25 * *': { name: 'monthly poll', run: runMonthlyPoll },
};
