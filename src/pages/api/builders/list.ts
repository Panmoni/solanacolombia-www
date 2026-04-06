// src/pages/api/builders/list.ts
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const GET: APIRoute = async () => {
  const db = (env as Env).DB;
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

