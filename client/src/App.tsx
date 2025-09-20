import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Pages
import WorkoutFeed from "@/pages/WorkoutFeed";
import Friends from "@/pages/Friends";
import Progress from "@/pages/Progress";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/not-found";

// Components
import MobileNavigation from "@/components/MobileNavigation";
import { useLocation } from "wouter";

function Router() {
  return (
    <Switch>
      <Route path="/" component={WorkoutFeed} />
      <Route path="/friends" component={Friends} />
      <Route path="/progress" component={Progress} />
      <Route path="/profile" component={Profile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location, setLocation] = useLocation();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="relative min-h-screen">
          <Router />
          <MobileNavigation 
            currentPath={location} 
            onNavigate={(path) => setLocation(path)}
          />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
