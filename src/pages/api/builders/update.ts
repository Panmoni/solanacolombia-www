// src/pages/api/builders/update.ts
// Updates the signed-in builder's own profile. Input lengths are clamped and
// email is validated. Wallet comes from the session (already verified by SIWS).
import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { getSession, setSession } from '../../../lib/auth';

const slice = (v: FormDataEntryValue | null, max: number): string | null => {
  const s = v?.toString()?.trim();
  return s ? s.slice(0, max) : null;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const session = await getSession(cookies);
    if (!session?.wallet) {
      return json({ error: 'Not authenticated' }, 401);
    }

    const form = await request.formData();
    const name = slice(form.get('name'), 200);
    const email = slice(form.get('email'), 320);
    const telegram = slice(form.get('telegram'), 64);
    const twitter = slice(form.get('twitter'), 64);
    const university = slice(form.get('university'), 200);

    if (name !== null && name.length === 0) {
      return json({ error: 'Name cannot be empty' }, 400);
    }
    if (email && !EMAIL_RE.test(email)) {
      return json({ error: 'Invalid email' }, 400);
    }

    const db = (env as Env).DB;
    if (!db) {
      return json({ error: 'Database not available' }, 500);
    }

    // Verify builder exists
    const builder = await db
      .prepare('SELECT id FROM builders WHERE wallet_address = ?')
      .bind(session.wallet)
      .first();

    if (!builder) {
      return json({ error: 'Builder not found' }, 404);
    }

    // Check if email is being changed and if it's already taken
    if (email) {
      const existingEmail = await db
        .prepare('SELECT id FROM builders WHERE email = ? AND wallet_address != ?')
        .bind(email, session.wallet)
        .first();

      if (existingEmail) {
        return json({ error: 'Este email ya está en uso' }, 409);
      }
    }

    const now = new Date().toISOString();

    // Update builder profile
    await db
      .prepare(`
      UPDATE builders
      SET name = ?, email = ?, telegram = ?, twitter = ?, university = ?, updated_at = ?
      WHERE wallet_address = ?
    `)
      .bind(name, email, telegram, twitter, university, now, session.wallet)
      .run();

    // Update session
    await setSession(cookies, {
      wallet: session.wallet,
      name: name ?? undefined,
      role: session.role,
      university: university ?? undefined,
      telegram: telegram ?? undefined,
      twitter: twitter ?? undefined,
    });

    return json({ success: true }, 200);
  } catch (error) {
    console.error('Update builder error:', error);
    return json({ error: 'Internal server error' }, 500);
  }
};
