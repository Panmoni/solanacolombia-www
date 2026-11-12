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
  // Third-party origins come from a runtime audit of the newsletter embed
  // (eocampaign1.com) and the reCAPTCHA it loads.
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "frame-ancestors 'self'",
        "form-action 'self' https://eocampaign1.com",
        "img-src 'self' data: https://eocampaign1.com https://gallery.eo.page https://www.gstatic.com",
        "font-src 'self' data:",
        "connect-src 'self' https://eocampaign1.com https://www.recaptcha.net",
        'frame-src https://lu.ma https://luma.com https://www.recaptcha.net https://www.google.com',
      ],
      // Inline style attributes and the <style> blocks Astro emits for
      // transition:name cannot be hashed, so styles allow 'unsafe-inline'.
      // Scripts stay hash-only.
      styleDirective: {
        resources: ["'self'", "'unsafe-inline'"],
      },
      scriptDirective: {
        resources: [
          "'self'",
          'https://eocampaign1.com',
          'https://www.recaptcha.net',
          'https://www.gstatic.com',
        ],
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
