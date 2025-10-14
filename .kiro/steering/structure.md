# Project Structure & Organization

## Root Level
- `client/` - React frontend application
- `server/` - Express backend API
- `shared/` - Shared TypeScript types and schemas
- `attached_assets/` - Static assets and uploads
- `.kiro/` - Kiro IDE configuration and steering rules

## Frontend Structure (`client/`)
```
client/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Radix UI component wrappers
│   │   └── examples/       # Example/template components
│   ├── pages/              # Route-level page components
│   ├── contexts/           # React Context providers
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility libraries and configurations
│   ├── utils/              # Helper functions
│   ├── App.tsx             # Main app component with routing
│   ├── main.tsx            # React app entry point
│   └── index.css           # Global styles and Tailwind imports
├── index.html              # HTML template
```

## Backend Structure (`server/`)
```
server/
├── index.ts                # Express server entry point
├── routes.ts               # API route definitions
├── db.ts                   # Database connection and queries
├── auth.ts                 # Authentication middleware
├── storage.ts              # File storage utilities
└── vite.ts                 # Vite integration for development
```

## Shared Code (`shared/`)
- `schema.ts` - Database schema definitions, Zod validators, and TypeScript types

## Component Organization
- **UI Components**: Located in `client/src/components/ui/` - these are Radix UI wrappers with consistent styling
- **Feature Components**: Located in `client/src/components/` - business logic components like `WorkoutCard`, `ActiveWorkoutBanner`
- **Page Components**: Located in `client/src/pages/` - top-level route components
- **Context Providers**: Located in `client/src/contexts/` - React Context for global state

## Naming Conventions
- **Components**: PascalCase (e.g., `WorkoutCard.tsx`, `ActiveWorkoutBanner.tsx`)
- **Files**: kebab-case for utilities (e.g., `use-mobile.tsx`, `query-client.ts`)
- **Database**: snake_case for tables and columns
- **API Routes**: RESTful conventions (`/api/users`, `/api/workouts`)

## Import Patterns
- Use path aliases: `@/components/ui/button` instead of relative paths
- Shared types: `@shared/schema` for database types
- Group imports: React imports first, then third-party, then local

## State Management
- **Server State**: TanStack Query for API data fetching and caching
- **Global State**: React Context (e.g., `ActiveWorkoutContext`)
- **Local State**: React useState/useReducer within components
- **Form State**: React Hook Form for complex forms