// src/pages/api/projects/update.ts
import type { APIRoute } from 'astro';
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

    const form = await request.formData();
    const projectId = form.get('project_id')?.toString();
    const name = form.get('project_name')?.toString();
    const description = form.get('project_description')?.toString();
    const website = form.get('project_website')?.toString() || null;
    const twitter = form.get('project_twitter')?.toString() || null;
    const discord = form.get('project_discord')?.toString() || null;

    if (!projectId || !name) {
      return new Response(JSON.stringify({ error: 'Project ID and name are required' }), {
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

    // Verify project exists and user is the owner
    const project = await db.prepare('SELECT owner_wallet FROM projects WHERE id = ?')
      .bind(projectId).first();

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

    // Check if project name is being changed and if it's already taken
    const existingProject = await db.prepare('SELECT id FROM projects WHERE name = ? AND id != ?')
      .bind(name, projectId).first();

    if (existingProject) {
      return new Response(JSON.stringify({ error: 'Este nombre de proyecto ya está en uso' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const now = new Date().toISOString();

    // Update project
    await db.prepare(`
      UPDATE projects 
      SET name = ?, description = ?, website = ?, twitter = ?, discord = ?, updated_at = ?
      WHERE id = ?
    `).bind(name, description, website, twitter, discord, now, projectId).run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Update project error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

