import type { APIRoute } from 'astro';
export const GET: APIRoute = ({ site }) =>
  new Response(`User-agent: *\nDisallow: /admin\nDisallow: /api\nSitemap: ${new URL('/sitemap-index.xml', site).href}\n`);
