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
