// Delivery URLs are public (cloud name only). Signing uses the secret — server only.
import { getEnv } from './env';

const BASE = (cloud: string, type: 'image' | 'video') => `https://res.cloudinary.com/${cloud}/${type}/upload`;
export const cloudName = () => getEnv().CLOUDINARY_CLOUD_NAME;

/** Optimised image URL: auto format (AVIF/WebP) + auto quality. */
export function img(publicId: string, w: number, opts: { h?: number; crop?: 'fill' | 'fit' } = {}) {
  const t = ['f_auto', 'q_auto', `w_${w}`, ...(opts.h ? [`h_${opts.h}`, `c_${opts.crop ?? 'fill'}`, 'g_auto'] : ['c_limit'])];
  return `${BASE(cloudName(), 'image')}/${t.join(',')}/${publicId}`;
}
export function srcset(publicId: string, widths = [480, 768, 1200, 1800]) {
  return widths.map((w) => `${img(publicId, w)} ${w}w`).join(', ');
}
export const videoPoster = (id: string, w = 1280) =>
  `${BASE(cloudName(), 'video')}/so_0,f_auto,q_auto,w_${w}/${id}.jpg`;
export const videoSrc = (id: string, w = 1280) => ({
  mp4: `${BASE(cloudName(), 'video')}/f_mp4,vc_h264,q_auto,w_${w}/${id}.mp4`,
  webm: `${BASE(cloudName(), 'video')}/f_webm,q_auto,w_${w}/${id}.webm`,
});

/** Signed upload params: the browser uploads straight to Cloudinary and never sees the secret. */
export async function signUpload(folder: string, resourceType: 'image' | 'video') {
  const { CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_CLOUD_NAME } = getEnv();
  const timestamp = Math.floor(Date.now() / 1000);
  const allowed = resourceType === 'image' ? 'jpg,jpeg,png,webp,avif' : 'mp4,mov,webm';
  const params: Record<string, string | number> = { allowed_formats: allowed, folder, timestamp };
  const toSign = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join('&') + CLOUDINARY_API_SECRET;
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(toSign));
  const signature = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return {
    url: `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
    fields: { ...params, api_key: CLOUDINARY_API_KEY, signature },
  };
}

/** Best-effort removal of an asset from Cloudinary (signed, server only). */
export async function destroyAsset(publicId: string, resourceType: 'image' | 'video' = 'image') {
  const { CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_CLOUD_NAME } = getEnv();
  const timestamp = Math.floor(Date.now() / 1000);
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(`public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`));
  const signature = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
  const body = new URLSearchParams({ public_id: publicId, timestamp: String(timestamp), api_key: CLOUDINARY_API_KEY, signature });
  try { await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/destroy`, { method: 'POST', body }); } catch { /* ignore */ }
}
