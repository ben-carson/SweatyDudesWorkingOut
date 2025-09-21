import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Timer, TrendingUp, Trophy, Dumbbell, Calendar, Play, Edit2, Trash2 } from "lucide-react";
import type { Exercise, WorkoutSession, WorkoutSet, Challenge, TodayStats } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useActiveWorkout } from "@/contexts/ActiveWorkoutContext";
import { ActiveWorkoutBanner } from "@/components/ActiveWorkoutBanner";
import { ActiveSessionExercises } from "@/components/ActiveSessionExercises";
import { SessionEditModal } from "@/components/SessionEditModal";


export default function WorkoutsHome() {
  const { toast } = useToast();
  const [isQuickLogging, setIsQuickLogging] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [editingSession, setEditingSession] = useState<WorkoutSession | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingSession, setDeletingSession] = useState<WorkoutSession | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingSet, setDeletingSet] = useState<WorkoutSet | null>(null);
  const [isDeleteSetDialogOpen, setIsDeleteSetDialogOpen] = useState(false);
  const [editingSet, setEditingSet] = useState<WorkoutSet | null>(null);
  const [isEditSetModalOpen, setIsEditSetModalOpen] = useState(false);
  const [addingSetToSession, setAddingSetToSession] = useState<string | null>(null);
  const [addingSetToExercise, setAddingSetToExercise] = useState<{ sessionId: string, exerciseId: string } | null>(null);
  const [isAddSetModalOpen, setIsAddSetModalOpen] = useState(false);
  const [quickLogValues, setQuickLogValues] = useState({
    reps: "",
    weight: "",
    duration: "",
    distance: "",
    note: ""
  });

  // Mock current user
  const currentUserId = "user1";
  
  // Use active workout context
  const { activeSession, startWorkout } = useActiveWorkout();

  // Fetch exercises for quick log dropdown
  const { data: exercises = [] } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises"],
  });

  // Fetch recent sessions
  const { data: recentSessions = [] } = useQuery<WorkoutSession[]>({
    queryKey: ["/api/workouts/sessions", currentUserId],
    queryFn: async () => {
      const response = await fetch(`/api/workouts/sessions?userId=${currentUserId}&limit=5`);
      if (!response.ok) throw new Error('Failed to fetch sessions');
      return response.json();
    }
  });
  
  // Get current active session
  const currentActiveSession = recentSessions.find(session => !session.endedAt);

  // Fetch today's stats
  const { data: todayStats = { totalSets: 0, totalVolume: 0, workoutTime: 0, exerciseCount: 0 } } = useQuery<TodayStats>({
    queryKey: ["/api/users", currentUserId, "today-stats"],
    queryFn: async () => {
      const response = await fetch(`/api/users/${currentUserId}/today-stats`);
      if (!response.ok) throw new Error('Failed to fetch today stats');
      return response.json();
    }
  });

  // Fetch active challenges for small card
  const { data: activeChallenges = [] } = useQuery<Challenge[]>({
    queryKey: ["/api/challenges", "active"],
    queryFn: async () => {
      const response = await fetch(`/api/challenges?status=active&userId=${currentUserId}`);
      if (!response.ok) throw new Error('Failed to fetch challenges');
      return response.json();
    }
  });

  // Fetch sets for expanded session
  const { data: expandedSessionSets = [] } = useQuery<WorkoutSet[]>({
    queryKey: ["/api/workouts/sessions", expandedSessionId, "sets"],
    queryFn: async () => {
      if (!expandedSessionId) return [];
      const response = await fetch(`/api/workouts/sessions/${expandedSessionId}/sets?userId=${currentUserId}`);
      if (!response.ok) throw new Error('Failed to fetch session sets');
      return response.json();
    },
    enabled: !!expandedSessionId
  });

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/workouts/sessions", {
        userId: currentUserId,
        note: "New workout session"
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workouts/sessions", currentUserId] });
      toast({ description: "New workout session started!" });
    }
  });

  // End session mutation
  const endSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await apiRequest("PATCH", `/api/workouts/sessions/${sessionId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workouts/sessions", currentUserId] });
      toast({ description: "Workout session completed!" });
    }
  });

  // Quick log mutation
  const quickLogMutation = useMutation({
    mutationFn: async (data: { exerciseId: string; sessionId: string; values: any }) => {
      const response = await apiRequest("POST", `/api/workouts/sessions/${data.sessionId}/sets`, data.values);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workouts/sessions", currentUserId] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", currentUserId, "today-stats"] });
      setQuickLogValues({ reps: "", weight: "", duration: "", distance: "", note: "" });
      setSelectedExercise("");
      setIsQuickLogging(false);
      toast({ description: "Set logged successfully!" });
    }
  });

  const selectedExerciseData = exercises.find(ex => ex.id === selectedExercise);

  const handleQuickLog = async () => {
    if (!selectedExercise) {
      toast({ description: "Please select an exercise", variant: "destructive" });
      return;
    }

    // Use current active session or create new one
    let sessionId = currentActiveSession?.id;

    if (!sessionId) {
      const newSession = await createSessionMutation.mutateAsync();
      sessionId = newSession.id;
    }

    // Prepare set data based on exercise type
    const setData: any = {
      exerciseId: selectedExercise,
      note: quickLogValues.note || null
    };

    if (selectedExerciseData?.metricType === 'count' && quickLogValues.reps) {
      setData.reps = parseInt(quickLogValues.reps);
    }
    if (selectedExerciseData?.metricType === 'weight' && quickLogValues.weight) {
      setData.weight = parseFloat(quickLogValues.weight);
      if (quickLogValues.reps) setData.reps = parseInt(quickLogValues.reps);
    }
    if (selectedExerciseData?.metricType === 'duration' && quickLogValues.duration) {
      setData.durationSec = parseInt(quickLogValues.duration);
    }
    if (selectedExerciseData?.metricType === 'distance' && quickLogValues.distance) {
      setData.distanceMeters = parseFloat(quickLogValues.distance);
    }

    if (sessionId) {
      quickLogMutation.mutate({ exerciseId: selectedExercise, sessionId, values: setData });
    }
  };

  const handleEditSession = (session: WorkoutSession) => {
    setEditingSession(session);
    setIsEditModalOpen(true);
  };

  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    setEditingSession(null);
  };

  const handleDeleteSession = (session: WorkoutSession) => {
    setDeletingSession(session);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingSession) return;
    
    try {
      const response = await apiRequest("DELETE", `/api/workouts/sessions/${deletingSession.id}?userId=${currentUserId}`);
      if (response.ok) {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ["/api/workouts/sessions", currentUserId] });
        queryClient.invalidateQueries({ queryKey: ["/api/users", currentUserId, "today-stats"] });
        // Also invalidate expanded session sets if it was expanded
        if (expandedSessionId === deletingSession.id) {
          queryClient.invalidateQueries({ queryKey: ["/api/workouts/sessions", deletingSession.id, "sets"] });
        }
        
        toast({ description: "Session deleted successfully!" });
      } else {
        throw new Error("Failed to delete session");
      }
    } catch (error: any) {
      toast({ 
        description: error?.message || "Failed to delete session",
        variant: "destructive" 
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingSession(null);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setDeletingSession(null);
  };

  // Enhanced Exercise Management Handlers
  const handleAddSetToSession = (session: WorkoutSession) => {
    setAddingSetToSession(session.id);
    setAddingSetToExercise(null);
    setIsAddSetModalOpen(true);
  };

  const handleAddSetToExercise = (sessionId: string, exerciseId: string) => {
    setAddingSetToSession(sessionId);
    setAddingSetToExercise({ sessionId, exerciseId });
    setIsAddSetModalOpen(true);
  };

  const handleEditSet = (set: WorkoutSet) => {
    setEditingSet(set);
    setIsEditSetModalOpen(true);
  };

  const handleDeleteSet = (set: WorkoutSet) => {
    setDeletingSet(set);
    setIsDeleteSetDialogOpen(true);
  };

  const handleDeleteSetConfirm = async () => {
    if (!deletingSet) return;

    try {
      const response = await apiRequest("DELETE", `/api/workouts/sets/${deletingSet.id}?userId=${currentUserId}`);
      if (response.ok) {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ["/api/workouts/sessions", deletingSet.sessionId, "sets"] });
        queryClient.invalidateQueries({ queryKey: ["/api/users", currentUserId, "today-stats"] });
        
        toast({ description: "Set deleted successfully!" });
      } else {
        throw new Error("Failed to delete set");
      }
    } catch (error: any) {
      toast({ 
        description: error?.message || "Failed to delete set",
        variant: "destructive" 
      });
    } finally {
      setIsDeleteSetDialogOpen(false);
      setDeletingSet(null);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString();
  };

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col gap-6 p-4 max-w-4xl mx-auto">
      {/* Active Workout Banner - shown when there's an active session */}
      <ActiveWorkoutBanner />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="text-page-title">
            SweatyDudes Workouts
          </h1>
          <p className="text-muted-foreground">
            {activeSession 
              ? `Active workout started ${formatTime(activeSession.startedAt)}`
              : "Track your personal fitness journey"
            }
          </p>
        </div>
        <div className="flex gap-2">
          {!activeSession && (
            <Button 
              onClick={() => startWorkout("New workout session")}
              data-testid="button-start-workout"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Workout
            </Button>
          )}
        </div>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sets</CardTitle>
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-today-sets">{todayStats.totalSets}</div>
            <p className="text-xs text-muted-foreground">sets completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-today-volume">{todayStats.totalVolume.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">total reps/weight</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workout Time</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-today-time">{todayStats.workoutTime}m</div>
            <p className="text-xs text-muted-foreground">minutes active</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Session Exercises - shown when there's an active session */}
      {activeSession && (
        <ActiveSessionExercises />
      )}

      {/* Quick Log Section - shown when no active session */}
      {!activeSession && (
        <Card>
        <CardHeader>
          <CardTitle>Quick Log</CardTitle>
          <CardDescription>
            {currentActiveSession 
              ? `Adding sets to your active workout (started ${formatTime(currentActiveSession.startedAt)})`
              : "Log a set quickly - this will create a new workout session"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isQuickLogging ? (
            <Button 
              onClick={() => setIsQuickLogging(true)}
              variant="outline"
              className="w-full"
              data-testid="button-quick-log"
            >
              <Plus className="w-4 h-4 mr-2" />
              Log a Set
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="exercise">Exercise</Label>
                  <Select value={selectedExercise} onValueChange={setSelectedExercise}>
                    <SelectTrigger data-testid="select-exercise">
                      <SelectValue placeholder="Select exercise" />
                    </SelectTrigger>
                    <SelectContent>
                      {exercises.map(exercise => (
                        <SelectItem key={exercise.id} value={exercise.id}>
                          {exercise.name} ({exercise.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedExerciseData && (
                  <>
                    {selectedExerciseData.metricType === 'count' && (
                      <div className="space-y-2">
                        <Label htmlFor="reps">Reps</Label>
                        <Input
                          id="reps"
                          type="number"
                          value={quickLogValues.reps}
                          onChange={(e) => setQuickLogValues(prev => ({ ...prev, reps: e.target.value }))}
                          placeholder="Number of reps"
                          data-testid="input-reps"
                        />
                      </div>
                    )}

                    {selectedExerciseData.metricType === 'weight' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="weight">Weight ({selectedExerciseData.unit})</Label>
                          <Input
                            id="weight"
                            type="number"
                            step="0.1"
                            value={quickLogValues.weight}
                            onChange={(e) => setQuickLogValues(prev => ({ ...prev, weight: e.target.value }))}
                            placeholder="Weight"
                            data-testid="input-weight"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="reps">Reps</Label>
                          <Input
                            id="reps"
                            type="number"
                            value={quickLogValues.reps}
                            onChange={(e) => setQuickLogValues(prev => ({ ...prev, reps: e.target.value }))}
                            placeholder="Number of reps"
                            data-testid="input-reps"
                          />
                        </div>
                      </>
                    )}

                    {selectedExerciseData.metricType === 'duration' && (
                      <div className="space-y-2">
                        <Label htmlFor="duration">Duration (seconds)</Label>
                        <Input
                          id="duration"
                          type="number"
                          value={quickLogValues.duration}
                          onChange={(e) => setQuickLogValues(prev => ({ ...prev, duration: e.target.value }))}
                          placeholder="Duration in seconds"
                          data-testid="input-duration"
                        />
                      </div>
                    )}

                    {selectedExerciseData.metricType === 'distance' && (
                      <div className="space-y-2">
                        <Label htmlFor="distance">Distance ({selectedExerciseData.unit})</Label>
                        <Input
                          id="distance"
                          type="number"
                          step="0.1"
                          value={quickLogValues.distance}
                          onChange={(e) => setQuickLogValues(prev => ({ ...prev, distance: e.target.value }))}
                          placeholder="Distance"
                          data-testid="input-distance"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Note (optional)</Label>
                <Input
                  id="note"
                  value={quickLogValues.note}
                  onChange={(e) => setQuickLogValues(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="How did it feel?"
                  data-testid="input-note"
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleQuickLog}
                  disabled={quickLogMutation.isPending || !selectedExercise}
                  data-testid="button-save-set"
                >
                  Save Set
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setIsQuickLogging(false);
                    setSelectedExercise("");
                    setQuickLogValues({ reps: "", weight: "", duration: "", distance: "", note: "" });
                  }}
                  data-testid="button-cancel-log"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        </Card>
      )}

      {/* Recent Sessions & Active Challenges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sessions */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Sessions</CardTitle>
              <CardDescription>Your latest workout sessions</CardDescription>
            </CardHeader>
            <CardContent>
              {recentSessions.length === 0 ? (
                <p className="text-muted-foreground text-center py-4" data-testid="text-no-sessions">
                  No sessions yet. Start your first workout!
                </p>
              ) : (
                <div className="space-y-3">
                  {recentSessions.map((session) => {
                    const isExpanded = expandedSessionId === session.id;
                    const sessionSets = isExpanded ? expandedSessionSets : [];
                    
                    return (
                      <div key={session.id} className="space-y-2">
                        <div 
                          className={`flex items-center justify-between p-3 border rounded-lg ${
                            !session.endedAt ? 'border-primary bg-primary/5' : ''
                          }`}
                          data-testid={`session-${session.id}`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{formatDate(session.startedAt)}</span>
                              <span className="text-sm text-muted-foreground">
                                {formatTime(session.startedAt)}
                              </span>
                              {!session.endedAt && (
                                <Badge variant="secondary">Active</Badge>
                              )}
                            </div>
                            {session.note && (
                              <p className="text-sm text-muted-foreground mt-1">{session.note}</p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                              data-testid={`button-view-session-${session.id}`}
                            >
                              {isExpanded ? 'Hide' : 'View'}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditSession(session)}
                              data-testid={`button-edit-session-${session.id}`}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteSession(session)}
                              data-testid={`button-delete-session-${session.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Enhanced Expanded Session Details */}
                        {isExpanded && (
                          <div className="ml-4 p-4 bg-muted/50 rounded-lg border">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-medium">Workout Details</h4>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddSetToSession(session)}
                                data-testid={`button-add-set-${session.id}`}
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Add Set
                              </Button>
                            </div>
                            
                            {sessionSets.length === 0 ? (
                              <p className="text-sm text-muted-foreground py-2">No sets recorded</p>
                            ) : (
                              <div className="space-y-4">
                                {/* Group sets by exercise */}
                                {(() => {
                                  const setsByExercise = sessionSets.reduce((groups, set) => {
                                    const exerciseId = set.exerciseId;
                                    if (!groups[exerciseId]) {
                                      groups[exerciseId] = [];
                                    }
                                    groups[exerciseId].push(set);
                                    return groups;
                                  }, {} as Record<string, typeof sessionSets>);

                                  return Object.entries(setsByExercise).map(([exerciseId, exerciseSets]) => {
                                    const exercise = exercises.find(ex => ex.id === exerciseId);
                                    const exerciseName = exercise?.name || 'Unknown Exercise';
                                    
                                    // Calculate exercise summary
                                    const totalSets = exerciseSets.length;
                                    const totalReps = exerciseSets.reduce((sum, set) => sum + (set.reps || 0), 0);
                                    const maxWeight = exerciseSets.reduce((max, set) => Math.max(max, set.weight || 0), 0);
                                    const totalDuration = exerciseSets.reduce((sum, set) => sum + (set.durationSec || 0), 0);
                                    const totalDistance = exerciseSets.reduce((sum, set) => sum + (set.distanceMeters || 0), 0);

                                    return (
                                      <div key={exerciseId} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <h5 className="font-medium text-sm">{exerciseName}</h5>
                                            <div className="text-xs text-muted-foreground">
                                              {totalSets} set{totalSets !== 1 ? 's' : ''}
                                              {totalReps > 0 && ` • ${totalReps} total reps`}
                                              {maxWeight > 0 && ` • max ${maxWeight} ${exercise?.unit}`}
                                              {totalDuration > 0 && ` • ${totalDuration}s total`}
                                              {totalDistance > 0 && ` • ${totalDistance}m total`}
                                            </div>
                                          </div>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleAddSetToExercise(session.id, exerciseId)}
                                            data-testid={`button-add-set-exercise-${exerciseId}`}
                                          >
                                            <Plus className="w-3 h-3" />
                                          </Button>
                                        </div>
                                        
                                        <div className="pl-3 space-y-1">
                                          {exerciseSets.map((set, setIndex) => (
                                            <div key={set.id} className="flex items-center justify-between py-2 px-3 bg-background rounded border-l-2 border-l-primary/20">
                                              <div className="flex-1">
                                                <div className="text-sm">
                                                  <span className="font-medium">Set {setIndex + 1}</span>
                                                  <span className="text-muted-foreground ml-2">
                                                    {set.reps && `${set.reps} reps`}
                                                    {set.weight && ` @ ${set.weight} ${exercise?.unit}`}
                                                    {set.durationSec && `${set.durationSec}s`}
                                                    {set.distanceMeters && `${set.distanceMeters}m`}
                                                  </span>
                                                </div>
                                                {set.note && (
                                                  <div className="text-xs text-muted-foreground mt-1">
                                                    "{set.note}"
                                                  </div>
                                                )}
                                              </div>
                                              <div className="flex gap-1">
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => handleEditSet(set)}
                                                  data-testid={`button-edit-set-${set.id}`}
                                                >
                                                  <Edit2 className="w-3 h-3" />
                                                </Button>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => handleDeleteSet(set)}
                                                  data-testid={`button-delete-set-${set.id}`}
                                                >
                                                  <Trash2 className="w-3 h-3 text-destructive" />
                                                </Button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  });
                                })()}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Active Challenges Card */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Active Challenges
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeChallenges.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground text-sm mb-3">
                    No active challenges
                  </p>
                  <Link href="/challenges">
                    <Button variant="outline" size="sm" data-testid="button-view-challenges">
                      Browse Challenges
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeChallenges.slice(0, 2).map((challenge) => (
                    <div key={challenge.id} className="p-3 border rounded-lg">
                      <h4 className="font-medium text-sm">{challenge.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {challenge.activity} • {challenge.unit}
                      </p>
                    </div>
                  ))}
                  <Link href="/challenges">
                    <Button variant="outline" size="sm" className="w-full" data-testid="button-view-all-challenges">
                      View All
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Session Edit Modal */}
      <SessionEditModal
        session={editingSession}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSuccess={handleEditModalClose}
      />

      {/* Session Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-session">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workout Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this workout session from {deletingSession && formatDate(deletingSession.startedAt)}?
              <br /><br />
              <strong>This action cannot be undone.</strong> All sets and exercises in this session will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={handleDeleteCancel}
              data-testid="button-cancel-delete"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Set Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteSetDialogOpen} onOpenChange={setIsDeleteSetDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-set">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Set</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this set?
              <br /><br />
              <strong>This action cannot be undone.</strong> The set will be permanently removed from your workout session.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setIsDeleteSetDialogOpen(false);
                setDeletingSet(null);
              }}
              data-testid="button-cancel-delete-set"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteSetConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-set"
            >
              Delete Set
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}