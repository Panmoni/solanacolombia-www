// src/lib/auth.ts
import type { AstroCookies } from 'astro';

export interface Session {
  wallet: string;
  name?: string;
  role?: string;
}

export async function getSession(cookies: AstroCookies): Promise<Session | null> {
  const wallet = cookies.get('wallet')?.value;
  const name = cookies.get('name')?.value;
  const role = cookies.get('role')?.value;
  
  if (!wallet) return null;
  
  return { wallet, name, role };
}

export function setSession(cookies: AstroCookies, session: Session) {
  cookies.set('wallet', session.wallet, {
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
    secure: true,
    sameSite: 'lax'
  });
  if (session.name) {
    cookies.set('name', session.name, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
      secure: true,
      sameSite: 'lax'
    });
  }
  if (session.role) {
    cookies.set('role', session.role, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
      secure: true,
      sameSite: 'lax'
    });
  }
}

export function clearSession(cookies: AstroCookies) {
  cookies.delete('wallet', { path: '/' });
  cookies.delete('name', { path: '/' });
  cookies.delete('role', { path: '/' });
}

