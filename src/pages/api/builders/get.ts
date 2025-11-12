// src/pages/api/builders/get.ts
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

  const session = await getSession(cookies);
  if (!session?.wallet) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Get builder profile
  const builder = await db.prepare(`
    SELECT wallet_address, name, email, telegram, twitter, university, role, status
    FROM builders 
    WHERE wallet_address = ?
  `).bind(session.wallet).first();

  if (!builder) {
    return new Response(JSON.stringify({ error: 'Builder not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ builder }), {
    headers: { 'Content-Type': 'application/json' }
  });
};

