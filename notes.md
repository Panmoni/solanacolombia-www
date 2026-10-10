# NOTES

## Security findings — builders portal (fixed & deployed 2026-06-24)

Status: **fixed and deployed** (commit 3795e41; pnpm-CI pin b4460ef). All findings
below were addressed — SIWS signature verification, HMAC-signed sessions, admin/IDOR
gates, security headers, XSS escaping, input limits. Existing sessions were invalidated
by the cookie-format change, so builders must re-sign-in (sign a message with their
wallet). Verified live: security headers present, /api/builders/list and
/api/builders/projects return 401 unauthenticated. Residual items are tracked in Linear (PAN-52, PAN-60, PAN-64, PAN-71).

### CRITICAL

1. **Auth bypass — no wallet signature verification.** `src/pages/api/builders/login.ts:9-39`
   accepts `{ wallet }` from the POST body and immediately sets a session for it. The frontend
   (`src/pages/builders/index.astro:548`) only sends the connected address — connecting a wallet
   proves the browser *knows* an address, not that the user *controls* it. `POST /api/builders/login
   { wallet: "<victim or admin>" }` → full impersonation.
   **Fix:** Sign-In-with-Solana — server issues a nonce, client signs it with the wallet
   (`window.solana.signMessage`), server verifies the Ed25519 signature against the claimed address
   (tweetnacl / `@solana/wallet-adapter`). Apply the same proof to `register.ts` and `check.ts`.

2. **Unsigned session cookies → privilege escalation.** `src/lib/auth.ts` stores `wallet`, `role`,
   `name`, … as plaintext cookies; `getSession` reads them verbatim with no HMAC. Flip the `role`
   cookie to `admin` → admin panel + CSV export. Both gates trust these values:
   `src/pages/builders/admin.astro:11` (`session.wallet !== ADMIN_WALLET`) and
   `src/pages/api/builders/export.ts:24` (`builder.role !== 'admin'`).
   **Fix:** HMAC-sign cookies with a server secret and verify on read; store **only** the wallet in
   the session and derive `role` from the DB on demand (never trust a client-set role).

### HIGH

3. **Unauthenticated PII leak.** `src/pages/api/builders/list.ts` runs `SELECT * FROM builders` and
   returns wallets, emails, telegram, twitter to anyone — no session check. (`export.ts` correctly
   gates on admin; `list.ts`, which the admin panel also calls, does not.)
   **Fix:** require an admin session (mirror `export.ts`).

4. **IDOR on wallet-by-query-param endpoints.** `src/pages/api/builders/projects.ts` and
   `src/pages/api/builders/pending-requests.ts` take `wallet` from the query string instead of the
   session → enumerate/impersonate any wallet's projects and pending requests.
   **Fix:** derive `wallet` from the session, ignore the query param.

### MEDIUM

5. **Stored XSS.** `src/pages/builders/index.astro` renders `b.name`, `p.name`, `p.description`,
   `p.website` via `innerHTML` in `loadProfile`/`loadProjects` (~lines 389-446). A malicious
   registration (e.g. name = `<img src=x onerror=…>`) executes JS in the owner's/admin's browser.
   `admin.astro` mostly uses `textContent` (good) but has one `innerHTML` with `p.id` at ~line 217
   (low risk, uuid). **Fix:** use `textContent` / DOM methods or escape.

6. **No security headers.** `src/layouts/Layout.astro` sets no CSP, HSTS, X-Frame-Options,
   X-Content-Type-Options, Referrer-Policy, or Permissions-Policy. **Fix:** add via Astro middleware
   (`Astro.response.headers`) or a `public/_headers` file.

### LOW

7. **`ADMIN_WALLET` likely not resolvable.** `admin.astro:8` reads `import.meta.env.ADMIN_WALLET`,
   which on the Cloudflare Workers runtime is baked at build / probably undefined → falls back to the
   literal `"YOUR_ADMIN_WALLET_ADDRESS"`. Net effect: the real admin can't get in AND no one matches
   the placeholder. **Fix:** read from `env` (`cloudflare:workers`) like the other endpoints and set it
   as a Wrangler var/secret.

8. **Missing input limits.** `register.ts` / `update.ts` slice `name` to 200 chars but not
   `email`/`telegram`/`twitter`/`university`; `email` is unvalidated. **Fix:** clamp lengths + basic
   email validation.
