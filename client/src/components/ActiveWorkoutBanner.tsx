import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Timer, Dumbbell, Plus, Eye, Square } from 'lucide-react';
import { useActiveWorkout } from '@/contexts/ActiveWorkoutContext';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { formatTimer } from '@/utils/timer';

interface ActiveWorkoutBannerProps {
  className?: string;
  onNavigateToWorkout?: () => void;
}

export function ActiveWorkoutBanner({ className = '', onNavigateToWorkout }: ActiveWorkoutBannerProps) {
  const { activeSession, timer, endWorkout } = useActiveWorkout();
  const { toast } = useToast();
  const [isEnding, setIsEnding] = useState(false);

  if (!activeSession) {
    return null;
  }

  const handleEndWorkout = async () => {
    try {
      setIsEnding(true);
      await endWorkout();
      toast({
        title: "Workout ended",
        description: "Your workout has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to end workout. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsEnding(false);
    }
  };

  return (
    <Card 
      className={`border-l-4 border-l-primary bg-primary/5 dark:bg-primary/10 ${className}`}
      data-testid="banner-active-workout"
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left section: Status and timer */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Timer className="h-4 w-4 text-primary" data-testid="icon-timer" />
                <span className="font-mono text-lg font-semibold text-primary" data-testid="text-timer">
                  {formatTimer(timer)}
                </span>
              </div>
              <Badge variant="default" className="bg-primary/20 text-primary border-primary/30" data-testid="badge-active">
                Active Workout
              </Badge>
            </div>
            
            {/* Session note if available */}
            {activeSession.note && (
              <div className="hidden sm:flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground max-w-xs truncate" data-testid="text-session-note">
                  {activeSession.note}
                </span>
              </div>
            )}
          </div>

          {/* Right section: Action buttons */}
          <div className="flex items-center gap-2">
            {/* Add Exercise button - shows for mobile */}
            <Button
              variant="outline"
              size="sm"
              className="hidden xs:flex"
              onClick={onNavigateToWorkout}
              data-testid="button-add-exercise"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Exercise
            </Button>

            {/* View Workout button */}
            <Button
              variant="outline" 
              size="sm"
              onClick={onNavigateToWorkout}
              data-testid="button-view-workout"
            >
              <Eye className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">View Workout</span>
              <span className="sm:hidden">View</span>
            </Button>

            {/* End Workout button */}
            <Button
              variant="destructive"
              size="sm"
              onClick={handleEndWorkout}
              disabled={isEnding}
              data-testid="button-end-workout"
            >
              <Square className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">
                {isEnding ? 'Ending...' : 'End Workout'}
              </span>
              <span className="sm:hidden">
                {isEnding ? 'Ending' : 'End'}
              </span>
            </Button>
          </div>
        </div>

        {/* Mobile session note */}
        {activeSession.note && (
          <div className="sm:hidden mt-3 flex items-center gap-2">
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground" data-testid="text-session-note-mobile">
              {activeSession.note}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Simplified version for cross-tab indicator (smaller, minimal UI)
export function ActiveWorkoutIndicator() {
  const { activeSession, timer } = useActiveWorkout();

  if (!activeSession) {
    return null;
  }

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground px-4 py-2 text-center text-sm"
      data-testid="indicator-cross-tab"
    >
      <div className="flex items-center justify-center gap-2">
        <Timer className="h-4 w-4" />
        <span className="font-mono">{formatTimer(timer)}</span>
        <span>•</span>
        <span>Active workout in progress</span>
        <Link 
          href="/workouts" 
          className="ml-2 underline hover:no-underline"
          data-testid="link-return-workout"
        >
          Return to workout
        </Link>
      </div>
    </div>
  );
}