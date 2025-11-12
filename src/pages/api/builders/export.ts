// src/pages/api/builders/export.ts
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
  const db = locals.runtime?.env?.DB;
  if (!db) {
    return new Response('Database not available', { status: 500 });
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

