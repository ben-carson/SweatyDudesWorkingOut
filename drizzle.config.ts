import { defineConfig } from "drizzle-kit";

const dbMode = (process.env.DB_MODE || 'neon').toLowerCase();
const isSqlite = dbMode === 'sqlite-file' || dbMode === 'sqlite-memory';

if (!isSqlite && !process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set when using DB_MODE=neon");
}

if (isSqlite) {
  const dbPath = dbMode === 'sqlite-memory' ? ':memory:' : (process.env.SQLITE_DB_PATH || './data/app.db');

  export default defineConfig({
    out: "./migrations",
    schema: "./shared/schema.ts",
    dialect: "sqlite",
    dbCredentials: {
      url: dbPath,
    },
  });
} else {
  export default defineConfig({
    out: "./migrations",
    schema: "./shared/schema.ts",
    dialect: "postgresql",
    dbCredentials: {
      url: process.env.DATABASE_URL!,
    },
  });
}
