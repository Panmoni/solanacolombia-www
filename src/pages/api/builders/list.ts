// src/pages/api/builders/list.ts
// Admin only. Returns PII (emails, socials) for all builders, so it must be
// gated — previously this was fully unauthenticated.
import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const GET: APIRoute = async ({ cookies }) => {
  const session = await getSession(cookies);
  if (!session?.wallet) {
    return json({ error: 'Not authenticated' }, 401);
  }

  const db = (env as Env).DB;
  if (!db) {
    return json({ error: 'Database not available' }, 500);
  }

  const builder = await db
    .prepare('SELECT role FROM builders WHERE wallet_address = ?')
    .bind(session.wallet)
    .first();
  if (!builder || builder.role !== 'admin') {
    return json({ error: 'Forbidden' }, 403);
  }

  const builders = await db.prepare('SELECT * FROM builders ORDER BY created_at DESC').all();

  return new Response(JSON.stringify({ builders: builders.results }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
