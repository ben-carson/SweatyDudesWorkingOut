# Tech Stack & Build System

## Architecture
Full-stack TypeScript application with React frontend and Express backend, using PostgreSQL database.

## Frontend Stack
- **Framework**: React 19 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query for server state, React Context for local state
- **UI Library**: Radix UI primitives with custom Tailwind CSS styling
- **Styling**: Tailwind CSS with custom design system
- **Auth**: Stack Auth for authentication and user management
- **Build Tool**: Vite with React plugin

## Backend Stack
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Neon serverless
- **ORM**: Drizzle ORM with Zod validation
- **Session Management**: Express sessions with PostgreSQL store
- **WebSockets**: ws library for real-time features

## Key Libraries
- **Forms**: React Hook Form with Hookform Resolvers
- **Charts**: Recharts for progress visualization
- **Icons**: Lucide React and React Icons
- **Animations**: Framer Motion (minimal usage per design guidelines)
- **Date Handling**: date-fns

## Development Commands
```bash
# Start development server (both frontend and backend)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run check

# Database schema push
npm run db:push
```

## Path Aliases
- `@/*` → `./client/src/*` (frontend components and utilities)
- `@shared/*` → `./shared/*` (shared types and schemas)
- `@assets/*` → `./attached_assets/*` (static assets)

## Environment
- Development: Uses Vite dev server with HMR
- Production: Serves static files from Express
- Database: Neon PostgreSQL (serverless)
- Deployment: Configured for Replit hosting