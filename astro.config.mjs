// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: "https://solanacolombia.com",
  output: 'server', // Enable SSR for API routes
  adapter: cloudflare({
    platformProxy: {
      enabled: true
    },
    functionPerRoute: false,
    wasmModuleImports: false,
  }),
  vite: {
    plugins: [tailwindcss()],
  },
});