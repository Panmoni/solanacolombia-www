// Worker entry point (wrangler.toml `main`). Astro serves every request; the
// weekly Cron Trigger runs the reputation bot's posts (PAN-418).
import { handle } from '@astrojs/cloudflare/handler';
import type { ExecutionContext, ScheduledController } from '@cloudflare/workers-types';
import { botDepsFromEnv } from './lib/telegram/env';
import { runWeekly } from './lib/telegram/weekly';

export default {
  fetch: handle,
  // Errors propagate so a failed run shows as failed in the Cron Events log.
  scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    const deps = botDepsFromEnv(env);
    if (Array.isArray(deps)) {
      throw new Error(`telegram weekly: missing or invalid secrets: ${deps.join(', ')}`);
    }
    ctx.waitUntil(
      runWeekly(deps).catch((error: unknown) => {
        console.error('telegram weekly: run failed', error);
        throw error;
      }),
    );
  },
};
