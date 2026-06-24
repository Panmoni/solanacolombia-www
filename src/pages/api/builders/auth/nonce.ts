// src/pages/api/builders/auth/nonce.ts
// Issues a server nonce bound to the connecting wallet and returns the exact
// SIWS message for the client to sign. The nonce is stored in a signed cookie
// and consumed once at login (replay protection).
import type { APIRoute } from 'astro';
import { issueNonce } from '../../../../lib/auth';
import { buildAuthMessage, isValidSolanaAddress } from '../../../../lib/solana';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { wallet } = await request.json();

    if (!wallet || !isValidSolanaAddress(wallet)) {
      return new Response(JSON.stringify({ error: 'Valid wallet address required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const nonce = await issueNonce(cookies, wallet);
    const message = buildAuthMessage(wallet, nonce);

    return new Response(JSON.stringify({ message }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Nonce error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
