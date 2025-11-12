// src/pages/api/projects/create.ts
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

    const form = await request.formData();
    const projectName = form.get('project_name')?.toString();
    const desc = form.get('project_description')?.toString();
    const website = form.get('project_website')?.toString() || null;
    const projTwitter = form.get('project_twitter')?.toString() || null;
    const discord = form.get('project_discord')?.toString() || null;

    if (!projectName) {
      return new Response(JSON.stringify({ error: 'Project name is required' }), {
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

    // Check if project name already exists
    const existingProject = await db.prepare('SELECT id FROM projects WHERE name = ?')
      .bind(projectName).first();

    if (existingProject) {
      return new Response(JSON.stringify({ error: 'Project name already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify owner is registered as builder
    const owner = await db.prepare('SELECT id FROM builders WHERE wallet_address = ?')
      .bind(session.wallet).first();

    if (!owner) {
      return new Response(JSON.stringify({ error: 'You must be registered as a builder first' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const now = new Date().toISOString();
    const projectId = uuidv4();

    // Create the project
    const projectResult = await db.prepare(`
      INSERT INTO projects (id, name, description, website, twitter, discord, owner_wallet, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `).bind(projectId, projectName, desc, website, projTwitter, discord, session.wallet, now, now).run();

    if (!projectResult.success) {
      console.error('Failed to create project:', projectResult);
      return new Response(JSON.stringify({ error: 'Failed to create project' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create owner link with 'owner' status
    const ownerLinkId = uuidv4();
    const linkResult = await db.prepare(`
      INSERT INTO builder_project_links (id, builder_wallet, project_id, role, status, requested_at, responded_at, created_at, updated_at)
      VALUES (?, ?, ?, 'owner', 'owner', ?, ?, ?, ?)
    `).bind(ownerLinkId, session.wallet, projectId, now, now, now, now).run();

    if (!linkResult.success) {
      console.error('Failed to create owner link:', linkResult);
      // Project was created but link failed - this is bad but we'll continue
    }

    console.log('Project created successfully:', { projectId, projectName, owner: session.wallet });

    return new Response(JSON.stringify({ success: true, project_id: projectId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Project creation error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

