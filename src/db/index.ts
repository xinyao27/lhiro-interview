import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

let db: BetterSQLite3Database<typeof schema>;
const sqlite = new Database('chat.db');
db = drizzle(sqlite, { schema });
export { db }; 