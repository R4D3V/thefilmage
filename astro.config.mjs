import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://thefilmage.com', // TODO: set your production domain
  output: 'server',
  adapter: vercel(),
  integrations: [sitemap({ filter: (p) => !p.includes('/admin') && !p.includes('/api') })],
  vite: { plugins: [tailwindcss()] },
  security: { checkOrigin: true },
});
