import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import { Pool, neonConfig } from '@neondatabase/serverless';
import Database from 'better-sqlite3';
import ws from "ws";
import * as schema from "@shared/schema";
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import fs from 'fs';
import path from 'path';

neonConfig.webSocketConstructor = ws;

export type DbMode = 'neon' | 'sqlite-file' | 'sqlite-memory';
export type AppDatabase = NodePgDatabase<typeof schema> | BetterSQLite3Database<typeof schema>;

interface DatabaseConnection {
  db: AppDatabase;
  mode: DbMode;
  close?: () => void;
}

let cachedConnection: DatabaseConnection | null = null;

export function getDbMode(): DbMode {
  const mode = process.env.DB_MODE?.toLowerCase() as DbMode | undefined;

  if (!mode) {
    return 'neon';
  }

  if (!['neon', 'sqlite-file', 'sqlite-memory'].includes(mode)) {
    console.warn(`Invalid DB_MODE "${mode}", defaulting to "neon". Valid options: neon, sqlite-file, sqlite-memory`);
    return 'neon';
  }

  return mode;
}

function createNeonConnection(): DatabaseConnection {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set when using DB_MODE=neon. Did you forget to provision a database?",
    );
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzleNeon({ client: pool, schema });

  console.log('✓ Database connected: Neon PostgreSQL');

  return {
    db,
    mode: 'neon',
    close: () => pool.end(),
  };
}

function createSqliteConnection(mode: 'sqlite-file' | 'sqlite-memory'): DatabaseConnection {
  let sqliteDb: Database.Database;

  if (mode === 'sqlite-file') {
    const dbPath = process.env.SQLITE_DB_PATH || './data/app.db';

    // Create directory if it doesn't exist
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    sqliteDb = new Database(dbPath);
    console.log(`✓ Database connected: SQLite (file: ${dbPath})`);
  } else {
    sqliteDb = new Database(':memory:');
    console.log('✓ Database connected: SQLite (in-memory)');
  }

  // Enable foreign keys for SQLite
  sqliteDb.pragma('foreign_keys = ON');

  const db = drizzleSqlite(sqliteDb, { schema });

  return {
    db,
    mode,
    close: () => sqliteDb.close(),
  };
}

export function getDatabaseConnection(): DatabaseConnection {
  if (cachedConnection) {
    return cachedConnection;
  }

  const mode = getDbMode();

  switch (mode) {
    case 'neon':
      cachedConnection = createNeonConnection();
      break;
    case 'sqlite-file':
    case 'sqlite-memory':
      cachedConnection = createSqliteConnection(mode);
      break;
    default:
      throw new Error(`Unsupported database mode: ${mode}`);
  }

  return cachedConnection;
}

export function closeDatabaseConnection(): void {
  if (cachedConnection?.close) {
    cachedConnection.close();
    cachedConnection = null;
  }
}

// Export the database instance
const connection = getDatabaseConnection();
export const db = connection.db;
export const dbMode = connection.mode;
