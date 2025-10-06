import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StackHandler, StackProvider, StackTheme } from '@stackframe/react';
import { Suspense } from 'react';
import { stackClientApp } from './stack';

// Pages
import WorkoutsHome from "@/pages/WorkoutsHome";
import ChallengesHome from "@/pages/ChallengesHome";
import Friends from "@/pages/Friends";
import Progress from "@/pages/Progress";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/not-found";

// Components
import MobileNavigation from "@/components/MobileNavigation";
import { ActiveWorkoutProvider, useActiveWorkout } from "@/contexts/ActiveWorkoutContext";
import { ActiveWorkoutIndicator } from "@/components/ActiveWorkoutBanner";
import { useLocation } from "wouter";

function HandlerRoutes() {
  const [location] = useLocation();
  return <StackHandler app={stackClientApp} location={location} fullPage />;
}

function Router() {
  return (
    <Switch>
      <Route path="/handler/*" component={HandlerRoutes} />
      <Route path="/" component={WorkoutsHome} />
      <Route path="/progress" component={Progress} />
      <Route path="/challenges" component={ChallengesHome} />
      <Route path="/friends" component={Friends} />
      <Route path="/profile" component={Profile} />
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

function App() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <StackProvider app={stackClientApp}>
            <StackTheme>
              <AppWithAuth />
            </StackTheme>
          </StackProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </Suspense>
  );
}

function AppWithAuth() {
  const user = stackClientApp.useUser();
  
  if (!user) {
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

  return (
    <ActiveWorkoutProvider userId={user.id}>
      <AppContent />
    </ActiveWorkoutProvider>
  );
}

export default App;
