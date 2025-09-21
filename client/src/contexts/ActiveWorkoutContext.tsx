import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import type { WorkoutSession, WorkoutSet } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface ActiveWorkoutContextType {
  activeSession: WorkoutSession | null;
  isLoading: boolean;
  timer: number; // seconds since session started
  startWorkout: (note?: string) => Promise<WorkoutSession>;
  endWorkout: () => Promise<void>;
  refreshActiveSession: () => void;
  addSet: (exerciseId: string, setData: Partial<WorkoutSet>) => Promise<WorkoutSet>;
  updateSet: (setId: string, updates: Partial<WorkoutSet>) => Promise<WorkoutSet>;
  deleteSet: (setId: string) => Promise<void>;
}

const ActiveWorkoutContext = createContext<ActiveWorkoutContextType | undefined>(undefined);

export function useActiveWorkout() {
  const context = useContext(ActiveWorkoutContext);
  if (context === undefined) {
    throw new Error('useActiveWorkout must be used within an ActiveWorkoutProvider');
  }
  return context;
}

interface ActiveWorkoutProviderProps {
  children: ReactNode;
  userId: string;
}

export function ActiveWorkoutProvider({ children, userId }: ActiveWorkoutProviderProps) {
  const [timer, setTimer] = useState(0);

  // Fetch active session
  const { data: activeSession, isLoading, refetch: refreshActiveSession } = useQuery<WorkoutSession | null>({
    queryKey: ['/api/workouts/active-session', userId],
    queryFn: async () => {
      const response = await fetch(`/api/workouts/active-session?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch active session');
      const result = await response.json();
      return result || null;
    },
    refetchInterval: 30000, // Refresh every 30 seconds to detect changes
  });

  // Timer effect - updates every second when session is active
  useEffect(() => {
    if (!activeSession) {
      setTimer(0);
      return;
    }

    const startTime = new Date(activeSession.startedAt).getTime();
    
    const updateTimer = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setTimer(elapsed);
    };

    // Update immediately
    updateTimer();

    // Then update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  // Cross-tab synchronization - listen for active session changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'active-workout-change') {
        refreshActiveSession();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshActiveSession]);

  // Notify other tabs when active session changes
  const notifyTabs = () => {
    localStorage.setItem('active-workout-change', Date.now().toString());
  };

  // Start workout mutation
  const startWorkoutMutation = useMutation({
    mutationFn: async (note?: string): Promise<WorkoutSession> => {
      const response = await fetch('/api/workouts/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, note: note || null })
      });
      if (!response.ok) throw new Error('Failed to start workout');
      return response.json();
    },
    onSuccess: (newSession) => {
      queryClient.setQueryData(['/api/workouts/active-session', userId], newSession);
      notifyTabs();
    },
  });

  // End workout mutation
  const endWorkoutMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      if (!activeSession) throw new Error('No active session');
      
      const response = await fetch(`/api/workouts/sessions/${activeSession.id}?userId=${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end' })
      });
      if (!response.ok) throw new Error('Failed to end workout');
    },
    onSuccess: () => {
      queryClient.setQueryData(['/api/workouts/active-session', userId], null);
      queryClient.invalidateQueries({ queryKey: ['/api/workouts/sessions'] });
      notifyTabs();
    },
  });

  // Add set mutation
  const addSetMutation = useMutation({
    mutationFn: async ({ exerciseId, setData }: { exerciseId: string; setData: Partial<WorkoutSet> }): Promise<WorkoutSet> => {
      if (!activeSession) throw new Error('No active session');
      
      const response = await fetch(`/api/workouts/sessions/${activeSession.id}/sets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          exerciseId,
          ...setData
        })
      });
      if (!response.ok) throw new Error('Failed to add set');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/workouts/sessions'] });
      notifyTabs();
    },
  });

  // Update set mutation
  const updateSetMutation = useMutation({
    mutationFn: async ({ setId, updates }: { setId: string; updates: Partial<WorkoutSet> }): Promise<WorkoutSet> => {
      const response = await fetch(`/api/workouts/sets/${setId}?userId=${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update set');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workouts/sessions'] });
      notifyTabs();
    },
  });

  // Delete set mutation
  const deleteSetMutation = useMutation({
    mutationFn: async (setId: string): Promise<void> => {
      const response = await fetch(`/api/workouts/sets/${setId}?userId=${userId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete set');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workouts/sessions'] });
      notifyTabs();
    },
  });

  const value: ActiveWorkoutContextType = {
    activeSession: activeSession ?? null,
    isLoading,
    timer,
    startWorkout: async (note?: string) => await startWorkoutMutation.mutateAsync(note),
    endWorkout: async () => await endWorkoutMutation.mutateAsync(),
    refreshActiveSession,
    addSet: async (exerciseId: string, setData: Partial<WorkoutSet>) => 
      await addSetMutation.mutateAsync({ exerciseId, setData }),
    updateSet: async (setId: string, updates: Partial<WorkoutSet>) =>
      await updateSetMutation.mutateAsync({ setId, updates }),
    deleteSet: async (setId: string) => await deleteSetMutation.mutateAsync(setId),
  };

  return (
    <ActiveWorkoutContext.Provider value={value}>
      {children}
    </ActiveWorkoutContext.Provider>
  );
}