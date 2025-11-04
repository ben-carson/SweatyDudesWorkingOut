# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SweatyDudes is a full-stack fitness tracking application built with React, Express, and PostgreSQL. It enables workout tracking, exercise logging, and fitness challenges with social features.

## Development Commands

### Essential Commands
- `npm run dev` - Start development server (backend + frontend on port 5000)
- `npm run build` - Build both frontend (Vite) and backend (esbuild) for production
- `npm start` - Run production server
- `npm run check` - Run TypeScript type checking
- `npm install --legacy-peer-deps` - Install dependencies (required due to React 19 peer deps)

### Database Management
- `npm run db:push` - Push schema changes to Neon PostgreSQL
- `npm run db:push:sqlite` - Push schema to SQLite (dev mode)
- `npm run db:push:neon` - Push schema to Neon (explicit)
- `npm run db:generate` - Generate Drizzle migrations

### Alternative Development Modes
- `npm run dev:sqlite` - Run with SQLite file database
- `npm run dev:neon` - Run with Neon PostgreSQL (explicit)

## Architecture

### Full-Stack Structure

This is a monorepo with client, server, and shared code:

- **client/**: React 19 frontend with Vite
- **server/**: Express backend with Drizzle ORM
- **shared/**: Database schema and Zod validators shared between client/server

### Key Architectural Patterns

#### 1. Database Schema Layer (shared/schema.ts)

The single source of truth for data models. Uses Drizzle ORM with dual database support:
- **Conditional schema**: SQLite or PostgreSQL tables based on `DB_MODE` env var
- **Zod schemas**: Auto-generated from Drizzle schemas via `createInsertSchema()`
- **Type inference**: All TypeScript types exported from schema definitions

Key tables:
- `users` - User accounts (Stack Auth integration)
- `exercises` - Exercise catalog with metric types (count, weight, duration, distance)
- `workoutSessions` - Individual workout sessions (nullable `endedAt` for active sessions)
- `workoutSets` - Sets within sessions (linked to exercises)
- `challenges` - Fitness challenges with status tracking
- `challengeParticipants` / `challengeEntries` - Challenge participation

#### 2. Storage Abstraction Layer (server/storage.ts)

The `IStorage` interface defines all database operations. Current implementation is in-memory for development, but the interface is designed for PostgreSQL/SQLite implementations.

**Key ownership patterns:**
- Methods like `getSessionWithOwnership()` verify userId before returning data
- `getSetWithOwnership()` joins through session to verify user owns the workout
- Always check ownership before mutations (update/delete)

#### 3. API Routes (server/routes.ts)

RESTful API with Zod validation:
- **Validation pattern**: `schema.safeParse(req.body)` → return 400 on failure
- **Ownership checks**: Pass `userId` as query param for session/set endpoints
- **Error handling**: Catch storage layer errors and return appropriate status codes

Ownership verification example:
```typescript
const session = await storage.getSessionWithOwnership(sessionId, userId);
if (!session) return res.status(404).json({ error: "Session not found or access denied" });
```

#### 4. Authentication (server/auth.ts)

Uses Stack Auth for authentication:
- Extracts access token from cookies (`stack-access-token`)
- Validates with Stack Auth API using server secret key
- Attaches user object to `req.user` for protected routes
- `authenticateUser` middleware protects endpoints that require auth

#### 5. Client State Management

**React Query (TanStack Query)** for server state:
- Configured in `client/src/lib/queryClient.ts`
- Custom `getQueryFn` handles 401s and query key URL construction
- Stale time set to Infinity (explicit refetching only)
- No automatic refetch on window focus

**Query pattern:**
```typescript
useQuery({ queryKey: ["/api", "workouts", "sessions", sessionId] })
// Automatically fetches: /api/workouts/sessions/:sessionId
```

### Important Implementation Details

#### Active Session Management

Active sessions are tracked via `endedAt IS NULL`:
- Only one active session per user allowed
- `GET /api/workouts/active-session?userId=X` - Get current active session
- `PATCH /api/workouts/sessions/:id` with `action: "end"` - End session
- Active session UI shows real-time timer and exercise management

#### Exercise Metric Types

Exercises have a `metricType` field that determines tracking:
- `count` - Reps only (pushups, pullups)
- `weight` - Weight + reps (bench press, squats)
- `duration` - Time in seconds (plank, running)
- `distance` - Distance in meters (running, cycling)

Sets store all metric fields, but only relevant ones are used based on exercise type.

#### Database Mode Switching

The app supports both SQLite (development) and PostgreSQL (production):
- Set `DB_MODE=sqlite-file` or `DB_MODE=neon` in environment
- Schema tables are conditionally defined based on mode
- Timestamps use `integer` mode for SQLite, `timestamp` for PostgreSQL
- UUIDs: `gen_random_uuid()` (Postgres) vs `nanoid()` (SQLite)

#### Validation Philosophy

All mutations use Zod schemas for validation:
1. Parse request body with `schema.safeParse()`
2. Return 400 with validation errors if invalid
3. Use validated data (never raw `req.body`) for storage operations
4. Schemas are auto-generated from Drizzle schemas for consistency

#### Cross-Tab Communication Strategy

Per WORKOUT_ENHANCEMENT_PLAN.md, active workouts should be visible across tabs:
- Use React Context at App level for active session state
- Consider localStorage events for cross-tab synchronization
- Banner component shows active workout on all pages

## Design Guidelines

Reference `design_guidelines.md` for UI/UX standards:
- **Color palette**: Deep blue primary (220 85% 25% light, 220 75% 15% dark)
- **Typography**: Inter for UI, JetBrains Mono for numeric data
- **Spacing**: Consistent Tailwind units (p-2, p-4, p-6, p-8)
- **Mobile-first**: Large touch targets (44px min), thumb-friendly navigation
- **Minimal animations**: Subtle micro-interactions only, avoid distracting effects

## Common Development Patterns

### Adding a New API Endpoint

1. Define Zod schema in `shared/schema.ts` (or use existing)
2. Add method to `IStorage` interface in `server/storage.ts`
3. Implement storage method in concrete storage class
4. Add route in `server/routes.ts` with validation
5. Create React Query hook in client if needed

### Adding a New Database Table

1. Define table in `shared/schema.ts` with both SQLite and PostgreSQL variants
2. Create insert/update schemas with `createInsertSchema()`
3. Export TypeScript types with `$inferSelect` / `z.infer<>`
4. Run `npm run db:push` to update database
5. Add storage methods and routes as needed

### Working with Workout Sessions

Always verify ownership before mutations:
```typescript
// In route handler
const { userId } = req.query;
const session = await storage.getSessionWithOwnership(sessionId, userId);
if (!session) return res.status(404).json({ error: "Session not found or access denied" });
```

Check for active sessions before creating new ones:
```typescript
const activeSession = await storage.getActiveSession(userId);
if (activeSession) {
  // Handle: suggest ending current session first
}
```

## Testing Approach

Currently no formal test suite. When testing:
- Use `npm run check` to verify TypeScript types
- Test API endpoints manually or with tools like curl/Postman
- Verify database operations via `npm run db:push` and manual queries
- Test both SQLite and Neon modes for compatibility

## Environment Configuration

Required `.env` variables:
```env
# Stack Auth (authentication)
NEXT_PUBLIC_STACK_PROJECT_ID=<your-project-id>
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=<your-client-key>
STACK_SECRET_SERVER_KEY=<your-secret-key>

# Database (Neon PostgreSQL)
DATABASE_URL=<your-neon-connection-string>

# Optional
DB_MODE=neon  # or 'sqlite-file' for local development
PORT=5000     # Server port (default: 5000)
```

## Future Enhancement Context

See `WORKOUT_ENHANCEMENT_PLAN.md` for ongoing development:
- Phase 1: Backend CRUD API extensions (in progress)
- Phase 2: Global active session context
- Phase 3: Prominent active session UI at top of Workouts page
- Phase 4: Cross-tab active workout indicators
- Phase 5: Recent sessions CRUD with inline exercise management

## Important Notes

- **Always use `--legacy-peer-deps`** when installing packages due to React 19 compatibility
- **Server runs on PORT env var only** (default 5000) - other ports are firewalled
- **Development server** runs both API and Vite dev server on same port
- **Production build** bundles frontend to `dist/public/` and backend to `dist/`
- **Authentication** is required for protected routes - use `authenticateUser` middleware
- **Ownership checks** are critical for security - never skip them in workout/set endpoints
