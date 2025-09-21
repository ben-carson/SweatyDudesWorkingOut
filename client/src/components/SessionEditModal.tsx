import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { WorkoutSession, UpdateWorkoutSession } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Form validation schema
const editSessionSchema = z.object({
  note: z.string().optional(),
  startedAt: z.string().min(1, "Start time is required"),
  endedAt: z.string().optional(),
}).refine((data) => {
  // Ensure endedAt >= startedAt when both are provided
  if (data.startedAt && data.endedAt) {
    const start = new Date(data.startedAt);
    const end = new Date(data.endedAt);
    return end >= start;
  }
  return true;
}, {
  message: "End time must be after start time",
  path: ["endedAt"]
});

type EditSessionFormData = z.infer<typeof editSessionSchema>;

interface SessionEditModalProps {
  session: WorkoutSession | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function SessionEditModal({ session, open, onOpenChange, onSuccess }: SessionEditModalProps) {
  const { toast } = useToast();
  const currentUserId = "user1"; // Mock current user

  const form = useForm<EditSessionFormData>({
    resolver: zodResolver(editSessionSchema),
    defaultValues: {
      note: "",
      startedAt: "",
      endedAt: "",
    },
  });

  // Reset form when session changes
  useEffect(() => {
    if (session) {
      form.reset({
        note: session.note || "",
        startedAt: new Date(session.startedAt).toISOString().slice(0, 16),
        endedAt: session.endedAt ? new Date(session.endedAt).toISOString().slice(0, 16) : "",
      });
    }
  }, [session, form]);

  // Update session mutation
  const updateSessionMutation = useMutation({
    mutationFn: async (data: EditSessionFormData) => {
      if (!session) throw new Error("No session to update");
      
      const updateData: UpdateWorkoutSession = {
        note: data.note || undefined,
        startedAt: new Date(data.startedAt),
        endedAt: data.endedAt ? new Date(data.endedAt) : undefined,
      };

      const response = await apiRequest("PATCH", `/api/workouts/sessions/${session.id}?userId=${currentUserId}`, updateData);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/workouts/sessions", currentUserId] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", currentUserId, "today-stats"] });
      
      toast({ description: "Session updated successfully!" });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      const message = error?.message || "Failed to update session";
      toast({ 
        description: message,
        variant: "destructive" 
      });
    },
  });

  const onSubmit = (data: EditSessionFormData) => {
    updateSessionMutation.mutate(data);
  };

  const handleClose = () => {
    onOpenChange(false);
    form.reset();
  };

  if (!session) {
    return (
      <Dialog open={false} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>No Session Selected</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const formatDateTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]" data-testid="modal-edit-session">
        <DialogHeader>
          <DialogTitle>Edit Workout Session</DialogTitle>
          <DialogDescription>
            Edit session details for workout from {formatDateTime(session.startedAt)}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Session Note</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="How was your workout? Any notes..."
                      className="resize-none"
                      rows={3}
                      data-testid="input-session-note"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startedAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Started At</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      data-testid="input-started-at"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endedAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ended At (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      data-testid="input-ended-at"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                data-testid="button-cancel-edit"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateSessionMutation.isPending}
                data-testid="button-save-session"
              >
                {updateSessionMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}