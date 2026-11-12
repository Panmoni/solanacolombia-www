// src/middleware.ts
// Security headers on every response. These are safe (never break rendering)
// and close the high-value gaps: MIME sniffing, clickjacking, referrer leakage,
// feature policy, and HSTS.
//
// The Content-Security-Policy header is set by Astro itself (security.csp in
// astro.config.mjs), which hashes the site's own scripts per page.
import { defineMiddleware } from 'astro:middleware';

const SECURITY_HEADERS: [string, string][] = [
  ['X-Content-Type-Options', 'nosniff'],
  ['X-Frame-Options', 'SAMEORIGIN'],
  ['Referrer-Policy', 'strict-origin-when-cross-origin'],
  ['Permissions-Policy', 'camera=(), microphone=(), geolocation=()'],
  ['Strict-Transport-Security', 'max-age=31536000; includeSubDomains'],
];

// Responses Astro gives no policy (its built-in 404 page, API JSON, images)
// get a locked-down one: nothing loads except inline styles and own images.
const FALLBACK_CSP =
  "default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:; base-uri 'none'; form-action 'none'; frame-ancestors 'self'";

const applyHeaders = (headers: Headers) => {
  for (const [name, value] of SECURITY_HEADERS) {
    headers.set(name, value);
  }
  if (!headers.has('Content-Security-Policy')) {
    headers.set('Content-Security-Policy', FALLBACK_CSP);
  }
};

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();

  try {
    applyHeaders(response.headers);
    return response;
  } catch (error) {
    if (!(error instanceof TypeError)) {
      throw error;
    }
    // A proxied fetch response (e.g. /_image) has immutable headers; copy it.
    // Only those are copied, so Astro's own responses keep their cookies.
    const copy = new Response(response.body, response);
    applyHeaders(copy.headers);
    return copy;
  }
});
