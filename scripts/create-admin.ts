import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { users } from '../src/db/schema';
import { hashPassword } from '../src/lib/password';

const { DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
if (!DATABASE_URL || !ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error('Set DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD');
if (ADMIN_PASSWORD.length < 12) throw new Error('ADMIN_PASSWORD must be at least 12 characters');

const db = drizzle(neon(DATABASE_URL));
await db.insert(users).values({ email: ADMIN_EMAIL.toLowerCase(), passwordHash: await hashPassword(ADMIN_PASSWORD) })
  .onConflictDoUpdate({ target: users.email, set: { passwordHash: await hashPassword(ADMIN_PASSWORD) } });
console.log(`Admin ready: ${ADMIN_EMAIL}. Remove ADMIN_PASSWORD from your .env now.`);
