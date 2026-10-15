import type { APIRoute } from 'astro';
import { signUpload } from '@/lib/cloudinary';

const FOLDERS = new Set(['projects', 'services', 'testimonials', 'settings']);
export const GET: APIRoute = async ({ url }) => {
  const kind = url.searchParams.get('kind');
  const folder = url.searchParams.get('folder') ?? '';
  if ((kind !== 'image' && kind !== 'video') || !FOLDERS.has(folder)) {
    return Response.json({ error: 'Bad request' }, { status: 400 });
  }
  return Response.json(await signUpload(`filmage/${folder}`, kind));
};
