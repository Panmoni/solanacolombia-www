// src/pages/api/projects/members.ts
import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';

export const GET: APIRoute = async ({ request, locals, cookies }) => {
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

  const session = await getSession(cookies);
  if (!session?.wallet) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Verify requester is the project owner
  const project = await db
    .prepare(
      `
    SELECT id, owner_wallet
    FROM projects
    WHERE id = ?
  `
    )
    .bind(projectId)
    .first();

  if (!project) {
    return new Response(JSON.stringify({ error: 'Project not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (project.owner_wallet !== session.wallet) {
    return new Response(JSON.stringify({ error: 'You are not the owner of this project' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Fetch accepted members (including owner link), joined with builder info
  const members = await db
    .prepare(
      `
    SELECT
      b.wallet_address,
      b.name,
      b.email,
      b.telegram,
      b.twitter,
      b.university,
      b.avatar_url,
      b.role AS builder_role,
      l.role AS project_role,
      l.status,
      l.requested_at,
      l.responded_at,
      l.created_at,
      l.updated_at
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

