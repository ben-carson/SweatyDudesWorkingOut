import { useState } from 'react';
import WorkoutCard from '@/components/WorkoutCard';
import StartWorkoutButton from '@/components/StartWorkoutButton';
import StatsCard from '@/components/StatsCard';
import ThemeToggle from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Bell, Plus } from 'lucide-react';
import ExerciseInput from '@/components/ExerciseInput';

export default function WorkoutFeed() {
  // Todo: remove mock functionality - replace with real API calls
  const [searchQuery, setSearchQuery] = useState('');
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);

  // Mock workouts data for the feed
  const mockWorkouts = [
    {
      id: '1',
      user: {
        name: 'Sarah Johnson',
        username: 'sarahfit',
        avatar: undefined
      },
      title: 'Upper Body Strength',
      exercises: [
        { name: 'Bench Press', sets: 4, reps: 8, weight: 60 },
        { name: 'Pull-ups', sets: 3, reps: 12 },
        { name: 'Overhead Press', sets: 3, reps: 10, weight: 40 },
        { name: 'Rows', sets: 3, reps: 10, weight: 50 }
      ],
      duration: 45,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      likes: 12,
      comments: 3,
      isPR: true,
      isLiked: false
    },
    {
      id: '2',
      user: {
        name: 'Alex Chen',
        username: 'alexfit',
        avatar: undefined
      },
      title: 'Leg Day Beast Mode',
      exercises: [
        { name: 'Squats', sets: 5, reps: 5, weight: 100 },
        { name: 'Romanian Deadlifts', sets: 4, reps: 8, weight: 80 },
        { name: 'Leg Press', sets: 3, reps: 15, weight: 120 }
      ],
      duration: 60,
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      likes: 8,
      comments: 2,
      isPR: false,
      isLiked: true
    },
    {
      id: '3',
      user: {
        name: 'Maria Rodriguez',
        username: 'maria_strong',
        avatar: undefined
      },
      title: 'Morning Cardio + Core',
      exercises: [
        { name: 'Treadmill Run', sets: 1, reps: 30, weight: undefined },
        { name: 'Planks', sets: 4, reps: 60, weight: undefined },
        { name: 'Russian Twists', sets: 3, reps: 50, weight: 10 }
      ],
      duration: 35,
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      likes: 15,
      comments: 5,
      isPR: false,
      isLiked: false
    }
  ];

  const filteredWorkouts = mockWorkouts.filter(workout => 
    workout.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    workout.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    workout.exercises.some(ex => ex.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border px-4 py-3 z-40">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">FitTracker</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="hover-elevate"
              data-testid="button-notifications"
            >
              <Bell className="w-5 h-5" />
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search workouts, exercises, or friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>

        {/* Start Workout CTA */}
        <div className="mb-6">
          <Dialog open={isWorkoutModalOpen} onOpenChange={setIsWorkoutModalOpen}>
            <DialogTrigger asChild>
              <StartWorkoutButton className="w-full" />
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Start New Workout
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <ExerciseInput 
                  exerciseName="" 
                />
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => console.log('Add another exercise')}
                  data-testid="button-add-exercise"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Exercise
                </Button>
                <Button 
                  className="w-full bg-chart-1 hover:bg-chart-1/90 text-white"
                  onClick={() => {
                    setIsWorkoutModalOpen(false);
                    console.log('Workout started');
                  }}
                  data-testid="button-start-tracking"
                >
                  Start Tracking
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Workout Feed */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            Recent Workouts
            <span className="text-sm font-normal text-muted-foreground">({filteredWorkouts.length})</span>
          </h2>
          
          {filteredWorkouts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'No workouts match your search.' : 'No workouts yet. Be the first to share!'}
              </p>
              <StartWorkoutButton onClick={() => setIsWorkoutModalOpen(true)} />
            </div>
          ) : (
            filteredWorkouts.map((workout) => (
              <WorkoutCard key={workout.id} {...workout} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}