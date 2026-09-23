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

export const db = drizzle(sqlite, { schema });
