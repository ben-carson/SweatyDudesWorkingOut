import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertChallengeSchema, 
  insertChallengeEntrySchema,
  insertChallengeParticipantSchema 
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

  const httpServer = createServer(app);

  return httpServer;
}
