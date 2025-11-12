// src/pages/api/projects/join.ts
import type { APIRoute } from 'astro';
import { v4 as uuidv4 } from 'uuid';
import { getSession } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  try {
    const session = await getSession(cookies);
    if (!session?.wallet) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const projectId = body.project_id;
    const wallet = body.wallet || session.wallet;

    if (!projectId) {
      return new Response(JSON.stringify({ error: 'Project ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = locals.runtime?.env?.DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify project exists
    const project = await db.prepare('SELECT id, owner_wallet FROM projects WHERE id = ?')
      .bind(projectId).first();

    if (!project) {
      return new Response(JSON.stringify({ error: 'Project not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Can't join your own project
    if (project.owner_wallet === wallet) {
      return new Response(JSON.stringify({ error: 'You are already the owner of this project' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if already linked (any status)
    const existingLink = await db.prepare('SELECT id, status FROM builder_project_links WHERE builder_wallet = ? AND project_id = ?')
      .bind(wallet, projectId).first();

    if (existingLink) {
      const statusMsg = existingLink.status === 'pending' 
        ? 'Ya tienes una solicitud pendiente para este proyecto'
        : existingLink.status === 'accepted'
        ? 'Ya eres miembro de este proyecto'
        : 'Ya tienes una solicitud para este proyecto';
      return new Response(JSON.stringify({ error: statusMsg }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify builder exists
    const builder = await db.prepare('SELECT id FROM builders WHERE wallet_address = ?')
      .bind(wallet).first();

    if (!builder) {
      return new Response(JSON.stringify({ error: 'You must be registered as a builder first' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const now = new Date().toISOString();
    const linkId = uuidv4();

    // Create join request (status: pending)
    await db.prepare(`
      INSERT INTO builder_project_links (id, builder_wallet, project_id, role, status, requested_at, created_at, updated_at)
      VALUES (?, ?, ?, 'contributor', 'pending', ?, ?, ?)
    `).bind(linkId, wallet, projectId, now, now, now).run();

    return new Response(JSON.stringify({ success: true, link_id: linkId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Join project error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

