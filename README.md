# Sweaty Dudes

A full-stack fitness tracking application built with React, Express, and PostgreSQL. Track workouts, exercises, and participate in fitness challenges with friends.

## Prerequisites

- Node.js 18+ and npm
- **For production**: A Neon PostgreSQL database account and connection string
- **For local development**: No external services required! Just use SQLite mode (see below)

## Quick Start (Local Development with SQLite)

Want to try the app without setting up external services? Use SQLite mode!

```bash
# 1. Clone and install
git clone https://github.com/ben-carson/SweatyDudesWorkingOut
cd SweatyDudesWorkingOut
npm install --legacy-peer-deps

# 2. Set up SQLite database
npm run db:push:sqlite
npm run db:seed

# 3. Run in development mode (no .env file needed!)
npm run dev:sqlite
```

The app will start at `http://localhost:5000` with a dev user automatically logged in.

**Dev Mode Features:**
- ✓ No Stack Auth setup required
- ✓ No Neon database required
- ✓ Automatic dev user login
- ✓ Sample exercises pre-loaded
- ✓ All features functional

## Production Setup (Neon + Stack Auth)

For deployment with authentication and cloud database:

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/ben-carson/SweatyDudesWorkingOut
cd SweatyDudesWorkingOut
```

### 2. Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Stack Auth environment variables
VITE_STACK_PROJECT_ID='<your-stack-project-id>'
VITE_STACK_PUBLISHABLE_CLIENT_KEY='<your-stack-publishable-key>'
STACK_SECRET_SERVER_KEY='<your-stack-secret-key>'

# Database connection string (Neon PostgreSQL)
DATABASE_URL='<your-neon-connection-string>'

# Optional configuration
# DB_MODE='neon'           # Database mode: 'neon' or 'sqlite-file' (default: 'neon')
# PORT=5000                # Server port (default: 5000)
# SQLITE_DB_PATH='./data/app.db'  # SQLite database path (only used if DB_MODE='sqlite-file')
```

**Stack Auth Setup:**
1. Sign up or log in at [Stack Auth](https://stack-auth.com)
2. Create a new project
3. Copy your project credentials:
   - `VITE_STACK_PROJECT_ID` - Your Stack project ID
   - `VITE_STACK_PUBLISHABLE_CLIENT_KEY` - Your publishable client key
   - `STACK_SECRET_SERVER_KEY` - Your secret server key (keep this private!)

**Neon Database Setup:**
1. Sign up or log in at [Neon Console](https://console.neon.tech)
2. Create a new project or select an existing one
3. Copy the connection string from your project dashboard
4. Paste it as the `DATABASE_URL` value in your `.env` file

### 3. Install Dependencies

Due to peer dependency conflicts between React 19 and some packages, use the `--legacy-peer-deps` flag:

```bash
npm install --legacy-peer-deps
```

### 4. Database Setup

Push the database schema to your Neon database:

```bash
npm run db:push
```

This will create all necessary tables including:
- `users` - User accounts and profiles
- `exercises` - Exercise catalog with metrics
- `workout_sessions` - Individual workout sessions
- `workout_sets` - Sets performed during workouts
- `challenges` - Fitness challenges
- `challenge_participants` - Challenge participation tracking
- `challenge_entries` - Challenge progress entries

## Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5000` (or the port specified in the `PORT` environment variable).

The development server runs both the Express backend API and the Vite development server for the React frontend on the same port.

## Building for Production

Build both the frontend and backend:

```bash
npm run build
```

This command:
1. Builds the React frontend with Vite (output: `dist/public`)
2. Bundles the Express backend with esbuild (output: `dist`)

Start the production server:

```bash
npm start
```

## Available Scripts

### Development
- `npm run dev` - Start development server (uses .env config)
- `npm run dev:sqlite` - Start with SQLite (local dev mode, no auth required)
- `npm run dev:neon` - Start with Neon PostgreSQL (requires Stack Auth)
- `npm run check` - Run TypeScript type checking

### Database
- `npm run db:push` - Push schema changes (auto-detects DB_MODE)
- `npm run db:push:sqlite` - Push schema to SQLite
- `npm run db:push:neon` - Push schema to Neon PostgreSQL
- `npm run db:seed` - Seed SQLite database with sample data
- `npm run db:generate` - Generate Drizzle migrations

### Production
- `npm run build` - Build frontend and backend for production
- `npm start` - Run the production server

## Database Modes

The app supports two database modes with automatic authentication handling:

### SQLite Mode (Local Development)

**When to use:** Quick local development, testing, no external dependencies

**Features:**
- File-based SQLite database (`./data/app.db` by default)
- No Stack Auth required - automatic dev user login
- No Neon PostgreSQL required
- Sample data seeding available
- Perfect for offline development

**Setup:**
```bash
npm run db:push:sqlite  # Create database schema
npm run db:seed         # Load sample data
npm run dev:sqlite      # Start app
```

**Authentication:** Automatically logs in as "Dev User" (dev@localhost.dev)

### Neon Mode (Production)

**When to use:** Production deployment, multi-user apps, cloud hosting

**Features:**
- Cloud PostgreSQL via Neon
- Real user authentication via Stack Auth
- Scalable and production-ready
- Full user management and security

**Setup:**
```bash
# Requires .env with Stack Auth and Neon credentials
npm run db:push:neon    # Push schema to Neon
npm run dev:neon        # Start with Neon
```

**Authentication:** Stack Auth handles user login, registration, and sessions

### Mode Detection

The app automatically detects which mode to use:
- **Dev Mode**: SQLite + No Stack Auth env vars → Mock authentication
- **Production Mode**: Neon + Stack Auth env vars → Real authentication

Both modes have full feature parity - all app features work identically!

## Project Structure

```
.
├── client/              # React frontend application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components (routes)
│   │   ├── contexts/    # React context providers
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Utilities and helpers
│   │   └── utils/       # Additional utility functions
│   └── index.html       # HTML entry point
├── server/              # Express backend application
│   ├── index.ts         # Server entry point
│   ├── routes.ts        # API route definitions
│   ├── auth.ts          # Authentication logic
│   ├── db.ts            # Database connection
│   └── vite.ts          # Vite middleware setup
├── shared/              # Shared code between client and server
│   └── schema.ts        # Database schema and Zod validators
├── drizzle.config.ts    # Drizzle ORM configuration
├── vite.config.ts       # Vite configuration
└── tsconfig.json        # TypeScript configuration
```

## Technology Stack

### Frontend
- **React 19** - UI framework
- **Wouter** - Lightweight routing
- **TanStack Query** - Server state management
- **Radix UI** - Accessible component primitives
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Animation library
- **Recharts** - Data visualization

### Backend
- **Express** - Web framework
- **Drizzle ORM** - Type-safe database toolkit
- **Passport** - Authentication middleware
- **Neon Serverless** - PostgreSQL database driver
- **Zod** - Schema validation

### Database
- **PostgreSQL** - Via Neon serverless platform

## Features

- User authentication and profiles
- Workout session tracking with exercises and sets
- Exercise catalog with multiple metric types (count, weight, duration, distance)
- Real-time workout tracking with active session banner
- Progress visualization with charts and statistics
- Fitness challenges with leaderboards
- Social features for connecting with friends
- Responsive design with mobile navigation
- Dark mode support
