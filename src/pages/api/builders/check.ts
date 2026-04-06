// src/pages/api/builders/check.ts

import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  try {
    const db = (env as Env).DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available', registered: false }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const wallet = url.searchParams.get('wallet');

    if (!wallet) {
      return new Response(
        JSON.stringify({ error: 'Wallet parameter required', registered: false }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const builder = await db
      .prepare('SELECT id FROM builders WHERE wallet_address = ?')
      .bind(wallet)
      .first();

    return new Response(JSON.stringify({ registered: !!builder }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error checking registration:', error);
    // Return false on error so user can still see the form
    return new Response(JSON.stringify({ registered: false, error: 'Database error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
