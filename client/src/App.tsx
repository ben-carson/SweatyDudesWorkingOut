import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StackHandler, StackProvider, StackTheme } from '@stackframe/react';
import { Suspense, useEffect, useState } from 'react';
import { stackClientApp } from './stack';

// Pages
import WorkoutsHome from "@/pages/WorkoutsHome";
import ChallengesHome from "@/pages/ChallengesHome";
import Friends from "@/pages/Friends";
import Progress from "@/pages/Progress";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import Exercises from "@/pages/Exercises";
import NotFound from "@/pages/not-found";

// Components
import MobileNavigation from "@/components/MobileNavigation";
import { ActiveWorkoutProvider, useActiveWorkout } from "@/contexts/ActiveWorkoutContext";
import { ActiveWorkoutIndicator } from "@/components/ActiveWorkoutBanner";
import { useLocation } from "wouter";

function Router() {
  return (
    <Switch>
      <Route path="/" component={WorkoutsHome} />
      <Route path="/progress" component={Progress} />
      <Route path="/challenges" component={ChallengesHome} />
      <Route path="/friends" component={Friends} />
      <Route path="/exercises" component={Exercises} />
      <Route path="/profile" component={Profile} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [location, setLocation] = useLocation();
  const { activeSession } = useActiveWorkout();

  return (
    <>
      {/* Cross-tab active workout indicator - shows on all pages */}
      <ActiveWorkoutIndicator />
      
      <div className={`relative min-h-screen ${activeSession ? 'pt-10' : ''}`}>
        <Router />
        <MobileNavigation 
          currentPath={location} 
          onNavigate={(path) => setLocation(path)}
        />
      </div>
      <Toaster />
    </>
  );
}

function AppWithAuth() {
  const user = stackClientApp.useUser();
  const [isSyncing, setIsSyncing] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Check if we're in dev mode
  const isDevMode = !import.meta.env.VITE_STACK_PROJECT_ID || !import.meta.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY;

  useEffect(() => {
    if (!user) {
      setIsSyncing(false);
      return;
    }

    // User is present, ensure we're in syncing state
    setIsSyncing(true);
    setSyncError(null);

    let mounted = true;
    const maxRetries = 3;

    async function attemptSync(attemptNumber: number): Promise<void> {
      if (!mounted || !user) return;

      try {
        // In dev mode, use simple username from displayName
        // In production mode, generate from email
        let username: string;
        let displayName: string;

        if (isDevMode) {
          // Dev mode: use simple dev username
          username = 'devuser';
          displayName = user.displayName || 'Dev User';
        } else {
          // Production: generate from email
          const email = user.primaryEmail || '';
          const emailPrefix = email.split('@')[0];
          displayName = user.clientMetadata?.displayName ||
                             `${user.clientMetadata?.firstName || ''} ${user.clientMetadata?.lastName || ''}`.trim() ||
                             emailPrefix;
          username = emailPrefix || `user_${user.id.substring(0, 8)}`;
        }

        // Sync user to database (creates if doesn't exist)
        let response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: user.id,
            username,
            name: displayName || username
          })
        });

        // Handle username collision by adding suffix
        if (response.status === 409) {
          const timestamp = Date.now().toString().slice(-6);
          username = `${username}_${timestamp}`;
          response = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: user.id,
              username,
              name: displayName || username
            })
          });
        }

        if (!response.ok) {
          throw new Error(`Failed to sync user: ${response.statusText}`);
        }

        if (mounted) {
          setSyncError(null);
          setIsSyncing(false);
        }
      } catch (error) {
        console.error(`Sync attempt ${attemptNumber} failed:`, error);

        if (attemptNumber < maxRetries) {
          const delay = 1000 * attemptNumber; // Exponential backoff
          console.log(`Retrying in ${delay}ms... (${attemptNumber}/${maxRetries})`);
          setTimeout(() => {
            attemptSync(attemptNumber + 1);
          }, delay);
        } else {
          if (mounted) {
            setSyncError('Failed to set up your account. Please refresh the page to try again.');
            setIsSyncing(false);
          }
        }
      }
    }

    attemptSync(1);

    return () => {
      mounted = false;
    };
  }, [user?.id, isDevMode]);

  if (!user) {
    // In dev mode, this should never happen (always have a user)
    // In production, show sign-in prompt
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Welcome to FitTrack</h1>
          <p className="text-muted-foreground">Please sign in to continue</p>
          <button
            onClick={() => stackClientApp.redirectToSignIn()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            data-testid="button-sign-in"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Setting up your account...</p>
        </div>
      </div>
    );
  }

  if (syncError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <p className="text-destructive">{syncError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            data-testid="button-retry"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <ActiveWorkoutProvider userId={user.id}>
      <AppContent />
    </ActiveWorkoutProvider>
  );
}

function HandlerRoute() {
  const [location] = useLocation();
  return <StackHandler app={stackClientApp} location={location || '/handler/sign-in'} fullPage />;
}

function App() {
  // Check if we're in dev mode
  const isDevMode = !import.meta.env.VITE_STACK_PROJECT_ID || !import.meta.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY;

  // In dev mode, skip StackProvider and StackHandler
  if (isDevMode) {
    return (
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            {/* Dev mode: no Stack Auth provider needed */}
            <AppWithAuth />
          </TooltipProvider>
        </QueryClientProvider>
      </Suspense>
    );
  }

  // Production mode: use full Stack Auth setup
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <StackProvider app={stackClientApp}>
            <StackTheme>
              <Switch>
                {/* Auth handler routes - must be outside auth check */}
                <Route path="/handler/*" component={HandlerRoute} />

                {/* All other routes - protected by auth */}
                <Route path="/*" component={AppWithAuth} />
              </Switch>
            </StackTheme>
          </StackProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </Suspense>
  );
}

export default App;
