// src/middleware.ts
// Security headers on every response. These are safe (never break rendering)
// and close the high-value gaps: MIME sniffing, clickjacking, referrer leakage,
// feature policy, and HSTS.
//
// Astro sets each page's Content-Security-Policy header itself (security.csp
// in astro.config.mjs, with per-page script hashes). This middleware adds a
// locked-down fallback policy to responses Astro gives none.
import { defineMiddleware } from 'astro:middleware';

const SECURITY_HEADERS: readonly (readonly [string, string])[] = [
  ['X-Content-Type-Options', 'nosniff'],
  ['X-Frame-Options', 'SAMEORIGIN'],
  ['Referrer-Policy', 'strict-origin-when-cross-origin'],
  ['Permissions-Policy', 'camera=(), microphone=(), geolocation=()'],
  ['Strict-Transport-Security', 'max-age=31536000; includeSubDomains'],
];

// For responses Astro gives no policy: its built-in 404 page, API JSON and
// images. Skipped in dev, where Astro emits no CSP for any page.
const FALLBACK_CSP =
  "default-src 'none'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; base-uri 'none'; form-action 'none'; frame-ancestors 'self'";

const applyHeaders = (headers: Headers) => {
  for (const [name, value] of SECURITY_HEADERS) {
    headers.set(name, value);
  }
  if (!(import.meta.env.DEV || headers.has('Content-Security-Policy'))) {
    headers.set('Content-Security-Policy', FALLBACK_CSP);
  }
};

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();

  try {
    applyHeaders(response.headers);
    return response;
  } catch (error) {
    if (!(error instanceof TypeError)) {
      throw error;
    }
  }

  // A proxied fetch response (e.g. /_image) has immutable headers: copy it.
  // Astro attaches cookies to whatever response middleware returns, so the
  // copy keeps them. Never throw here: Astro would then serve a 500 with no
  // security headers at all.
  try {
    const copy = new Response(response.body, response);
    applyHeaders(copy.headers);
    return copy;
  } catch (error) {
    console.error(
      `security headers: could not copy immutable response for ${context.url.pathname}`,
      error,
    );
    return response;
  }
});
