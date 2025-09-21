import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Timer, TrendingUp, Trophy, Dumbbell, Calendar, Play } from "lucide-react";
import type { Exercise, WorkoutSession, WorkoutSet, Challenge } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useActiveWorkout } from "@/contexts/ActiveWorkoutContext";
import { ActiveWorkoutBanner } from "@/components/ActiveWorkoutBanner";
import { ActiveSessionExercises } from "@/components/ActiveSessionExercises";

interface TodayStats {
  totalSets: number;
  totalVolume: number;
  workoutTime: number;
}

export default function WorkoutsHome() {
  const { toast } = useToast();
  const [isQuickLogging, setIsQuickLogging] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
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

  // Fetch today's stats (simplified - would normally calculate from today's sets)
  const { data: todayStats = { totalSets: 0, totalVolume: 0, workoutTime: 0 } } = useQuery<TodayStats>({
    queryKey: ["/api/users", currentUserId, "today-stats"],
    queryFn: async () => {
      // This would normally fetch today's sets and calculate stats
      // For now, return mock data based on recent activity
      return {
        totalSets: 12,
        totalVolume: 2450,
        workoutTime: 85
      };
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
      const response = await fetch(`/api/workouts/sessions/${expandedSessionId}/sets`);
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
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                            data-testid={`button-view-session-${session.id}`}
                          >
                            {isExpanded ? 'Hide' : 'View'}
                          </Button>
                        </div>
                        
                        {/* Expanded Session Details */}
                        {isExpanded && (
                          <div className="ml-4 p-3 bg-muted/50 rounded-lg border">
                            <h4 className="text-sm font-medium mb-2">Workout Sets</h4>
                            {sessionSets.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No sets recorded</p>
                            ) : (
                              <div className="space-y-2">
                                {sessionSets.map((set, index) => {
                                  const exercise = exercises.find(ex => ex.id === set.exerciseId);
                                  return (
                                    <div key={set.id} className="flex items-center justify-between py-1 px-2 bg-background rounded border">
                                      <div>
                                        <span className="font-medium text-sm">
                                          {exercise?.name || 'Unknown Exercise'}
                                        </span>
                                        <div className="text-xs text-muted-foreground">
                                          {set.reps && `${set.reps} reps`}
                                          {set.weight && ` • ${set.weight} ${exercise?.unit}`}
                                          {set.durationSec && `${set.durationSec}s`}
                                          {set.distanceMeters && `${set.distanceMeters}m`}
                                          {set.note && ` • "${set.note}"`}
                                        </div>
                                      </div>
                                      <span className="text-xs text-muted-foreground">
                                        Set {index + 1}
                                      </span>
                                    </div>
                                  );
                                })}
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
    </div>
  );
}