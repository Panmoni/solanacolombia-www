// src/pages/api/projects/join-requests.ts
import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';

// GET: list pending join requests for a project (owner only)
// POST: accept or reject a specific join request (owner only)
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

  const requests = await db
    .prepare(
      `
    SELECT
      l.id,
      l.builder_wallet,
      l.project_id,
      l.role,
      l.status,
      l.requested_at,
      b.name,
      b.email,
      b.twitter,
      b.telegram
    FROM builder_project_links l
    JOIN builders b ON b.wallet_address = l.builder_wallet
    WHERE l.project_id = ?
      AND l.status = 'pending'
    ORDER BY l.requested_at ASC
  `
    )
    .bind(projectId)
    .all();

  return new Response(
    JSON.stringify({
      requests: requests.results || []
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
};

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  try {
    const db = locals.runtime?.env?.DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 500,
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

    const body = await request.json();
    const linkId = body.link_id as string | undefined;
    const action = body.action as 'accept' | 'reject' | undefined;

    if (!linkId || !action || !['accept', 'reject'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'link_id and valid action (accept|reject) are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Load the link with its project to verify ownership
    const link = await db
      .prepare(
        `
      SELECT 
        l.id,
        l.project_id,
        l.status,
        p.owner_wallet
      FROM builder_project_links l
      JOIN projects p ON p.id = l.project_id
      WHERE l.id = ?
    `
      )
      .bind(linkId)
      .first();

    if (!link) {
      return new Response(JSON.stringify({ error: 'Join request not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (link.owner_wallet !== session.wallet) {
      return new Response(JSON.stringify({ error: 'You are not the owner of this project' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (link.status !== 'pending') {
      return new Response(
        JSON.stringify({ error: 'This request has already been processed' }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const now = new Date().toISOString();
    const newStatus = action === 'accept' ? 'accepted' : 'rejected';

    await db
      .prepare(
        `
      UPDATE builder_project_links
      SET status = ?, responded_at = ?, updated_at = ?
      WHERE id = ?
    `
      )
      .bind(newStatus, now, now, linkId)
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        status: newStatus
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Join request update error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

