/**
 * Development Authentication Module (Client-Side)
 *
 * This module provides a mock Stack Auth interface for local development
 * when using SQLite mode without Stack Auth credentials.
 *
 * IMPORTANT: This should NEVER be used in production!
 */

interface DevUser {
  id: string;
  displayName: string;
  primaryEmail: string;
}

const DEV_USER: DevUser = {
  id: 'dev-user-1',
  displayName: 'Dev User',
  primaryEmail: 'dev@localhost.dev',
};

/**
 * Mock Stack Auth client for development
 * Mimics the Stack Auth API but returns a hardcoded dev user
 */
export class DevStackClientApp {
  /**
   * Mock useUser hook - always returns the dev user
   */
  useUser() {
    // Always return the dev user immediately (no loading state)
    return DEV_USER;
  }

  /**
   * Mock sign-in redirect - no-op in dev mode
   */
  redirectToSignIn() {
    console.warn('[Dev Auth] Sign-in redirect called in dev mode (no-op)');
  }

  /**
   * Mock sign-out redirect - reloads the page
   */
  redirectToSignOut() {
    console.log('[Dev Auth] Sign-out called - reloading page');
    window.location.reload();
  }
}

export const stackClientApp = new DevStackClientApp();
