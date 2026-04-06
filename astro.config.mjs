// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: "https://solanacolombia.com",
  output: 'server',
  adapter: cloudflare(),
  image: {
    service: { entrypoint: 'astro/assets/services/compile' },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});