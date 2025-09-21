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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Exercise, WorkoutSet } from "@shared/schema";

// Form validation schema for editing sets
const editSetFormSchema = z.object({
  reps: z.coerce.number().int().positive().optional().or(z.literal(undefined)),
  weight: z.coerce.number().positive().optional().or(z.literal(undefined)),
  durationSec: z.coerce.number().int().positive().optional().or(z.literal(undefined)),
  distanceMeters: z.coerce.number().positive().optional().or(z.literal(undefined)),
  note: z.string().optional(),
}).refine((data) => {
  // At least one field must be provided (including note)
  return data.reps || data.weight || data.durationSec || data.distanceMeters || (data.note && data.note.trim().length > 0);
}, {
  message: "Please provide at least one metric or a note",
  path: ["reps"]
});

type EditSetFormData = z.infer<typeof editSetFormSchema>;

interface EditSetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  set: WorkoutSet | null;
  currentUserId: string;
  onSuccess?: () => void;
}

export function EditSetModal({
  open,
  onOpenChange,
  set,
  currentUserId,
  onSuccess
}: EditSetModalProps) {
  const { toast } = useToast();

  const form = useForm<EditSetFormData>({
    resolver: zodResolver(editSetFormSchema),
    defaultValues: {
      reps: undefined,
      weight: undefined,
      durationSec: undefined,
      distanceMeters: undefined,
      note: "",
    },
  });

  // Reset form when modal opens with new set data
  useEffect(() => {
    if (open && set) {
      form.reset({
        reps: set.reps || undefined,
        weight: set.weight || undefined,
        durationSec: set.durationSec || undefined,
        distanceMeters: set.distanceMeters || undefined,
        note: set.note || "",
      });
    }
  }, [open, set, form]);

  // Fetch exercises to get exercise details
  const { data: exercises = [] } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises"],
  });

  // Get exercise details for the set
  const exercise = set ? exercises.find(ex => ex.id === set.exerciseId) : null;

  // Edit set mutation
  const editSetMutation = useMutation({
    mutationFn: async (data: EditSetFormData) => {
      if (!set) throw new Error("No set selected");
      
      const updateData = {
        ...(data.reps !== undefined && { reps: data.reps }),
        ...(data.weight !== undefined && { weight: data.weight }),
        ...(data.durationSec !== undefined && { durationSec: data.durationSec }),
        ...(data.distanceMeters !== undefined && { distanceMeters: data.distanceMeters }),
        ...(data.note !== undefined && { note: data.note }),
      };

      const response = await apiRequest("PATCH", `/api/workouts/sets/${set.id}?userId=${currentUserId}`, updateData);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
      if (set) {
        queryClient.invalidateQueries({ queryKey: ["/api/workouts/sessions", set.sessionId, "sets"] });
        queryClient.invalidateQueries({ queryKey: ["/api/users", currentUserId, "today-stats"] });
      }
      
      toast({ description: "Set updated successfully!" });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      const message = error?.message || "Failed to update set";
      toast({ 
        description: message,
        variant: "destructive" 
      });
    }
  });

  const onSubmit = (data: EditSetFormData) => {
    editSetMutation.mutate(data);
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="modal-edit-set">
        <DialogHeader>
          <DialogTitle>Edit Set</DialogTitle>
          <DialogDescription>
            {exercise && (
              <>Edit this {exercise.name} set</>
            )}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Exercise Info (read-only) */}
            {exercise && (
              <div className="p-3 bg-muted rounded-md">
                <div className="font-medium text-sm">{exercise.name}</div>
                <div className="text-xs text-muted-foreground">
                  {exercise.metricType} exercise • {exercise.unit}
                </div>
              </div>
            )}

            {/* Dynamic form fields based on exercise type */}
            {exercise && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Reps field for count and weight exercises */}
                {(exercise.metricType === 'count' || exercise.metricType === 'weight') && (
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
                {exercise.metricType === 'weight' && (
                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weight ({exercise.unit})</FormLabel>
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
                {exercise.metricType === 'duration' && (
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
                {exercise.metricType === 'distance' && (
                  <FormField
                    control={form.control}
                    name="distanceMeters"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Distance ({exercise.unit})</FormLabel>
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
                disabled={editSetMutation.isPending}
                data-testid="button-save-set-changes"
              >
                {editSetMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
                data-testid="button-cancel-edit-set"
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