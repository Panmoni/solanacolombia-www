// src/pages/api/builders/projects.ts
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, locals }) => {
  const db = locals.runtime?.env?.DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const url = new URL(request.url);
  const wallet = url.searchParams.get('wallet');

  if (!wallet) {
    return new Response(JSON.stringify({ error: 'Wallet parameter required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Get projects where user is the owner or is linked via builder_project_links (with accepted/owner status)
  const projects = await db.prepare(`
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
  `).bind(wallet, wallet).all();
  
  console.log('Projects query result:', { wallet, count: projects.results?.length, projects: projects.results });
  
  return new Response(JSON.stringify({ projects: projects.results }), {
    headers: { 'Content-Type': 'application/json' }
  });
};

