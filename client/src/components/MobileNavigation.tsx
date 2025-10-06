import { Button } from "@/components/ui/button";
import { Dumbbell, Trophy, Users, User, Library } from "lucide-react";
import { useState } from "react";

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
}

interface MobileNavigationProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

const navigationItems: NavigationItem[] = [
  { id: 'workouts', label: 'Workouts', icon: Dumbbell, href: '/' },
  { id: 'exercises', label: 'Exercises', icon: Library, href: '/exercises' },
  { id: 'challenges', label: 'Challenges', icon: Trophy, href: '/challenges' },
  { id: 'friends', label: 'Friends', icon: Users, href: '/friends' },
  { id: 'profile', label: 'Profile', icon: User, href: '/profile' }
];

export default function MobileNavigation({ currentPath = '/', onNavigate }: MobileNavigationProps) {
  const [activePath, setActivePath] = useState(currentPath);

  const handleNavigation = (path: string) => {
    setActivePath(path);
    onNavigate?.(path);
    console.log(`Navigating to ${path}`);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-2 z-50">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePath === item.href;
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              onClick={() => handleNavigation(item.href)}
              className={`flex flex-col items-center gap-1 p-2 h-auto min-h-12 ${
                isActive 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              data-testid={`nav-${item.id}`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'fill-current opacity-20' : ''}`} />
              <span className="text-xs font-medium">{item.label}</span>
              {isActive && (
                <div className="w-1 h-1 bg-primary rounded-full mt-0.5" />
              )}
            </Button>
          );
        })}
      </div>
    </nav>
  );
}