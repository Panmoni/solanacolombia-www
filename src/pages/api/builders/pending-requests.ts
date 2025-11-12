// src/pages/api/builders/pending-requests.ts
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, locals }) => {
  const db = locals.runtime?.env?.DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database not available', project_ids: [] }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const url = new URL(request.url);
  const wallet = url.searchParams.get('wallet');

  if (!wallet) {
    return new Response(JSON.stringify({ error: 'Wallet parameter required', project_ids: [] }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Get all pending join requests for this wallet
  const pendingLinks = await db.prepare(`
    SELECT project_id 
    FROM builder_project_links 
    WHERE builder_wallet = ? AND status = 'pending'
  `).bind(wallet).all();

  const projectIds = pendingLinks.results?.map((link: any) => link.project_id) || [];

  return new Response(JSON.stringify({ project_ids: projectIds }), {
    headers: { 'Content-Type': 'application/json' }
  });
};

