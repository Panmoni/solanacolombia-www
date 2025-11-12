// src/pages/api/builders/list.ts
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
  const db = locals.runtime?.env?.DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const builders = await db.prepare('SELECT * FROM builders ORDER BY created_at DESC').all();
  
  return new Response(JSON.stringify({ builders: builders.results }), {
    headers: { 'Content-Type': 'application/json' }
  });
};

