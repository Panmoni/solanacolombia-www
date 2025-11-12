// src/pages/api/projects/export.ts
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
  const db = locals.runtime?.env?.DB;
  if (!db) {
    return new Response('Database not available', { status: 500 });
  }

  const projects = await db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
  
  // Convert to CSV
  const headers = ['ID', 'Name', 'Description', 'Website', 'Twitter', 'Discord', 'Owner Wallet', 'Status', 'Created At'];
  const rows = projects.results.map((p: any) => [
    p.id,
    p.name || '',
    (p.description || '').replace(/"/g, '""'),
    p.website || '',
    p.twitter || '',
    p.discord || '',
    p.owner_wallet || '',
    p.status || '',
    p.created_at || ''
  ]);

  const csv = [
    headers.join(','),
    ...rows.map((row: any[]) => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename=projects.csv'
    }
  });
};

