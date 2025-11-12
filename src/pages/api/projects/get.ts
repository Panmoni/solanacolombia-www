// src/pages/api/projects/get.ts
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

  // Get project
  const project = await db.prepare(`
    SELECT id, name, description, website, twitter, discord, owner_wallet, status
    FROM projects 
    WHERE id = ?
  `).bind(projectId).first();

  if (!project) {
    return new Response(JSON.stringify({ error: 'Project not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Verify user is the owner
  if (project.owner_wallet !== session.wallet) {
    return new Response(JSON.stringify({ error: 'You are not the owner of this project' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ project }), {
    headers: { 'Content-Type': 'application/json' }
  });
};

