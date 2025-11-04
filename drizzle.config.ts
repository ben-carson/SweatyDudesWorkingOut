import { defineConfig } from "drizzle-kit";

const dbMode = (process.env.DB_MODE || 'neon').toLowerCase();
const isSqlite = dbMode === 'sqlite-file' || dbMode === 'sqlite-memory';

if (!isSqlite && !process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set when using DB_MODE=neon");
}

const dbPath = dbMode === 'sqlite-memory' ? ':memory:' : (process.env.SQLITE_DB_PATH || './data/app.db');

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: isSqlite ? "sqlite" : "postgresql",
  dbCredentials: isSqlite
    ? { url: dbPath }
    : { url: process.env.DATABASE_URL! },
});
