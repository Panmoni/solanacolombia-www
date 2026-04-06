// src/pages/api/builders/export.ts
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getSession } from '../../../lib/auth';

export const GET: APIRoute = async ({ cookies }) => {
  const session = await getSession(cookies);
  if (!session?.wallet) {
    return new Response('Not authenticated', { status: 401 });
  }

  const db = (env as Env).DB;
  if (!db) {
    return new Response('Database not available', { status: 500 });
  }

  // Verify user is admin
  const builder = await db.prepare('SELECT role FROM builders WHERE wallet_address = ?')
    .bind(session.wallet).first();
  if (!builder || builder.role !== 'admin') {
    return new Response('Forbidden', { status: 403 });
  }

  const builders = await db.prepare('SELECT * FROM builders ORDER BY created_at DESC').all();
  
  // Convert to CSV
  const headers = ['Wallet', 'Name', 'Email', 'Telegram', 'Twitter', 'University', 'Role', 'Status', 'Created At'];
  const rows = builders.results.map((b: any) => [
    b.wallet_address,
    b.name || '',
    b.email || '',
    b.telegram || '',
    b.twitter || '',
    b.university || '',
    b.role || '',
    b.status || '',
    b.created_at || ''
  ]);

  const csv = [
    headers.join(','),
    ...rows.map((row: any[]) => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename=builders.csv'
    }
  });
};

