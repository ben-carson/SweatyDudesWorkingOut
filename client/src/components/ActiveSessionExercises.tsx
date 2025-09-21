import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Edit2, Trash2, Check, X, Dumbbell, MoreVertical } from 'lucide-react';
import { useActiveWorkout } from '@/contexts/ActiveWorkoutContext';
import { useToast } from '@/hooks/use-toast';
import type { Exercise, WorkoutSet } from '@shared/schema';

interface ExerciseSetData {
  reps?: number | null;
  weight?: number | null;
  durationSec?: number | null;
  distanceMeters?: number | null;
  note?: string | null;
}

interface ActiveSessionExercisesProps {
  className?: string;
}

export function ActiveSessionExercises({ className = '' }: ActiveSessionExercisesProps) {
  const { activeSession, addSet, updateSet, deleteSet } = useActiveWorkout();
  const { toast } = useToast();
  
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [setForm, setSetForm] = useState<ExerciseSetData>({});

  // Fetch exercises for dropdown
  const { data: exercises = [] } = useQuery<Exercise[]>({
    queryKey: ['/api/exercises'],
  });

  // Fetch sets for current session
  const { data: sessionSets = [] } = useQuery<WorkoutSet[]>({
    queryKey: ['/api/workouts/sessions', activeSession?.id, 'sets'],
    queryFn: async () => {
      if (!activeSession) return [];
      const response = await fetch(`/api/workouts/sessions/${activeSession.id}/sets`);
      if (!response.ok) throw new Error('Failed to fetch sets');
      return response.json();
    },
    enabled: !!activeSession,
  });

  // Group sets by exercise
  const exerciseGroups = sessionSets.reduce((groups, set) => {
    if (!groups[set.exerciseId]) {
      groups[set.exerciseId] = [];
    }
    groups[set.exerciseId].push(set);
    return groups;
  }, {} as Record<string, WorkoutSet[]>);

  const handleAddSet = async () => {
    if (!selectedExercise) {
      toast({
        title: "Select exercise",
        description: "Please select an exercise first.",
        variant: "destructive"
      });
      return;
    }

    try {
      await addSet(selectedExercise, setForm);
      setSetForm({});
      setIsAddingExercise(false);
      toast({
        title: "Set added",
        description: "Exercise set added successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add set. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateSet = async (setId: string) => {
    try {
      await updateSet(setId, setForm);
      setEditingSetId(null);
      setSetForm({});
      toast({
        title: "Set updated",
        description: "Exercise set updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update set. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteSet = async (setId: string) => {
    try {
      await deleteSet(setId);
      toast({
        title: "Set deleted",
        description: "Exercise set deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete set. Please try again.",
        variant: "destructive"
      });
    }
  };

  const startEditing = (set: WorkoutSet) => {
    setEditingSetId(set.id);
    setSetForm({
      reps: set.reps,
      weight: set.weight,
      durationSec: set.durationSec,
      distanceMeters: set.distanceMeters,
      note: set.note,
    });
  };

  const cancelEditing = () => {
    setEditingSetId(null);
    setSetForm({});
  };

  const getExerciseName = (exerciseId: string) => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    return exercise?.name || 'Unknown Exercise';
  };

  const getExerciseType = (exerciseId: string) => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    return exercise?.metricType || 'reps';
  };

  if (!activeSession) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No active workout session</p>
          <p className="text-sm text-muted-foreground mt-1">Start a workout to add exercises</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Add Exercise Section */}
      <Card data-testid="card-add-exercise">
        <CardHeader>
          <CardTitle className="text-lg">Add Exercise</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isAddingExercise ? (
            <Button 
              onClick={() => setIsAddingExercise(true)}
              className="w-full"
              data-testid="button-start-add-exercise"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Exercise to Workout
            </Button>
          ) : (
            <div className="space-y-4">
              {/* Exercise Selection */}
              <div>
                <Label htmlFor="exercise-select">Exercise</Label>
                <Select value={selectedExercise} onValueChange={setSelectedExercise}>
                  <SelectTrigger data-testid="select-exercise">
                    <SelectValue placeholder="Select an exercise" />
                  </SelectTrigger>
                  <SelectContent>
                    {exercises.map((exercise) => (
                      <SelectItem key={exercise.id} value={exercise.id}>
                        {exercise.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Set Input Form */}
              {selectedExercise && (
                <div className="grid grid-cols-2 gap-4">
                  {getExerciseType(selectedExercise) === 'reps' && (
                    <>
                      <div>
                        <Label htmlFor="reps">Reps</Label>
                        <Input
                          id="reps"
                          type="number"
                          placeholder="0"
                          value={setForm.reps || ''}
                          onChange={(e) => setSetForm(prev => ({ 
                            ...prev, 
                            reps: e.target.value ? parseInt(e.target.value) : null 
                          }))}
                          data-testid="input-reps"
                        />
                      </div>
                      <div>
                        <Label htmlFor="weight">Weight (lbs)</Label>
                        <Input
                          id="weight"
                          type="number"
                          step="0.5"
                          placeholder="0"
                          value={setForm.weight || ''}
                          onChange={(e) => setSetForm(prev => ({ 
                            ...prev, 
                            weight: e.target.value ? parseFloat(e.target.value) : null 
                          }))}
                          data-testid="input-weight"
                        />
                      </div>
                    </>
                  )}

                  {getExerciseType(selectedExercise) === 'duration' && (
                    <div>
                      <Label htmlFor="duration">Duration (seconds)</Label>
                      <Input
                        id="duration"
                        type="number"
                        placeholder="0"
                        value={setForm.durationSec || ''}
                        onChange={(e) => setSetForm(prev => ({ 
                          ...prev, 
                          durationSec: e.target.value ? parseInt(e.target.value) : null 
                        }))}
                        data-testid="input-duration"
                      />
                    </div>
                  )}

                  {getExerciseType(selectedExercise) === 'distance' && (
                    <div>
                      <Label htmlFor="distance">Distance (meters)</Label>
                      <Input
                        id="distance"
                        type="number"
                        placeholder="0"
                        value={setForm.distanceMeters || ''}
                        onChange={(e) => setSetForm(prev => ({ 
                          ...prev, 
                          distanceMeters: e.target.value ? parseFloat(e.target.value) : null 
                        }))}
                        data-testid="input-distance"
                      />
                    </div>
                  )}

                  <div className="col-span-2">
                    <Label htmlFor="note">Note (optional)</Label>
                    <Input
                      id="note"
                      placeholder="Add a note..."
                      value={setForm.note || ''}
                      onChange={(e) => setSetForm(prev => ({ 
                        ...prev, 
                        note: e.target.value || null 
                      }))}
                      data-testid="input-note"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button 
                  onClick={handleAddSet} 
                  disabled={!selectedExercise}
                  data-testid="button-save-set"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Add Set
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAddingExercise(false);
                    setSelectedExercise('');
                    setSetForm({});
                  }}
                  data-testid="button-cancel-add"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exercise Groups */}
      {Object.entries(exerciseGroups).map(([exerciseId, sets]) => (
        <Card key={exerciseId} data-testid={`card-exercise-${exerciseId}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5" />
              {getExerciseName(exerciseId)}
              <Badge variant="secondary" data-testid={`badge-set-count-${exerciseId}`}>
                {sets.length} {sets.length === 1 ? 'set' : 'sets'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sets.map((set, index) => (
                <div 
                  key={set.id} 
                  className="flex items-center justify-between p-3 border rounded-lg"
                  data-testid={`set-row-${set.id}`}
                >
                  {editingSetId === set.id ? (
                    // Edit mode
                    <div className="flex-1 grid grid-cols-3 gap-2 mr-4">
                      <Input
                        type="number"
                        placeholder="Reps"
                        value={setForm.reps || ''}
                        onChange={(e) => setSetForm(prev => ({ 
                          ...prev, 
                          reps: e.target.value ? parseInt(e.target.value) : null 
                        }))}
                        data-testid={`input-edit-reps-${set.id}`}
                      />
                      <Input
                        type="number"
                        step="0.5"
                        placeholder="Weight"
                        value={setForm.weight || ''}
                        onChange={(e) => setSetForm(prev => ({ 
                          ...prev, 
                          weight: e.target.value ? parseFloat(e.target.value) : null 
                        }))}
                        data-testid={`input-edit-weight-${set.id}`}
                      />
                      <Input
                        placeholder="Note"
                        value={setForm.note || ''}
                        onChange={(e) => setSetForm(prev => ({ 
                          ...prev, 
                          note: e.target.value || null 
                        }))}
                        data-testid={`input-edit-note-${set.id}`}
                      />
                    </div>
                  ) : (
                    // Display mode
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-sm w-12">#{index + 1}</span>
                        <div className="flex gap-4 text-sm">
                          {set.reps !== null && (
                            <span data-testid={`text-reps-${set.id}`}>
                              <strong>{set.reps}</strong> reps
                            </span>
                          )}
                          {set.weight !== null && (
                            <span data-testid={`text-weight-${set.id}`}>
                              <strong>{set.weight}</strong> lbs
                            </span>
                          )}
                          {set.durationSec !== null && (
                            <span data-testid={`text-duration-${set.id}`}>
                              <strong>{set.durationSec}</strong>s
                            </span>
                          )}
                          {set.distanceMeters !== null && (
                            <span data-testid={`text-distance-${set.id}`}>
                              <strong>{set.distanceMeters}</strong>m
                            </span>
                          )}
                        </div>
                        {set.note && (
                          <span className="text-xs text-muted-foreground italic" data-testid={`text-note-${set.id}`}>
                            "{set.note}"
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-1">
                    {editingSetId === set.id ? (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUpdateSet(set.id)}
                          data-testid={`button-save-edit-${set.id}`}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={cancelEditing}
                          data-testid={`button-cancel-edit-${set.id}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditing(set)}
                          data-testid={`button-edit-${set.id}`}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteSet(set.id)}
                          data-testid={`button-delete-${set.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Empty state when no exercises */}
      {Object.keys(exerciseGroups).length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Dumbbell className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No exercises added yet</p>
            <p className="text-sm text-muted-foreground mt-1">Add your first exercise to get started</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}