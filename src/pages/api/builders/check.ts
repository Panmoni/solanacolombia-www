// src/pages/api/builders/check.ts
// Returns whether the *signed-in* wallet is registered. Wallet is derived from
// the session, never from a query param.
import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';

export const GET: APIRoute = async ({ cookies }) => {
  try {
    const session = await getSession(cookies);
    if (!session?.wallet) {
      return new Response(JSON.stringify({ registered: false }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = (env as Env).DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available', registered: false }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const builder = await db
      .prepare('SELECT id FROM builders WHERE wallet_address = ?')
      .bind(session.wallet)
      .first();

    return new Response(JSON.stringify({ registered: !!builder }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error checking registration:', error);
    return new Response(JSON.stringify({ registered: false, error: 'Database error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
