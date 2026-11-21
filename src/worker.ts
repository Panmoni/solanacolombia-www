// Worker entry point (wrangler.toml `main`). Astro serves every request; the
// weekly Cron Trigger runs the reputation bot's posts (PAN-418).
import { handle } from '@astrojs/cloudflare/handler';
import type { ExecutionContext, ScheduledController } from '@cloudflare/workers-types';
import { botDepsFromEnv } from './lib/telegram/env';
import { runWeekly } from './lib/telegram/weekly';

export default {
  fetch: handle,
  scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    const deps = botDepsFromEnv(env);
    if (!deps) {
      console.error('telegram weekly: bot secrets are not configured; skipping');
      return;
    }
    ctx.waitUntil(
      runWeekly(deps).catch((error: unknown) => {
        console.error('telegram weekly: run failed', error);
      }),
    );
  },
};
