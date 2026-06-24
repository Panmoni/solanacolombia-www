// src/lib/solana.ts
// Sign-In-with-Solana (SIWS) helpers: build the auth message and verify an
// Ed25519 signature produced by a Phantom/Solflare `signMessage` call.

import { base58 } from '@scure/base';
import * as nacl from 'tweetnacl';

const SIGNING_DOMAIN = 'solanacolombia.com';

/** The exact string the user is asked to sign. Embeds a server nonce (replay protection). */
export function buildAuthMessage(wallet: string, nonce: string): string {
  return `${SIGNING_DOMAIN} wants you to sign in with your Solana account:\n${wallet}\n\nSession: ${nonce}`;
}

/**
 * Phantom/Solflare `signMessage(utf8String)` does NOT sign the raw UTF-8 bytes.
 * It signs: b"\x16Solana Signed Message:\n" + LE uint32(message length) + message bytes.
 * Reconstruct those exact bytes to verify against.
 */
function signedMessageBytes(message: string): Uint8Array {
  const msg = new TextEncoder().encode(message);
  const prefix = new TextEncoder().encode('\x16Solana Signed Message:\n');
  const out = new Uint8Array(prefix.length + 4 + msg.length);
  out.set(prefix, 0);
  new DataView(out.buffer).setUint32(prefix.length, msg.length, true); // little-endian
  out.set(msg, prefix.length + 4);
  return out;
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Verify a base64-encoded signature over `message` was produced by `wallet`'s key. */
export function verifyWalletSignature(
  wallet: string,
  message: string,
  signatureB64: string,
): boolean {
  try {
    const publicKey = base58.decode(wallet); // throws on invalid base58
    if (publicKey.length !== 32) return false; // Solana public keys are 32 bytes
    const signature = base64ToBytes(signatureB64);
    if (signature.length !== 64) return false; // Ed25519 signatures are 64 bytes
    return nacl.sign.detached.verify(signedMessageBytes(message), signature, publicKey);
  } catch {
    return false;
  }
}

/** Cheap format check: decodes to 32 bytes. Does NOT prove ownership. */
export function isValidSolanaAddress(wallet: string): boolean {
  try {
    return base58.decode(wallet).length === 32;
  } catch {
    return false;
  }
}
