// src/pages/api/builders/login.ts
// Sign-In-with-Solana: the client must sign a server-issued nonce message with
// the wallet's key. We verify the Ed25519 signature before trusting the wallet.
// No signature → no session. Closes the "login as anyone by claiming a wallet" hole.
import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { getNonce, setSession } from '../../../lib/auth';
import { buildAuthMessage, isValidSolanaAddress, verifyWalletSignature } from '../../../lib/solana';

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { wallet, message, signature } = await request.json();

    if (!wallet || !message || !signature || !isValidSolanaAddress(wallet)) {
      return json({ error: 'Missing wallet, message, or signature' }, 400);
    }

    // 1. Consume the server-issued nonce (single-use, replay protection).
    const nonceData = await getNonce(cookies);
    if (!nonceData) {
      return json({ error: 'Sesión expirada, intenta de nuevo' }, 401);
    }
    if (nonceData.wallet !== wallet) {
      return json({ error: 'Invalid session' }, 401);
    }

    // 2. The signed message must be exactly the one we issued.
    const expectedMessage = buildAuthMessage(wallet, nonceData.nonce);
    if (message !== expectedMessage) {
      return json({ error: 'Invalid message' }, 401);
    }

    // 3. Verify the signature proves ownership of `wallet`.
    if (!verifyWalletSignature(wallet, message, signature)) {
      return json({ error: 'Signature verification failed' }, 401);
    }

    // 4. Signature valid — establish a signed session.
    const db = (env as Env).DB;
    const session = { wallet };
    if (db) {
      const builder = await db
        .prepare(
          'SELECT name, role, university, telegram, twitter FROM builders WHERE wallet_address = ?',
        )
        .bind(wallet)
        .first();
      if (builder) {
        const b = builder as {
          name: string | null;
          role: string | null;
          university: string | null;
          telegram: string | null;
          twitter: string | null;
        };
        await setSession(cookies, {
          wallet,
          name: b.name ?? undefined,
          role: b.role ?? undefined,
          university: b.university ?? undefined,
          telegram: b.telegram ?? undefined,
          twitter: b.twitter ?? undefined,
        });
      } else {
        await setSession(cookies, session);
      }
    } else {
      await setSession(cookies, session);
    }

    return json({ success: true }, 200);
  } catch (error) {
    console.error('Login error:', error);
    return json({ error: 'Internal server error' }, 500);
  }
};
