import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Exercise } from "@shared/schema";

// Form validation schema
const addSetFormSchema = z.object({
  exerciseId: z.string().min(1, "Please select an exercise"),
  reps: z.coerce.number().optional(),
  weight: z.coerce.number().optional(),
  durationSec: z.coerce.number().optional(),
  distanceMeters: z.coerce.number().optional(),
  note: z.string().optional(),
}).refine((data) => {
  // At least one metric must be provided
  return data.reps || data.weight || data.durationSec || data.distanceMeters;
}, {
  message: "Please provide at least one metric (reps, weight, duration, or distance)",
  path: ["reps"]
});

type AddSetFormData = z.infer<typeof addSetFormSchema>;

interface AddSetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string | null;
  preSelectedExerciseId?: string | null;
  currentUserId: string;
  onSuccess?: () => void;
}

export function AddSetModal({
  open,
  onOpenChange,
  sessionId,
  preSelectedExerciseId,
  currentUserId,
  onSuccess
}: AddSetModalProps) {
  const { toast } = useToast();

  const form = useForm<AddSetFormData>({
    resolver: zodResolver(addSetFormSchema),
    defaultValues: {
      exerciseId: preSelectedExerciseId || "",
      reps: undefined,
      weight: undefined,
      durationSec: undefined,
      distanceMeters: undefined,
      note: "",
    },
  });

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      form.reset({
        exerciseId: preSelectedExerciseId || "",
        reps: undefined,
        weight: undefined,
        durationSec: undefined,
        distanceMeters: undefined,
        note: "",
      });
    }
  }, [open, preSelectedExerciseId, form.reset]);

  // Fetch exercises for dropdown
  const { data: exercises = [] } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises"],
  });

  // Get selected exercise data
  const selectedExerciseId = form.watch("exerciseId");
  const selectedExercise = exercises.find(ex => ex.id === selectedExerciseId);

  // Add set mutation
  const addSetMutation = useMutation({
    mutationFn: async (data: AddSetFormData) => {
      if (!sessionId) throw new Error("No session selected");
      
      const setData = {
        exerciseId: data.exerciseId,
        ...(data.reps && { reps: data.reps }),
        ...(data.weight && { weight: data.weight }),
        ...(data.durationSec && { durationSec: data.durationSec }),
        ...(data.distanceMeters && { distanceMeters: data.distanceMeters }),
        ...(data.note && { note: data.note }),
      };

      const response = await apiRequest("POST", `/api/workouts/sessions/${sessionId}/sets`, setData);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
      if (sessionId) {
        queryClient.invalidateQueries({ queryKey: ["/api/workouts/sessions", sessionId, "sets"] });
        queryClient.invalidateQueries({ queryKey: ["/api/users", currentUserId, "today-stats"] });
      }
      
      toast({ description: "Set added successfully!" });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      const message = error?.message || "Failed to add set";
      toast({ 
        description: message,
        variant: "destructive" 
      });
    }
  });

  const onSubmit = (data: AddSetFormData) => {
    addSetMutation.mutate(data);
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="modal-add-set">
        <DialogHeader>
          <DialogTitle>Add Set</DialogTitle>
          <DialogDescription>
            Add a new set to this workout session.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Exercise Selection */}
            <FormField
              control={form.control}
              name="exerciseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exercise</FormLabel>
                  <FormControl>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                      disabled={!!preSelectedExerciseId}
                      data-testid="select-exercise"
                    >
                      <SelectTrigger>
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
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Dynamic form fields based on exercise type */}
            {selectedExercise && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Reps field for count and weight exercises */}
                {(selectedExercise.metricType === 'count' || selectedExercise.metricType === 'weight') && (
                  <FormField
                    control={form.control}
                    name="reps"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reps</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Number of reps"
                            data-testid="input-reps"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Weight field for weight exercises */}
                {selectedExercise.metricType === 'weight' && (
                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weight ({selectedExercise.unit})</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="Weight"
                            data-testid="input-weight"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Duration field for duration exercises */}
                {selectedExercise.metricType === 'duration' && (
                  <FormField
                    control={form.control}
                    name="durationSec"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (seconds)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Duration in seconds"
                            data-testid="input-duration"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Distance field for distance exercises */}
                {selectedExercise.metricType === 'distance' && (
                  <FormField
                    control={form.control}
                    name="distanceMeters"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Distance ({selectedExercise.unit})</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="Distance"
                            data-testid="input-distance"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}

            {/* Note field */}
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="How did it feel?"
                      data-testid="input-note"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-4">
              <Button 
                type="submit" 
                disabled={addSetMutation.isPending}
                data-testid="button-save-set"
              >
                {addSetMutation.isPending ? "Adding..." : "Add Set"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
                data-testid="button-cancel-add-set"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}