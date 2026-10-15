import { asc } from 'drizzle-orm';
import { getDb, schema } from '@/db/client';

export const slugify = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80) || 'item';
export const str = (f: FormData, k: string, max = 500) => String(f.get(k) ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max);
export const bool = (f: FormData, k: string) => f.get(k) === 'on';
export const int = (f: FormData, k: string, d = 0) => { const n = parseInt(String(f.get(k) ?? ''), 10); return Number.isFinite(n) ? n : d; };

const PUBLIC_ID = /^(thefilmage|filmage)\/[A-Za-z0-9_\-/]+$/;
/** Accepts "publicId|w|h". Only assets uploaded into our own folder are accepted (filmage/ = legacy). */
export function asset(v: FormDataEntryValue | null) {
  const [id, w, h] = String(v ?? '').split('|');
  if (!id || !PUBLIC_ID.test(id)) return null;
  return { publicId: id, width: Number(w) || null, height: Number(h) || null };
}
export const assets = (f: FormData, k: string) => f.getAll(k).map(asset).filter((a): a is NonNullable<ReturnType<typeof asset>> => !!a);

type Orderable = typeof schema.projects | typeof schema.services | typeof schema.testimonials;
/** Move a row up/down and renumber positions sequentially. */
export async function move(table: Orderable, id: number, dir: string) {
  const db = getDb();
  const rows = await db.select({ id: table.id, position: table.position }).from(table).orderBy(asc(table.position), asc(table.id));
  const i = rows.findIndex((r) => r.id === id);
  const j = dir === 'up' ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= rows.length) return;
  [rows[i], rows[j]] = [rows[j]!, rows[i]!];
  const { eq } = await import('drizzle-orm');
  await Promise.all(rows.map((r, idx) => (r.position === idx ? null : db.update(table).set({ position: idx }).where(eq(table.id, r.id)))));
}
