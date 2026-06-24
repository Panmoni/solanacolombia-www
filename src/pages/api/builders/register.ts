// src/pages/api/builders/register.ts
// Registration requires a signed-in session (SIWS proves wallet ownership), so
// you can only register your own wallet — not squat someone else's.
import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { v4 as uuidv4 } from 'uuid';
import { getSession, setSession } from '../../../lib/auth';

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

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
    const wallet = session.wallet;

    const form = await request.formData();
    const db = (env as Env).DB;
    if (!db) {
      return json({ error: 'Database not available' }, 500);
    }

    // Already registered?
    const existing = await db
      .prepare('SELECT id FROM builders WHERE wallet_address = ?')
      .bind(wallet)
      .first();
    if (existing) {
      return json({ error: 'Ya estás registrado como builder' }, 409);
    }

    const name = slice(form.get('name'), 200);
    const email = slice(form.get('email'), 320);
    const telegram = slice(form.get('telegram'), 64);
    const twitter = slice(form.get('twitter'), 64);
    const university = slice(form.get('university'), 200);

    if (!name) {
      return json({ error: 'Name is required' }, 400);
    }
    if (email && !EMAIL_RE.test(email)) {
      return json({ error: 'Invalid email' }, 400);
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    await db
      .prepare(`
        INSERT INTO builders (id, wallet_address, name, email, telegram, twitter, university, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
      `)
      .bind(id, wallet, name, email, telegram, twitter, university, now, now)
      .run();

    // Refresh session with the new profile fields.
    await setSession(cookies, {
      wallet,
      name,
      university: university ?? undefined,
      telegram: telegram ?? undefined,
      twitter: twitter ?? undefined,
    });

    // Send welcome email
    if (email && (env as Env).RESEND_API_KEY) {
      try {
        const resend = new Resend((env as Env).RESEND_API_KEY);
        await resend.emails.send({
          from: 'Solana Colombia <hola@solanacolombia.com>',
          to: email,
          subject: '¡Bienvenido a Construyendo Juntos!',
          html: `<p>Hola ${escapeHtml(name)},</p><p>Tu wallet <strong>${escapeHtml(wallet.slice(0, 8))}...</strong> ha sido registrado como builder individual.</p><p>Pronto activaremos tu acceso al dashboard.</p>`,
        });
      } catch (emailError) {
        console.error('Email send error:', emailError);
      }
    }

    return json({ success: true }, 200);
  } catch (error) {
    console.error('Registration error:', error);
    return json({ error: 'Internal server error' }, 500);
  }
};
