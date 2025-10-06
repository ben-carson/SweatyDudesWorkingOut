import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Dumbbell } from "lucide-react";
import type { Exercise, InsertExercise } from "@shared/schema";
import { insertExerciseSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Exercises() {
  const { toast } = useToast();
  const [isAddingExercise, setIsAddingExercise] = useState(false);

  const form = useForm<InsertExercise>({
    resolver: zodResolver(insertExerciseSchema),
    defaultValues: {
      name: "",
      metricType: "",
      unit: "",
    },
  });

  // Fetch exercises with cache busting
  const { data: exercises = [], isLoading } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises"],
    refetchOnMount: 'always',
    staleTime: 0,
  });

  // Create exercise mutation
  const createExerciseMutation = useMutation({
    mutationFn: async (data: InsertExercise) => {
      const response = await apiRequest("POST", "/api/exercises", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
      form.reset();
      setIsAddingExercise(false);
      toast({ description: "Exercise added successfully!" });
    },
    onError: () => {
      toast({ 
        description: "Failed to add exercise. It may already exist.", 
        variant: "destructive" 
      });
    }
  });

  const handleAddExercise = (data: InsertExercise) => {
    createExerciseMutation.mutate(data);
  };

  const getMetricBadgeVariant = (metricType: string) => {
    switch (metricType) {
      case 'count': return 'default';
      case 'weight': return 'secondary';
      case 'duration': return 'outline';
      case 'distance': return 'outline';
      default: return 'default';
    }
  };

  const metricType = form.watch("metricType");

  return (
    <div className="min-h-screen bg-background pb-20 px-4">
      <div className="max-w-4xl mx-auto pt-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground" data-testid="text-exercises-title">
              Exercises
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your exercise library
            </p>
          </div>
          <Button
            onClick={() => setIsAddingExercise(true)}
            size="default"
            data-testid="button-add-exercise"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Exercise
          </Button>
        </div>

        {/* Exercise Count */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Exercise Library</CardTitle>
                <CardDescription>
                  {exercises.length} {exercises.length === 1 ? 'exercise' : 'exercises'} available
                </CardDescription>
              </div>
              <Dumbbell className="w-8 h-8 text-primary" />
            </div>
          </CardHeader>
        </Card>

        {/* Exercises List */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading exercises...
          </div>
        ) : exercises.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Dumbbell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                No exercises yet. Add your first exercise to get started!
              </p>
              <Button
                onClick={() => setIsAddingExercise(true)}
                variant="outline"
                data-testid="button-add-first-exercise"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Exercise
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {exercises.map((exercise) => (
              <Card key={exercise.id} data-testid={`card-exercise-${exercise.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground" data-testid={`text-exercise-name-${exercise.id}`}>
                        {exercise.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={getMetricBadgeVariant(exercise.metricType)}>
                          {exercise.metricType}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {exercise.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add Exercise Dialog */}
        <Dialog open={isAddingExercise} onOpenChange={(open) => {
          setIsAddingExercise(open);
          if (!open) form.reset();
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Exercise</DialogTitle>
              <DialogDescription>
                Create a new exercise to track in your workouts
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddExercise)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exercise Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Bench Press, Squats, Running"
                          data-testid="input-exercise-name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="metricType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Metric Type</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          const defaultUnit = 
                            value === 'count' ? 'reps' : 
                            value === 'weight' ? 'lbs' : 
                            value === 'duration' ? 'seconds' : 
                            value === 'distance' ? 'meters' : '';
                          form.setValue('unit', defaultUnit);
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-metric-type">
                            <SelectValue placeholder="Select metric type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="count" data-testid="option-metric-count">Count (reps, times)</SelectItem>
                          <SelectItem value="weight" data-testid="option-metric-weight">Weight (lbs, kg)</SelectItem>
                          <SelectItem value="duration" data-testid="option-metric-duration">Duration (seconds, minutes)</SelectItem>
                          <SelectItem value="distance" data-testid="option-metric-distance">Distance (meters, miles)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!metricType}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-unit">
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {metricType === 'count' && (
                            <>
                              <SelectItem value="reps" data-testid="option-unit-reps">Reps</SelectItem>
                              <SelectItem value="times" data-testid="option-unit-times">Times</SelectItem>
                            </>
                          )}
                          {metricType === 'weight' && (
                            <>
                              <SelectItem value="lbs" data-testid="option-unit-lbs">Pounds (lbs)</SelectItem>
                              <SelectItem value="kg" data-testid="option-unit-kg">Kilograms (kg)</SelectItem>
                            </>
                          )}
                          {metricType === 'duration' && (
                            <>
                              <SelectItem value="seconds" data-testid="option-unit-seconds">Seconds</SelectItem>
                              <SelectItem value="minutes" data-testid="option-unit-minutes">Minutes</SelectItem>
                            </>
                          )}
                          {metricType === 'distance' && (
                            <>
                              <SelectItem value="meters" data-testid="option-unit-meters">Meters</SelectItem>
                              <SelectItem value="miles" data-testid="option-unit-miles">Miles</SelectItem>
                              <SelectItem value="km" data-testid="option-unit-km">Kilometers</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setIsAddingExercise(false);
                      form.reset();
                    }}
                    data-testid="button-cancel-exercise"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={createExerciseMutation.isPending}
                    data-testid="button-save-exercise"
                  >
                    {createExerciseMutation.isPending ? "Adding..." : "Add Exercise"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
