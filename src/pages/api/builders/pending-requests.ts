// src/pages/api/builders/pending-requests.ts
// Returns the signed-in wallet's pending join requests. Wallet from session only.
import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';

export const GET: APIRoute = async ({ cookies }) => {
  const session = await getSession(cookies);
  if (!session?.wallet) {
    return new Response(JSON.stringify({ error: 'Not authenticated', project_ids: [] }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const wallet = session.wallet;

  const db = (env as Env).DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database not available', project_ids: [] }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const pendingLinks = await db
    .prepare(`
    SELECT project_id
    FROM builder_project_links
    WHERE builder_wallet = ? AND status = 'pending'
  `)
    .bind(wallet)
    .all();

  const projectIds = pendingLinks.results?.map((link: any) => link.project_id) || [];

  return new Response(JSON.stringify({ project_ids: projectIds }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
