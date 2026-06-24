# NOTES

- scrape to recruit builders
- university outreach
- motivational vlogs


## Universities
| University Name | Type | Location (Primary Campus) | Blockchain Activity | Website |
| --- | --- | --- | --- | --- |
| Corporación Universitaria Americana | Private | Medellín | No | Corporación Universitaria Americana - Barranquilla |
| Corporación Universitaria Lasallista | Private | Caldas (metro area) | No | https://www.lasallista.edu.co/ |
| Corporación Universitaria Minuto de Dios (Uniminuto) - Sede Medellín | Private | Medellín | No | https://medellin.uniminuto.edu/ |
| Corporación Universitaria Remington | Private | Medellín | No | Corporación Universitaria Remington - Corporación Universitaria Remington |
| Escuela Superior de Administración Pública (ESAP) - Sede Medellín | Public | Medellín | No | Inicio - Escuela Superior de Administración Pública |
| Fundación Universitaria María Cano | Private | Medellín | No | https://www.mariacano.edu.co/ |
| Fundación Universitaria del Área Andina | Private | Medellín | No | https://www.areaandina.edu.co/ |
| Institución Universitaria Colegio Mayor de Antioquia | Public | Medellín | No | Institución Universitaria Colegio Mayor de Antioquia |
| Institución Universitaria de Envigado (IUE) | Public | Envigado | No | https://www.unenvigado.edu.co/ |
| Institución Universitaria Pascual Bravo | Public | Medellín | No | Inicio - Institución Universitaria Pascual Bravo |
| Instituto Tecnológico Metropolitano (ITM) | Public | Medellín (campuses in Bello) | Yes (Blockchain Forensics Research Group; publications on DLT integrity) | https://www.itm.edu.co/ |
| Politécnico Colombiano Jaime Isaza Cadavid | Public | Medellín | No | https://www.politecnicojic.edu.co/ |
| Tecnológico de Antioquia (TdeA) | Public | La Unión (surrounding area, ~20km) | Yes (Blockchain Applied Research Group; courses on Ethereum/smart contracts) | Estudia pregrados, posgrados y programas continuos en TdeA |
| Universidad Antonio Nariño (UAN) - Sede Medellín | Private | Medellín | No | Universidad Antonio Nariño - Generalidades |
| Universidad Autónoma Latinoamericana (Unaula) | Private | Medellín | No | principal | Unaula |
| Universidad Católica Luis Amigó (Unila) | Private | Itagüí | No | Carreras en la Universidad Católica Luis Amigó |
| Universidad CES | Private | Sabaneta | No | Universidad CES | Pregrados, Postgrados y Educación Continua |
| Universidad Cooperativa de Colombia (UCC) - Sede Medellín | Private | Medellín (campuses in Envigado) | No | https://medellin.ucc.edu.co/ |
| Universidad de Antioquia (UdeA) | Public | Medellín (regional in Envigado, etc.) | Yes (Hackathon Blockchain Medellín; research on CBDCs/crypto; ICP events) | Universidad de Antioquia |
| Universidad de Envigado | Public | Envigado | No | https://www.unenvigado.edu.co/ (Note: Distinct from IUE) |
| Universidad de Medellín (UdeM) | Private | Medellín | No | Universidad de Medellín |
| Universidad de San Buenaventura (USB) - Sede Medellín | Private | Medellín | No | Rectoría General |
| Universidad EAFIT | Private | Medellín (El Poblado) | Yes (Blockchain Innovation Lab; fintech courses; Blockchain Summit Latam host) | ¡Te damos la bienvenida a la Universidad EAFIT! |
| Universidad ECCI - Sede Medellín | Private | Medellín | No | https://medellin.ecci.edu.co/ |
| Universidad Nacional de Colombia - Sede Medellín (UNAL Medellín) | Public | Medellín | Yes (InTIColombia Research Group; DApps/smart contracts; national Blockchain initiative) | Universidad Nacional de Colombia : Sede Medellin - La sede |
| Universidad Pontificia Bolivariana (UPB) | Private | Medellín (campus in Bello) | Yes (Blockchain Development Group; "Desarrollo de Aplicaciones Blockchain" course; workshops) | Universidad Pontificia Bolivariana | UPB |
| Universidad Sergio Arboleda - Sede Medellín | Private | Medellín | No | https://www.usergioarboleda.edu.co/sedes/medellin |
| Universidad Universidad de Investigación y Desarrollo (UDI) | Private | Yumbo (but metro extension; limited presence) | No | Universidad de Investigación y Desarrollo - UDI (Minimal Medellín activity) |

## Security findings — builders portal (recorded 2026-06-24, NOT yet fixed)

Headline: **authentication is broken at the root.** Login trusts a client-claimed
wallet address with no signature proof, and session cookies are unsigned — so anyone
can impersonate any builder (including the admin) by sending/setting a cookie. Everything
below follows from that.

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

### Suggested fix order
SIWS verification + signed sessions (1, 2) first — closes account/admin takeover. Then authz on the
leaking endpoints (3, 4), then headers + XSS (5, 6), then env + input hygiene (7, 8).