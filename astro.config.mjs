import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://thefilmage.com', // TODO: set your production domain
  output: 'server',
  adapter: cloudflare(),
  integrations: [sitemap({ filter: (p) => !p.includes('/admin') && !p.includes('/api') })],
  vite: { plugins: [tailwindcss()] },
  security: { checkOrigin: true },
});
