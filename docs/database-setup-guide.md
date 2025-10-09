# Database Setup Guide

This guide explains how to set up and switch between different database modes in the application.

## Overview

The application supports three database modes:

1. **neon** (default) - PostgreSQL via Neon serverless database
2. **sqlite-file** - File-based SQLite for local development with persistence
3. **sqlite-memory** - In-memory SQLite for fast testing with clean state

## Quick Start

### Using SQLite for Local Development

1. Set the database mode in your `.env` file or use npm scripts:

```bash
# Using npm scripts (recommended)
npm run dev:sqlite

# Or manually set environment variable
DB_MODE=sqlite-file npm run dev
```

2. Initialize the SQLite database schema:

```bash
npm run db:push:sqlite
```

3. Your SQLite database file will be created at `./data/app.db` by default.

### Using Neon PostgreSQL (Production)

1. Make sure you have a Neon database provisioned and `DATABASE_URL` set in `.env`:

```bash
DATABASE_URL=postgresql://user:pass@host/database
```

2. Run with Neon mode (this is the default):

```bash
npm run dev:neon
# or just
npm run dev
```

3. Push schema to Neon:

```bash
npm run db:push:neon
# or just
npm run db:push
```

## Environment Variables

### Database Configuration

```bash
# DB_MODE: Controls which database to use (default: neon)
# Options: neon, sqlite-file, sqlite-memory
DB_MODE=neon

# SQLite Configuration (only used when DB_MODE=sqlite-file)
SQLITE_DB_PATH=./data/app.db

# Neon Database (PostgreSQL)
DATABASE_URL=your_neon_connection_string_here
```

### Stack Auth Configuration

Stack Auth works identically with all database modes. Configure these environment variables:

```bash
VITE_STACK_PROJECT_ID=your_project_id
VITE_STACK_PUBLISHABLE_CLIENT_KEY=your_publishable_key
STACK_SECRET_SERVER_KEY=your_secret_key
```

## NPM Scripts

### Development

- `npm run dev` - Start with default mode (neon)
- `npm run dev:sqlite` - Start with SQLite file mode
- `npm run dev:neon` - Start with Neon mode explicitly

### Database Operations

- `npm run db:push` - Push schema to database (auto-detects mode)
- `npm run db:push:sqlite` - Push schema to SQLite
- `npm run db:push:neon` - Push schema to Neon
- `npm run db:generate` - Generate migration files

## Switching Between Databases

You can switch between databases by changing the `DB_MODE` environment variable:

```bash
# Switch to SQLite
DB_MODE=sqlite-file npm run dev

# Switch back to Neon
DB_MODE=neon npm run dev

# Or unset DB_MODE to use default (neon)
npm run dev
```

**Important**: Each database maintains its own data. Switching databases means you're working with a different dataset.

## Use Cases

### When to Use SQLite

- **Local development** without internet connection
- **Fast prototyping** with quick database resets
- **Testing** with isolated, reproducible data
- **CI/CD pipelines** for automated testing

### When to Use Neon PostgreSQL

- **Production deployments**
- **Shared development environments**
- **Data that needs to persist across team members**
- **When you need PostgreSQL-specific features**

## Data Persistence

### SQLite File Mode

Data persists to the file specified in `SQLITE_DB_PATH` (default: `./data/app.db`). The database file survives application restarts.

To reset your SQLite database:

```bash
rm ./data/app.db
npm run db:push:sqlite
```

### SQLite Memory Mode

Data exists only in memory and is lost when the application stops. Useful for testing with clean state.

```bash
DB_MODE=sqlite-memory npm run dev
```

### Neon Mode

Data persists in your Neon PostgreSQL database and is accessible from anywhere with internet connection.

## Troubleshooting

### Database connection errors

If you see "DATABASE_URL must be set" error:

1. Check that `DATABASE_URL` is set in your `.env` file
2. Make sure you're using the correct database mode
3. For SQLite, you don't need `DATABASE_URL`

### Schema out of sync

If you see schema-related errors after switching databases:

```bash
# For SQLite
DB_MODE=sqlite-file npm run db:push

# For Neon
DB_MODE=neon npm run db:push
```

### SQLite database locked

If you encounter "database is locked" errors:

1. Make sure no other processes are using the database
2. Close any database browser tools
3. Restart the development server

## Authentication with Stack Auth

Stack Auth operates independently of your database choice. It handles authentication via API calls to their service. Your database only stores application data (workouts, challenges, etc.) that references the authenticated user ID from Stack Auth.

This means:
- Authentication works identically with SQLite or Neon
- User sessions are managed by Stack Auth
- Your database just stores user-specific data

## Technical Details

### ID Generation

- **PostgreSQL**: Uses `gen_random_uuid()` function
- **SQLite**: Uses `nanoid()` library for unique IDs

### Timestamps

- **PostgreSQL**: Uses native `timestamp` type with `now()` default
- **SQLite**: Uses `integer` with Unix timestamp mode and `unixepoch()` default

### Foreign Keys

- **PostgreSQL**: Foreign keys enforced by default
- **SQLite**: Foreign keys explicitly enabled via `PRAGMA foreign_keys = ON`

## Migration Between Databases

Currently, there's no automatic migration tool between SQLite and Neon. If you need to move data:

1. Export data from source database
2. Transform data format if needed
3. Import into destination database

For production, always use Neon PostgreSQL as your primary database.
