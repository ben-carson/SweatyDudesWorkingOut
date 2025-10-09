# Multi-Database Connection Strategy Implementation Plan

## Overview

This document outlines the implementation plan for adding SQLite support to the application while maintaining full compatibility with the existing Neon PostgreSQL database. This enables flexible database switching between production (Neon) and development (SQLite) environments without code changes.

## Key Design Decisions

### Authentication Architecture
- **Stack Auth** (formerly "Neon Auth") handles all authentication independently via API
- Stack Auth does NOT depend on database choice - it works identically with both PostgreSQL and SQLite
- Authentication tokens, user verification, and session management remain completely unchanged
- Only application data (workouts, challenges, exercises, etc.) is stored in the chosen database

### Database Abstraction Strategy
- Use **Drizzle ORM** as the abstraction layer for cross-database compatibility
- Replace PostgreSQL-specific functions (e.g., `gen_random_uuid()`) with portable alternatives
- Environment variable `DB_MODE` controls which database to use
- Default behavior (no `DB_MODE` set) uses Neon PostgreSQL for backwards compatibility

## Implementation Steps

### 1. Database Abstraction Layer Setup

**Goal:** Create a flexible connection factory that initializes the appropriate database driver based on configuration.

**Tasks:**
- Create `server/db-factory.ts` module for database connection management
- Support three modes:
  - `neon` - Production PostgreSQL database (default)
  - `sqlite-file` - File-based SQLite for local development with persistence
  - `sqlite-memory` - In-memory SQLite for fast testing
- Extract current Neon configuration from `server/db.ts` into connection provider
- Create SQLite connection provider with configurable path
- Implement unified database client interface compatible with both databases
- Preserve Stack Auth integration completely unchanged

**Dependencies:**
- `better-sqlite3` - SQLite driver for Node.js
- `drizzle-orm/better-sqlite3` - Drizzle adapter for SQLite
- `cuid2` or `nanoid` - Cross-database ID generation

### 2. Schema Compatibility Adjustments

**Goal:** Make the database schema work identically on both PostgreSQL and SQLite.

**Tasks:**
- Update `shared/schema.ts` to use cross-compatible field types
- Replace `gen_random_uuid()` with `cuid2()` or similar for ID generation
- Ensure all timestamp fields use Drizzle's portable timestamp types
- Verify foreign key constraints work on both databases
- Test that indexes are properly created on both databases
- Maintain separate schema exports if needed for dialect-specific features
- Document any unavoidable differences between databases

**Compatibility Considerations:**
- PostgreSQL `uuid` → SQLite `text` with cuid/nanoid
- PostgreSQL `timestamptz` → Portable timestamp abstraction
- Boolean, integer, and text types are compatible
- JSON support differs (PostgreSQL native, SQLite text-based)

### 3. Stack Auth Integration Verification

**Goal:** Ensure authentication works identically regardless of database backend.

**Tasks:**
- Review `server/auth.ts` authentication middleware
- Verify Stack Auth token verification is database-agnostic
- Confirm user ID mapping works with both database types
- Test sign-in, sign-up, and session management flows
- Ensure user records are created properly in active database
- Keep all Stack Auth environment variables unchanged:
  - `VITE_STACK_PROJECT_ID`
  - `VITE_STACK_PUBLISHABLE_CLIENT_KEY`
  - `STACK_SECRET_SERVER_KEY`

**No Changes Required:**
- Stack Auth API calls remain identical
- Token storage and verification unchanged
- User profile data extraction works the same

### 4. Configuration Management

**Goal:** Make database switching simple via environment variables.

**Tasks:**
- Add `DB_MODE` environment variable with values: `neon`, `sqlite-file`, `sqlite-memory`
- Add `SQLITE_DB_PATH` environment variable (default: `./data/app.db`)
- Update `drizzle.config.ts` to detect and use correct database configuration
- Create conditional exports based on active database mode
- Add startup validation to catch configuration errors early
- Default to `neon` mode when `DB_MODE` is unset
- Document all configuration options in `.env.example`

**Environment Variables:**
```bash
# Database Configuration
DB_MODE=neon|sqlite-file|sqlite-memory  # Default: neon
SQLITE_DB_PATH=./data/app.db            # Only used when DB_MODE=sqlite-file

# Existing Neon Database
DATABASE_URL=postgresql://...

# Stack Auth (unchanged)
VITE_STACK_PROJECT_ID=...
VITE_STACK_PUBLISHABLE_CLIENT_KEY=...
STACK_SECRET_SERVER_KEY=...
```

