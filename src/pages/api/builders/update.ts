// src/pages/api/builders/update.ts
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
    const name = form.get('name')?.toString();
    const email = form.get('email')?.toString();
    const telegram = form.get('telegram')?.toString() || null;
    const twitter = form.get('twitter')?.toString() || null;
    const university = form.get('university')?.toString() || null;

    const db = locals.runtime?.env?.DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify builder exists
    const builder = await db.prepare('SELECT id FROM builders WHERE wallet_address = ?')
      .bind(session.wallet).first();

    if (!builder) {
      return new Response(JSON.stringify({ error: 'Builder not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if email is being changed and if it's already taken
    if (email) {
      const existingEmail = await db.prepare('SELECT id FROM builders WHERE email = ? AND wallet_address != ?')
        .bind(email, session.wallet).first();
      
      if (existingEmail) {
        return new Response(JSON.stringify({ error: 'Este email ya está en uso' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    const now = new Date().toISOString();

    // Update builder profile
    await db.prepare(`
      UPDATE builders 
      SET name = ?, email = ?, telegram = ?, twitter = ?, university = ?, updated_at = ?
      WHERE wallet_address = ?
    `).bind(name, email, telegram, twitter, university, now, session.wallet).run();

    // Update session
    await fetch('/api/builders/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet: session.wallet })
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Update builder error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

