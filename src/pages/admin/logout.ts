import type { APIRoute } from 'astro';
import { COOKIE } from '@/lib/session';
export const POST: APIRoute = ({ cookies, redirect }) => { cookies.delete(COOKIE, { path: '/' }); return redirect('/admin/login'); };
