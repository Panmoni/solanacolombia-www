// src/pages/api/projects/team.ts
import type { APIRoute } from 'astro';

// Public endpoint to list accepted members of a project team.
// Exposes only non-sensitive fields suitable for display on the join page.
export const GET: APIRoute = async ({ request, locals }) => {
  const db = locals.runtime?.env?.DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const url = new URL(request.url);
  const projectId = url.searchParams.get('id');

  if (!projectId) {
    return new Response(JSON.stringify({ error: 'Project ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Fetch accepted members (including owner link), joined with basic builder info
  const members = await db
    .prepare(
      `
    SELECT
      b.wallet_address,
      b.name,
      l.role AS project_role,
      l.status
    FROM builder_project_links l
    JOIN builders b ON b.wallet_address = l.builder_wallet
    WHERE l.project_id = ?
      AND l.status IN ('accepted', 'owner')
    ORDER BY
      CASE WHEN l.status = 'owner' THEN 0 ELSE 1 END,
      l.created_at ASC
  `
    )
    .bind(projectId)
    .all();

  return new Response(
    JSON.stringify({
      members: members.results || []
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
};

