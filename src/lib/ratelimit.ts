import { eq } from 'drizzle-orm';
import { getDb, schema } from '@/db/client';

const sha = async (s: string) =>
  [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map((b) => b.toString(16).padStart(2, '0')).join('');

/** Returns true if the request is allowed. Default: 5 per hour per IP (hashed, never stored raw). */
export async function allow(scope: string, ip: string, limit = 5, windowMs = 3_600_000) {
  const db = getDb();
  const key = `${scope}:${(await sha(ip)).slice(0, 40)}`;
  const [row] = await db.select().from(schema.rateLimits).where(eq(schema.rateLimits.key, key)).limit(1);
  const now = new Date();
  if (!row || now.getTime() - row.windowStart.getTime() > windowMs) {
    await db.insert(schema.rateLimits).values({ key, count: 1, windowStart: now })
      .onConflictDoUpdate({ target: schema.rateLimits.key, set: { count: 1, windowStart: now } });
    return { ok: true, ipHash: key.split(':')[1]! };
  }
  if (row.count >= limit) return { ok: false, ipHash: key.split(':')[1]! };
  await db.update(schema.rateLimits).set({ count: row.count + 1 }).where(eq(schema.rateLimits.key, key));
  return { ok: true, ipHash: key.split(':')[1]! };
}
