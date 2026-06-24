// src/pages/api/builders/projects.ts
// Returns the signed-in wallet's projects. Wallet is derived from the session,
// never from the query string (closes IDOR — anyone could formerly read any
// wallet's projects via ?wallet=).
import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';

export const GET: APIRoute = async ({ cookies }) => {
  const session = await getSession(cookies);
  if (!session?.wallet) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const wallet = session.wallet;

  const db = (env as Env).DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get projects where user is the owner or is linked via builder_project_links (accepted/owner)
  const projects = await db
    .prepare(`
    SELECT DISTINCT
      p.id,
      p.name,
      p.description,
      p.website,
      p.twitter,
      p.discord,
      p.owner_wallet,
      p.status,
      p.created_at,
      p.updated_at
    FROM projects p
    LEFT JOIN builder_project_links bpl ON p.id = bpl.project_id
    WHERE (p.owner_wallet = ? OR (bpl.builder_wallet = ? AND bpl.status IN ('accepted', 'owner')))
    ORDER BY p.created_at DESC
  `)
    .bind(wallet, wallet)
    .all();

  return new Response(JSON.stringify({ projects: projects.results }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
