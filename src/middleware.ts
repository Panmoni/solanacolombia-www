// src/middleware.ts
// Security headers on every response. These are safe (never break rendering)
// and close the high-value gaps: MIME sniffing, clickjacking, referrer leakage,
// feature policy, and HSTS.
//
// CSP is intentionally omitted for now: the Newsletter embeds an external
// script (eocampaign1.com) and a correct CSP needs a runtime audit of all
// third-party resources plus script nonces. See notes.md security section.
import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();
  const headers = response.headers;

  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'SAMEORIGIN');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  return response;
});
