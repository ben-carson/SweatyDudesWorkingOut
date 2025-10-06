# Replit.md

## Overview

This is a fitness social application called "SweatyDudes" that combines workout tracking with social features and friendly fitness challenges. The app allows users to create challenges like push-ups, squats, or other exercises, track their progress, compete with friends, and share their workout activities in a social feed. The platform emphasizes building fitness communities through gamification and social interaction.

## Recent Changes (October 2025)

### Profile Editing Features
- Added comprehensive profile editing functionality with firstName, lastName, email, and username fields
- Username serves as the primary user identifier throughout the app (displayed as @username)
- Created Settings & Privacy page (`/settings`) for managing profile information
- Updated Profile page to display database-stored user information instead of Stack Auth display name
- Removed bio field from user profiles as requested

### Security Implementation
- Implemented secure authentication middleware for profile update endpoints
- Middleware verifies Stack Auth tokens from cookies using Stack Auth REST API
- Uses server-side STACK_SECRET_SERVER_KEY for secure token verification
- Ensures users can only update their own profiles (prevents unauthorized access)
- Proper error handling with 401 (unauthorized), 403 (forbidden), and 500 (server error) responses
- Detailed logging for authentication failures and configuration issues

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application uses a modern React-based frontend built with TypeScript, featuring:
- **React 18** with hooks for state management
- **Wouter** for client-side routing instead of React Router
- **Tailwind CSS** with extensive customization for styling
- **shadcn/ui** component library for consistent UI elements
- **TanStack React Query** for server state management and caching
- **Vite** as the build tool for fast development and optimized production builds

The frontend follows a mobile-first design approach with responsive layouts and includes specialized components for fitness tracking like exercise inputs, progress charts, workout cards, and social interaction elements.

### Backend Architecture
The backend is built with:
- **Express.js** as the web framework
- **TypeScript** for type safety across the entire stack
- **RESTful API design** with endpoints for challenges, participants, and entries
- **In-memory storage** currently implemented as a temporary solution with plans for database integration
- **Session-based approach** for user management

The API structure supports CRUD operations for challenges, user management, leaderboards, and social features like workout sharing.

### Component Architecture
The application uses a well-structured component system:
- **Atomic design principles** with reusable UI components
- **Feature-based organization** with dedicated components for workouts, challenges, friends, and progress tracking
- **Mobile navigation** with bottom tab bar for primary navigation
- **Theme system** supporting light/dark mode with CSS variables

### Data Layer
- **Drizzle ORM** configured for PostgreSQL integration
- **Zod schemas** for runtime type validation and API request/response validation
- **Shared schema definitions** between frontend and backend for type consistency
- **Query client** with optimistic updates and intelligent caching strategies

### Design System
The application implements a comprehensive design system with:
- **Custom color palette** focused on fitness app aesthetics (blues, greens, oranges)
- **Typography hierarchy** using Inter for general text and JetBrains Mono for data display
- **Consistent spacing system** using Tailwind's standardized units
- **Elevation and shadow system** for depth and interactivity feedback

## External Dependencies

### Database and Storage
- **Neon Database** (PostgreSQL) for production data storage
- **Drizzle Kit** for database migrations and schema management

### UI and Design
- **Radix UI** primitives for accessible, unstyled components
- **Lucide React** for consistent iconography
- **Tailwind CSS** for utility-first styling
- **Recharts** for data visualization and progress tracking charts

### Development and Build Tools
- **Vite** for development server and build optimization
- **TypeScript** compiler for type checking
- **ESBuild** for server-side code bundling
- **PostCSS** with Autoprefixer for CSS processing

### State Management and Data Fetching
- **TanStack React Query** for server state management
- **React Hook Form** with Hookform Resolvers for form management
- **Date-fns** for date manipulation and formatting

### Authentication and Sessions
- **Stack Auth** for user authentication and identity management
- **Custom authentication middleware** (`server/auth.ts`) for protecting sensitive API endpoints
- Token verification via Stack Auth REST API using server secret key
- Cookie-based session management with HTTP-only cookies
- **Express Session** with connect-pg-simple for session storage

### Utilities and Helpers
- **clsx** and **class-variance-authority** for conditional class names
- **cmdk** for command palette functionality
- **nanoid** for generating unique identifiers
- **zod** for runtime type validation

The application is designed to be deployed on cloud platforms with PostgreSQL database support and includes configuration for both development and production environments.