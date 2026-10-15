import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import { getEnv } from '@/lib/env';

export function getDb() {
  return drizzle(neon(getEnv().DATABASE_URL), { schema });
}
export { schema };
