import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

let db: ReturnType<typeof drizzle>;

if (typeof window === 'undefined') {
  const sqlite = new Database('chat.db');
  db = drizzle(sqlite, { schema });
} else {
  db = null;
}

export { db }; 