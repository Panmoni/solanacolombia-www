// src/lib/auth.ts
// Session + nonce cookies are HMAC-signed with SESSION_SECRET so they cannot be
// tampered with. The session cookie carries the wallet (and cached profile
// fields); admin role is always re-checked against the DB on sensitive endpoints.

import { env } from 'cloudflare:workers';
import type { AstroCookies } from 'astro';

export interface Session {
  wallet: string;
  name?: string;
  role?: string;
  university?: string;
  telegram?: string;
  twitter?: string;
}

const SESSION_COOKIE = 'sc_session';
const NONCE_COOKIE = 'sc_nonce';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const NONCE_MAX_AGE = 5 * 60; // 5 minutes

const cookieOpts = {
  path: '/',
  httpOnly: true,
  secure: true,
  sameSite: 'lax' as const,
};

function getSecret(): string | null {
  const s = (env as Env).SESSION_SECRET;
  return s && s.length >= 32 ? s : null;
}

function b64url(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(str: string): Uint8Array {
  let s = str.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmac(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return b64url(new Uint8Array(sig));
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function signPayload(obj: unknown): Promise<string> {
  const secret = getSecret();
  if (!secret) throw new Error('SESSION_SECRET not configured');
  const payload = b64url(new TextEncoder().encode(JSON.stringify(obj)));
  const sig = await hmac(payload, secret);
  return `${payload}.${sig}`;
}

async function verifyPayload<T>(cookieVal: string | undefined): Promise<T | null> {
  const secret = getSecret();
  if (!secret || !cookieVal) return null;
  const parts = cookieVal.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = await hmac(payload, secret);
  if (!safeEqual(sig, expected)) return null;
  try {
    return JSON.parse(new TextDecoder().decode(b64urlDecode(payload))) as T;
  } catch {
    return null;
  }
}

interface SessionPayload extends Session {
  exp?: number;
}

export async function getSession(cookies: AstroCookies): Promise<Session | null> {
  const session = await verifyPayload<SessionPayload>(cookies.get(SESSION_COOKIE)?.value);
  if (!session?.wallet) return null;
  if (session.exp && session.exp < Date.now()) return null;
  return session;
}

export async function setSession(cookies: AstroCookies, session: Session) {
  const value = await signPayload({ ...session, exp: Date.now() + SESSION_MAX_AGE * 1000 });
  cookies.set(SESSION_COOKIE, value, { ...cookieOpts, maxAge: SESSION_MAX_AGE });
}

export function clearSession(cookies: AstroCookies) {
  cookies.delete(SESSION_COOKIE, { path: '/' });
  cookies.delete(NONCE_COOKIE, { path: '/' });
}

// --- SIWS nonce ---

interface NoncePayload {
  nonce: string;
  wallet: string;
  exp: number;
}

/** Issue a fresh nonce bound to `wallet`, stored in a signed cookie. Returns the nonce. */
export async function issueNonce(cookies: AstroCookies, wallet: string): Promise<string> {
  const nonceBytes = new Uint8Array(24);
  crypto.getRandomValues(nonceBytes);
  const nonce = b64url(nonceBytes);
  const value = await signPayload({ nonce, wallet, exp: Date.now() + NONCE_MAX_AGE * 1000 });
  cookies.set(NONCE_COOKIE, value, { ...cookieOpts, maxAge: NONCE_MAX_AGE });
  return nonce;
}

/** Read + consume (delete) the nonce cookie. Returns null if missing/expired/tampered. */
export async function getNonce(cookies: AstroCookies): Promise<NoncePayload | null> {
  const data = await verifyPayload<NoncePayload>(cookies.get(NONCE_COOKIE)?.value);
  cookies.delete(NONCE_COOKIE, { path: '/' });
  if (!data?.nonce || !data.wallet) return null;
  if (data.exp < Date.now()) return null;
  return data;
}
