// src/pages/api/builders/register.ts
import type { APIRoute } from 'astro';
import { v4 as uuidv4 } from 'uuid';
import { Resend } from 'resend';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const form = await request.formData();
    const wallet = form.get('wallet')?.toString()?.trim();
    const type = form.get('type') as 'individual' | 'project';

    if (!wallet || !type) {
      return new Response(JSON.stringify({ error: 'Missing wallet or type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get D1 database from runtime
    const db = locals.runtime?.env?.DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const now = new Date().toISOString();

    if (type === 'individual') {
      // INDIVIDUAL REGISTRATION (only type allowed)
      // Check if individual already exists
      const existing = await db.prepare('SELECT id FROM builders WHERE wallet_address = ?')
        .bind(wallet).first();

      if (existing) {
        return new Response(JSON.stringify({ error: 'Ya estás registrado como builder' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const id = uuidv4();
      const name = form.get('name')?.toString();
      const email = form.get('email')?.toString();
      const telegram = form.get('telegram')?.toString() || null;
      const twitter = form.get('twitter')?.toString() || null;
      const university = form.get('university')?.toString() || null;

      // Register the individual
      await db.prepare(`
        INSERT INTO builders (id, wallet_address, name, email, telegram, twitter, university, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
      `).bind(id, wallet, name, email, telegram, twitter, university, now, now).run();

      // Send welcome email
      if (email && locals.runtime?.env?.RESEND_API_KEY) {
        try {
          const resend = new Resend(locals.runtime.env.RESEND_API_KEY);
          await resend.emails.send({
            from: 'Solana Colombia <hola@solanacolombia.com>',
            to: email,
            subject: '¡Bienvenido a Construyendo Juntos!',
            html: `<p>Hola ${name},</p><p>Tu wallet <strong>${wallet.slice(0,8)}...</strong> ha sido registrado como builder individual.</p><p>Pronto activaremos tu acceso al dashboard.</p>`,
          });
        } catch (emailError) {
          console.error('Email send error:', emailError);
        }
      }
    }


    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
