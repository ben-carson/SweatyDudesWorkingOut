import { StackClientApp } from '@stackframe/react';
import { useLocation } from 'wouter';
import { stackClientApp as devStackClientApp } from './stack-dev';

/**
 * Check if we're in dev auth mode
 * Dev mode activates when Stack Auth credentials are not configured OR
 * when DB_MODE is explicitly sqlite (prioritized in dev scripts)
 */
const isDevMode = !import.meta.env.VITE_STACK_PROJECT_ID || !import.meta.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY;

if (isDevMode) {
  console.log('[Dev Auth] Stack Auth credentials not found - using development authentication');
  console.log('[Dev Auth] Dev user: dev@localhost.dev (ID: dev-user-1)');
}

// Create real Stack Auth client (will only be used if not in dev mode)
const realStackClientApp = isDevMode ? null : new StackClientApp({
  projectId: import.meta.env.VITE_STACK_PROJECT_ID!,
  publishableClientKey: import.meta.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY!,
  tokenStore: 'cookie',
  redirectMethod: {
    useNavigate() {
      const [, setLocation] = useLocation();
      return setLocation;
    },
  },
});

// Export either dev or production Stack Auth client
export const stackClientApp = isDevMode ? devStackClientApp : realStackClientApp!;
