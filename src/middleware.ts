import { defineMiddleware } from 'astro:middleware';
import { eq } from 'drizzle-orm';
import { getDb, schema } from '@/db/client';
import { getEnv } from '@/lib/env';
import { COOKIE, readSession } from '@/lib/session';

const RESET_PATHS = new Set(['/admin/reset', '/admin/reset-password', '/admin/forgot', '/admin/forgot-password']);
const isProtected = (p: string) =>
  (p.startsWith('/admin') && p !== '/admin/login' && !RESET_PATHS.has(p)) || p.startsWith('/api/admin');

export const onRequest = defineMiddleware(async (ctx, next) => {
  const { pathname } = ctx.url;
  if (isProtected(pathname)) {
    const uid = await readSession(ctx.cookies.get(COOKIE)?.value, getEnv().AUTH_SECRET);
    const [user] = uid
      ? await getDb().select({ id: schema.users.id, email: schema.users.email, role: schema.users.role })
          .from(schema.users).where(eq(schema.users.id, uid)).limit(1)
      : [];
    if (!user || user.role !== 'admin') {
      return pathname.startsWith('/api/')
        ? new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
        : ctx.redirect('/admin/login');
    }
    ctx.locals.user = user;
  }
  const res = await next();
  if (pathname.startsWith('/admin') || pathname.startsWith('/api')) {
    res.headers.set('Cache-Control', 'no-store');
    res.headers.set('X-Robots-Tag', 'noindex');
  }
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('X-Frame-Options', 'DENY');
  return res;
});
