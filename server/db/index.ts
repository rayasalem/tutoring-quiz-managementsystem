import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema.ts';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure path is absolute relative to project root
const dbPath = process.env.APP_DATABASE_PATH || 'quiz.db';
const absoluteDbPath = path.isAbsolute(dbPath) 
  ? dbPath 
  : path.resolve(__dirname, '../../', dbPath);

console.log(`[DB] Opening database at: ${absoluteDbPath}`);
const sqlite = new Database(absoluteDbPath);

try {
  sqlite.exec('CREATE UNIQUE INDEX IF NOT EXISTS attempts_user_id_quiz_id_unique ON attempts(user_id, quiz_id);');
} catch {
  // Table not yet created, will be created on push/seed
}

export const db = drizzle(sqlite, { schema });
