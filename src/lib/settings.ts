import { getDb, schema } from '@/db/client';

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await getDb().select().from(schema.siteSettings);
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}
