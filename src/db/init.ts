import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema';

const sqlite = new Database('chat.db');
const db = drizzle(sqlite, { schema });

// Run migrations
async function main() {
  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migrations completed');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

main(); 