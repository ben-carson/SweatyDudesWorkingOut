import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertChallengeSchema, 
  insertChallengeEntrySchema,
  insertChallengeParticipantSchema,
  insertExerciseSchema,
  insertWorkoutSessionSchema,
  insertWorkoutSetSchema,
  updateWorkoutSessionSchema,
  updateWorkoutSetSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Challenges
  app.get("/api/challenges", async (req, res) => {
    try {
      const { status, userId } = req.query;
      const challenges = await storage.listChallenges({
        status: status as string,
        userId: userId as string,
      });
      res.json(challenges);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch challenges" });
    }
  });

  app.post("/api/challenges", async (req, res) => {
    try {
      const validation = insertChallengeSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors });
      }
      
      const challenge = await storage.createChallenge(validation.data);
      res.json(challenge);
    } catch (error) {
      res.status(500).json({ error: "Failed to create challenge" });
    }
  });

  app.get("/api/challenges/:id", async (req, res) => {
    try {
      const challenge = await storage.getChallenge(req.params.id);
      if (!challenge) {
        return res.status(404).json({ error: "Challenge not found" });
      }
      res.json(challenge);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch challenge" });
    }
  });

  app.get("/api/challenges/:id/leaderboard", async (req, res) => {
    try {
      const leaderboard = await storage.getLeaderboard(req.params.id);
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  app.get("/api/challenges/:id/participants", async (req, res) => {
    try {
      const participants = await storage.listParticipants(req.params.id);
      res.json(participants);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch participants" });
    }
  });

  app.post("/api/challenges/:id/participants", async (req, res) => {
    try {
      const { userIds } = req.body;
      if (!Array.isArray(userIds)) {
        return res.status(400).json({ error: "userIds must be an array" });
      }
      
      await storage.addParticipants(req.params.id, userIds);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to add participants" });
    }
  });

  app.post("/api/challenges/:id/entries", async (req, res) => {
    try {
      const entryData = {
        ...req.body,
        challengeId: req.params.id,
      };
      
      const validation = insertChallengeEntrySchema.safeParse(entryData);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors });
      }
      
      const entry = await storage.createEntry(validation.data);
      res.json(entry);
    } catch (error) {
      res.status(500).json({ error: "Failed to create entry" });
    }
  });

  app.get("/api/challenges/:id/entries", async (req, res) => {
    try {
      const entries = await storage.listEntries(req.params.id);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch entries" });
    }
  });

  app.delete("/api/entries/:id", async (req, res) => {
    try {
      await storage.deleteEntry(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete entry" });
    }
  });

  // Users
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.listUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Exercises
  app.get("/api/exercises", async (req, res) => {
    try {
      const exercises = await storage.listExercises();
      res.json(exercises);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch exercises" });
    }
  });

  app.post("/api/exercises", async (req, res) => {
    try {
      const validation = insertExerciseSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors });
      }
      
      const exercise = await storage.createExercise(validation.data);
      res.json(exercise);
    } catch (error) {
      res.status(500).json({ error: "Failed to create exercise" });
    }
  });

  app.get("/api/exercises/:id", async (req, res) => {
    try {
      const exercise = await storage.getExercise(req.params.id);
      if (!exercise) {
        return res.status(404).json({ error: "Exercise not found" });
      }
      res.json(exercise);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch exercise" });
    }
  });

  // Workout Sessions
  app.post("/api/workouts/sessions", async (req, res) => {
    try {
      const validation = insertWorkoutSessionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors });
      }
      
      const session = await storage.createSession(validation.data);
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to create session" });
    }
  });

  app.get("/api/workouts/sessions", async (req, res) => {
    try {
      const { userId, limit, before, after } = req.query;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      
      const options: any = {};
      if (limit) options.limit = parseInt(limit as string);
      if (before) options.before = new Date(before as string);
      if (after) options.after = new Date(after as string);
      
      const sessions = await storage.listSessions(userId as string, options);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  app.get("/api/workouts/sessions/:id", async (req, res) => {
    try {
      const session = await storage.getSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch session" });
    }
  });

  // Enhanced session update endpoint
  app.patch("/api/workouts/sessions/:id", async (req, res) => {
    try {
      // Special case: if action is "end", just end the session
      if (req.body.action === "end") {
        await storage.endSession(req.params.id);
        res.json({ success: true });
        return;
      }
      
      // Otherwise, update the session with provided data
      const validation = updateWorkoutSessionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors });
      }
      
      const updatedSession = await storage.updateSession(req.params.id, validation.data);
      if (!updatedSession) {
        return res.status(404).json({ error: "Session not found" });
      }
      
      res.json(updatedSession);
    } catch (error) {
      // Handle temporal validation errors
      if (error instanceof Error && error.message.includes("End time cannot be before start time")) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to update session" });
    }
  });

  // Delete session endpoint
  app.delete("/api/workouts/sessions/:id", async (req, res) => {
    try {
      await storage.deleteSession(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete session" });
    }
  });

  // Get active session endpoint
  app.get("/api/workouts/active-session", async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      
      const activeSession = await storage.getActiveSession(userId as string);
      res.json(activeSession);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active session" });
    }
  });

  // Workout Sets
  app.post("/api/workouts/sessions/:sessionId/sets", async (req, res) => {
    try {
      const setData = {
        ...req.body,
        sessionId: req.params.sessionId,
      };
      
      const validation = insertWorkoutSetSchema.safeParse(setData);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors });
      }
      
      const set = await storage.addSet(validation.data);
      res.json(set);
    } catch (error) {
      // Handle referential integrity errors from storage
      if (error instanceof Error && error.message.includes("does not exist")) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to add set" });
    }
  });

  app.get("/api/workouts/sessions/:sessionId/sets", async (req, res) => {
    try {
      const sets = await storage.listSetsBySession(req.params.sessionId);
      res.json(sets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sets" });
    }
  });

  // Get single set endpoint
  app.get("/api/workouts/sets/:id", async (req, res) => {
    try {
      const set = await storage.getSet(req.params.id);
      if (!set) {
        return res.status(404).json({ error: "Set not found" });
      }
      res.json(set);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch set" });
    }
  });

  // Update set endpoint
  app.patch("/api/workouts/sets/:id", async (req, res) => {
    try {
      // Reject attempts to change immutable fields
      if (req.body.sessionId) {
        return res.status(400).json({ error: "sessionId cannot be updated" });
      }
      
      const validation = updateWorkoutSetSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors });
      }
      
      // Validate exercise exists if exerciseId is being updated
      if (validation.data.exerciseId) {
        const exerciseExists = await storage.getExercise(validation.data.exerciseId);
        if (!exerciseExists) {
          return res.status(404).json({ error: "Exercise not found" });
        }
      }
      
      const updatedSet = await storage.updateSet(req.params.id, validation.data);
      if (!updatedSet) {
        return res.status(404).json({ error: "Set not found" });
      }
      
      res.json(updatedSet);
    } catch (error) {
      // Handle referential integrity errors
      if (error instanceof Error && error.message.includes("does not exist")) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to update set" });
    }
  });

  app.delete("/api/workouts/sets/:id", async (req, res) => {
    try {
      await storage.deleteSet(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete set" });
    }
  });

  // Analytics
  app.get("/api/users/:userId/prs", async (req, res) => {
    try {
      const prs = await storage.getPersonalRecords(req.params.userId);
      res.json(prs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch personal records" });
    }
  });

  app.get("/api/users/:userId/progress", async (req, res) => {
    try {
      const { exerciseId, granularity = 'day' } = req.query;
      if (!exerciseId) {
        return res.status(400).json({ error: "exerciseId is required" });
      }
      
      const timeseries = await storage.getExerciseTimeseries(
        req.params.userId, 
        exerciseId as string, 
        granularity as 'day' | 'week'
      );
      res.json(timeseries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch progress data" });
    }
  });

  app.get("/api/users/:userId/sets", async (req, res) => {
    try {
      const { exerciseId } = req.query;
      const options: any = {};
      if (exerciseId) options.exerciseId = exerciseId as string;
      
      const sets = await storage.listSetsByUser(req.params.userId, options);
      res.json(sets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user sets" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
