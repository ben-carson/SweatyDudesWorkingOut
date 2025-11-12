import type { Request, Response, NextFunction } from "express";

/**
 * Development Authentication Module
 *
 * This module provides a simple mock authentication system for local development
 * when using SQLite mode without Stack Auth credentials.
 *
 * IMPORTANT: This should NEVER be used in production!
 */

export interface DevUser {
  id: string;
  displayName: string;
  primaryEmail: string;
}

// Mock development users
const DEV_USERS: DevUser[] = [
  {
    id: 'dev-user-1',
    displayName: 'Dev User',
    primaryEmail: 'dev@localhost.dev',
  },
  {
    id: 'dev-user-2',
    displayName: 'Test User',
    primaryEmail: 'test@localhost.dev',
  },
];

// Default user for dev mode
const DEFAULT_DEV_USER = DEV_USERS[0];

declare global {
  namespace Express {
    interface Request {
      user?: DevUser;
    }
  }
}

/**
 * Development authentication middleware
 * Always authenticates with the default dev user
 */
export async function authenticateDevUser(req: Request, res: Response, next: NextFunction) {
  // In dev mode, we always authenticate as the default dev user
  req.user = DEFAULT_DEV_USER;
  next();
}

/**
 * Check if we're in development auth mode
 */
export function isDevAuthMode(): boolean {
  const dbMode = (process.env.DB_MODE || 'neon').toLowerCase();
  const isSqlite = dbMode === 'sqlite-file' || dbMode === 'sqlite-memory';
  const hasStackAuth = !!(process.env.VITE_STACK_PROJECT_ID && process.env.STACK_SECRET_SERVER_KEY);

  return isSqlite && !hasStackAuth;
}

export { DEFAULT_DEV_USER, DEV_USERS };
