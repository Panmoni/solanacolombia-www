// src/pages/api/builders/login.ts
import type { APIRoute } from 'astro';
import { setSession } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  try {
    const { wallet } = await request.json();

    if (!wallet) {
      return new Response(JSON.stringify({ error: 'Wallet address required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get builder info from database
    const db = locals.runtime?.env?.DB;
    if (db) {
      const builder = await db.prepare('SELECT name, role, university, telegram, twitter FROM builders WHERE wallet_address = ?')
        .bind(wallet).first();

      if (builder) {
        setSession(cookies, {
          wallet,
          name: (builder as any).name,
          role: (builder as any).role,
          university: (builder as any).university,
          telegram: (builder as any).telegram,
          twitter: (builder as any).twitter
        });
      } else {
        // Set session with just wallet if not registered yet
        setSession(cookies, { wallet });
      }
    } else {
      // Fallback: set session with just wallet if DB not available
      setSession(cookies, { wallet });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

