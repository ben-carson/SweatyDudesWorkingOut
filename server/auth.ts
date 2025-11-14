import type { Request, Response, NextFunction } from "express";
import { authenticateDevUser, isDevAuthMode } from "./auth-dev";

interface StackAuthUser {
  id: string;
  displayName?: string;
  primaryEmail?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: StackAuthUser;
    }
  }
}

/**
 * Main authentication middleware
 * Routes to either dev auth or Stack Auth based on environment
 */
export async function authenticateUser(req: Request, res: Response, next: NextFunction) {
  // Check if we're in dev auth mode (SQLite mode)
  if (isDevAuthMode()) {
    console.log('[Dev Auth] Using development authentication mode');
    return authenticateDevUser(req, res, next);
  }

  // Otherwise use Stack Auth
  return authenticateStackUser(req, res, next);
}

/**
 * Stack Auth authentication middleware
 */
async function authenticateStackUser(req: Request, res: Response, next: NextFunction) {
  try {
    // Verify required environment variables
    const projectId = process.env.VITE_STACK_PROJECT_ID;
    const secretKey = process.env.STACK_SECRET_SERVER_KEY;

    if (!projectId || !secretKey) {
      console.error('Stack Auth configuration missing: VITE_STACK_PROJECT_ID or STACK_SECRET_SERVER_KEY not set');
      return res.status(500).json({ error: "Server configuration error" });
    }

    // Extract Stack Auth token from cookies
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Parse cookies to find the Stack Auth access token
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    const accessToken = cookies['stack-access-token'] || cookies['stack_access_token'];
    
    if (!accessToken) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Verify token with Stack Auth API using server secret key
    const response = await fetch('https://api.stack-auth.com/api/v1/users/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-stack-project-id': projectId,
        'x-stack-secret-server-key': secretKey,
      }
    });

    if (!response.ok) {
      console.error('Stack Auth verification failed:', response.status, await response.text());
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const user = await response.json() as StackAuthUser;
    
    if (!user || !user.id) {
      console.error('Invalid user data from Stack Auth:', user);
      return res.status(401).json({ error: "Invalid user data" });
    }

    // Attach authenticated user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: "Authentication failed" });
  }
}
