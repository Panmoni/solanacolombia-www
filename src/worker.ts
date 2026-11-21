// Worker entry point (wrangler.toml `main`). Astro serves every request; the
// Cron Triggers run the reputation bot's scheduled jobs (PAN-418, PAN-435, PAN-421).
import { handle } from '@astrojs/cloudflare/handler';
import type { ExecutionContext, ScheduledController } from '@cloudflare/workers-types';
import { CRON_JOBS } from './lib/telegram/cron';
import { botDepsFromEnv } from './lib/telegram/env';

export default {
  fetch: handle,
  // Errors propagate so a failed run shows as failed in the Cron Events log.
  scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    const job = CRON_JOBS[controller.cron];
    if (!job) {
      throw new Error(`telegram cron: no job for "${controller.cron}"`);
    }
    const deps = botDepsFromEnv(env);
    if (Array.isArray(deps)) {
      throw new Error(`telegram ${job.name}: missing or invalid secrets: ${deps.join(', ')}`);
    }
    ctx.waitUntil(
      job.run(deps).catch((error: unknown) => {
        console.error(`telegram ${job.name}: run failed`, error);
        throw error;
      }),
    );
  },
};
