import 'dotenv/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('Missing DATABASE_URL in .env');

// Single connection is enough for migrations. Works with Neon pooler
// over TCP, unlike drizzle-kit which needs a websocket (ws package).
const client = postgres(url, { max: 1 });
const db = drizzle(client);

await migrate(db, { migrationsFolder: './drizzle' });
await client.end();
console.log('Migrations applied.');
