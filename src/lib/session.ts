// Stateless signed-cookie sessions (HMAC-SHA256). Token = userId.expiry.signature
const enc = new TextEncoder();
const TTL = 60 * 60 * 24 * 7;
export const COOKIE = 'filmage_session';

async function sign(data: string, secret: string) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function createSession(userId: number, secret: string) {
  const exp = Math.floor(Date.now() / 1000) + TTL;
  const data = `${userId}.${exp}`;
  return `${data}.${await sign(data, secret)}`;
}

export async function readSession(token: string | undefined, secret: string): Promise<number | null> {
  if (!token) return null;
  const [id, exp, sig] = token.split('.');
  if (!id || !exp || !sig) return null;
  const expected = await sign(`${id}.${exp}`, secret);
  if (expected.length !== sig.length) return null;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  if (diff !== 0 || Number(exp) < Date.now() / 1000) return null;
  return Number(id);
}

export const cookieOptions = { httpOnly: true, secure: true, sameSite: 'strict' as const, path: '/', maxAge: TTL };
