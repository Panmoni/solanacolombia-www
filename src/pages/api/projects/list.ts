// src/pages/api/projects/list.ts
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
  const db = locals.runtime?.env?.DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Get all projects (pending, verified, active) for join page
  const projects = await db.prepare('SELECT id, name, description, website, twitter, discord, owner_wallet, status FROM projects ORDER BY name ASC').all();
  
  return new Response(JSON.stringify({ projects: projects.results }), {
    headers: { 'Content-Type': 'application/json' }
  });
};

