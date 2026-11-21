// @ts-check

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
const gitHash = execSync('git rev-parse --short HEAD').toString().trim();

// https://astro.build/config
export default defineConfig({
  site: 'https://solanacolombia.com',
  output: 'server',
  adapter: cloudflare(),
  // Astro hashes its own scripts and styles and sends the policy as a
  // Content-Security-Policy header on every server-rendered route.
  // The one-page hub (PAN-420) loads nothing third-party, so the policy is
  // same-origin only.
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "frame-ancestors 'self'",
        "form-action 'self'",
        "img-src 'self' data:",
        "font-src 'self' data:",
        "connect-src 'self'",
      ],
      // Inline style attributes and the <style> blocks Astro emits for
      // transition:name cannot be hashed, so styles allow 'unsafe-inline'.
      // Scripts stay hash-only.
      styleDirective: {
        resources: ["'self'", "'unsafe-inline'"],
      },
      scriptDirective: {
        resources: ["'self'"],
      },
    },
  },
  image: {
    service: { entrypoint: 'astro/assets/services/compile' },
  },
  vite: {
    plugins: [tailwindcss()],
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
      __GIT_HASH__: JSON.stringify(gitHash),
    },
  },
});
