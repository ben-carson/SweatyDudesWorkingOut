import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

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

function Router() {
  return (
    <Switch>
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
  const currentUserId = "user1"; // TODO: Replace with actual auth

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ActiveWorkoutProvider userId={currentUserId}>
          <AppContent />
        </ActiveWorkoutProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