### 5. Storage Layer Updates

**Goal:** Ensure all database operations work identically across both backends.

**Tasks:**
- Review `server/storage.ts` DatabaseStorage class
- Test all CRUD operations with both databases
- Verify date/time handling is consistent
- Ensure aggregation queries work on both databases
- Test null handling and default values
- Add database-specific query variations only if absolutely necessary
- Maintain the `IStorage` interface unchanged for API stability
- Test workout tracking, challenges, and user management features

**Critical Operations to Test:**
- Creating and reading workout sessions
- Tracking exercise sets and reps
- Challenge creation and participation
- Friend connections and social features
- Progress tracking and statistics
- Date range queries and aggregations

### 6. Development Tooling and Scripts

**Goal:** Make it easy to switch between database modes and manage schemas.

**Tasks:**
- Add npm scripts:
  - `dev:sqlite` - Run development server with SQLite
  - `dev:neon` - Run development server with Neon
  - `db:setup:sqlite` - Initialize SQLite database
  - `db:seed` - Populate database with test data (works with both)
  - `db:reset` - Clear and reinitialize development database
- Update `db:push` script to auto-detect database mode
- Create seed data that works with both databases
- Add documentation for each script in README

**Example npm Scripts:**
```json
{
  "dev:sqlite": "DB_MODE=sqlite-file npm run dev",
  "dev:neon": "DB_MODE=neon npm run dev",
  "db:setup:sqlite": "DB_MODE=sqlite-file drizzle-kit push",
  "db:seed": "tsx scripts/seed.ts",
  "db:reset": "tsx scripts/reset-db.ts"
}
```

### 7. Testing and Fallback Strategy

**Goal:** Ensure robust operation and backwards compatibility.

**Tasks:**
- Keep all existing Neon database connection information intact
- Verify default behavior (no `DB_MODE`) uses Neon
- Add startup logging showing active database mode
- Test environment variable changes don't require code modifications
- Test all CRUD operations on both databases
- Test Stack Auth flows (sign-in, sign-up, user creation) with both databases
- Verify data consistency between database modes
- Test error handling for missing configuration
- Test database connection failures

**Backwards Compatibility Checklist:**
- [ ] Existing `.env` files work without changes
- [ ] Default behavior unchanged (uses Neon)
- [ ] No breaking changes to API or storage interface
- [ ] Stack Auth integration unchanged
- [ ] All existing features work identically
- [ ] Production deployment unaffected

## Implementation Order

1. **Phase 1: Setup** (Low Risk)
   - Create docs folder and plan document
   - Install SQLite dependencies
   - Create database factory module

2. **Phase 2: Schema Migration** (Medium Risk)
   - Update schema for cross-compatibility
   - Replace UUID generation with portable solution
   - Test schema on both databases

3. **Phase 3: Configuration** (Low Risk)
   - Add environment variables
   - Update drizzle config
   - Add npm scripts

4. **Phase 4: Storage Layer** (Medium Risk)
   - Update storage implementation
   - Test all database operations
   - Verify query compatibility

5. **Phase 5: Testing** (Critical)
   - Test database switching
   - Verify Stack Auth integration
   - Test all application features
   - Run build verification

## Success Criteria

- [ ] Application starts successfully with `DB_MODE=neon` (default)
- [ ] Application starts successfully with `DB_MODE=sqlite-file`
- [ ] Application starts successfully with `DB_MODE=sqlite-memory`
- [ ] Stack Auth login/signup works with all database modes
- [ ] All workout tracking features work identically
- [ ] All challenge features work identically
- [ ] Database can be switched by changing environment variable only
- [ ] SQLite file mode persists data across restarts
- [ ] SQLite memory mode starts with clean state
- [ ] npm run build succeeds
- [ ] No breaking changes to existing functionality

## Rollback Plan

If issues arise during implementation:

1. All changes are additive - existing Neon setup remains untouched
2. Default behavior (no `DB_MODE`) continues to use Neon
3. Can remove SQLite dependencies and factory module without affecting core app
4. Stack Auth integration is never modified, so no risk there

## Future Enhancements

- Add automated migration script to convert SQLite data to PostgreSQL
- Add database performance profiling
- Support additional databases (MySQL, etc.)
- Create database-agnostic test suite
- Add database health checks and monitoring

## Notes

- Stack Auth is completely independent of database choice
- This implementation maintains full backwards compatibility
- No changes required to existing production deployments
- SQLite is for development/testing only - Neon remains production database
