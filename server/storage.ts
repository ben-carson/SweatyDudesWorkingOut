import type { 
  User, InsertUser, UpdateUser,
  Challenge, InsertChallenge,
  ChallengeParticipant, InsertChallengeParticipant,
  ChallengeEntry, InsertChallengeEntry,
  Exercise, InsertExercise,
  WorkoutSession, InsertWorkoutSession, UpdateWorkoutSession,
  WorkoutSet, InsertWorkoutSet, UpdateWorkoutSet
} from "@shared/schema";
import { db } from "./db";
import { 
  users, 
  challenges, 
  challengeParticipants, 
  challengeEntries,
  exercises,
  workoutSessions,
  workoutSets
} from "@shared/schema";
import { eq, and, desc, asc, isNull, gte, lte, sql } from "drizzle-orm";

export interface LeaderboardEntry {
  user: User;
  total: number;
  rank: number;
  deltaFromLeader: number;
}

export interface PersonalRecord {
  exercise: Exercise;
  value: number;
  unit: string;
  setId: string;
  date: Date;
}

export interface ExerciseTimeseriesPoint {
  date: Date;
  maxValue: number;
  totalVolume: number;
}

export interface TodayStats {
  totalSets: number;
  totalVolume: number;
  workoutTime: number;
  exerciseCount: number;
}

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: UpdateUser): Promise<User | null>;
  listUsers(): Promise<User[]>;
  
  // Challenges
  createChallenge(challenge: InsertChallenge): Promise<Challenge>;
  listChallenges(filters?: { status?: string; userId?: string }): Promise<Challenge[]>;
  getChallenge(id: string): Promise<Challenge | null>;
  updateChallengeStatus(id: string, status: string): Promise<void>;
  
  // Challenge Participants
  addParticipants(challengeId: string, userIds: string[]): Promise<void>;
  listParticipants(challengeId: string): Promise<User[]>;
  
  // Challenge Entries
  createEntry(entry: InsertChallengeEntry): Promise<ChallengeEntry>;
  listEntries(challengeId: string): Promise<ChallengeEntry[]>;
  deleteEntry(id: string): Promise<void>;
  
  // Leaderboard
  getLeaderboard(challengeId: string): Promise<LeaderboardEntry[]>;
  
  // Exercises
  listExercises(): Promise<Exercise[]>;
  createExercise(exercise: InsertExercise): Promise<Exercise>;
  getExercise(id: string): Promise<Exercise | null>;
  
  // Workout Sessions
  createSession(session: InsertWorkoutSession): Promise<WorkoutSession>;
  listSessions(userId: string, options?: { limit?: number; before?: Date; after?: Date }): Promise<WorkoutSession[]>;
  getSession(id: string): Promise<WorkoutSession | null>;
  getActiveSession(userId: string): Promise<WorkoutSession | null>;
  updateSession(id: string, updates: UpdateWorkoutSession): Promise<WorkoutSession | null>;
  deleteSession(id: string): Promise<void>;
  endSession(id: string): Promise<void>;
  getSessionWithOwnership(id: string, userId: string): Promise<WorkoutSession | null>;
  
  // Workout Sets
  addSet(set: InsertWorkoutSet): Promise<WorkoutSet>;
  getSet(id: string): Promise<WorkoutSet | null>;
  getSetWithOwnership(id: string, userId: string): Promise<WorkoutSet | null>;
  updateSet(id: string, updates: UpdateWorkoutSet): Promise<WorkoutSet | null>;
  listSetsBySession(sessionId: string): Promise<WorkoutSet[]>;
  listSetsByUser(userId: string, options?: { exerciseId?: string }): Promise<WorkoutSet[]>;
  deleteSet(id: string): Promise<void>;
  
  // Analytics
  getPersonalRecords(userId: string): Promise<PersonalRecord[]>;
  getExerciseTimeseries(userId: string, exerciseId: string, granularity: 'day' | 'week'): Promise<ExerciseTimeseriesPoint[]>;
  getTodayStats(userId: string): Promise<TodayStats>;
}

// Database implementation using Drizzle ORM - reference: blueprint:javascript_database
export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updates: UpdateUser): Promise<User | null> {
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser || null;
  }

  async listUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Challenges
  async createChallenge(challengeData: InsertChallenge): Promise<Challenge> {
    const [challenge] = await db.insert(challenges).values(challengeData).returning();
    return challenge;
  }

  async listChallenges(filters?: { status?: string; userId?: string }): Promise<Challenge[]> {
    if (filters?.userId) {
      // Get challenges the user participates in
      const userChallenges = await db
        .select({ challenge: challenges })
        .from(challenges)
        .innerJoin(challengeParticipants, eq(challenges.id, challengeParticipants.challengeId))
        .where(
          filters.status 
            ? and(eq(challengeParticipants.userId, filters.userId), eq(challenges.status, filters.status))
            : eq(challengeParticipants.userId, filters.userId)
        )
        .orderBy(desc(challenges.createdAt));
      
      return userChallenges.map(row => row.challenge);
    }

    const conditions = filters?.status ? eq(challenges.status, filters.status) : undefined;
    return await db
      .select()
      .from(challenges)
      .where(conditions)
      .orderBy(desc(challenges.createdAt));
  }

  async getChallenge(id: string): Promise<Challenge | null> {
    const [challenge] = await db.select().from(challenges).where(eq(challenges.id, id));
    return challenge || null;
  }

  async updateChallengeStatus(id: string, status: string): Promise<void> {
    await db.update(challenges).set({ status }).where(eq(challenges.id, id));
  }

  // Challenge Participants
  async addParticipants(challengeId: string, userIds: string[]): Promise<void> {
    const participants = userIds.map(userId => ({ challengeId, userId }));
    await db.insert(challengeParticipants).values(participants);
  }

  async listParticipants(challengeId: string): Promise<User[]> {
    const results = await db
      .select({ user: users })
      .from(users)
      .innerJoin(challengeParticipants, eq(users.id, challengeParticipants.userId))
      .where(eq(challengeParticipants.challengeId, challengeId));
    
    return results.map(row => row.user);
  }

  // Challenge Entries
  async createEntry(entryData: InsertChallengeEntry): Promise<ChallengeEntry> {
    const [entry] = await db.insert(challengeEntries).values(entryData).returning();
    return entry;
  }

  async listEntries(challengeId: string): Promise<ChallengeEntry[]> {
    return await db
      .select()
      .from(challengeEntries)
      .where(eq(challengeEntries.challengeId, challengeId))
      .orderBy(desc(challengeEntries.createdAt));
  }

  async deleteEntry(id: string): Promise<void> {
    await db.delete(challengeEntries).where(eq(challengeEntries.id, id));
  }

  // Leaderboard
  async getLeaderboard(challengeId: string): Promise<LeaderboardEntry[]> {
    const participants = await this.listParticipants(challengeId);
    const entries = await this.listEntries(challengeId);
    
    const totals = new Map<string, number>();
    
    // Calculate totals for each participant
    for (const participant of participants) {
      const userEntries = entries.filter(e => e.userId === participant.id);
      const total = userEntries.reduce((sum, entry) => sum + entry.value, 0);
      totals.set(participant.id, total);
    }
    
    // Create leaderboard entries and sort by total (descending)
    const leaderboardEntries = participants
      .map(user => ({
        user,
        total: totals.get(user.id) || 0,
        rank: 0,
        deltaFromLeader: 0,
      }))
      .sort((a, b) => b.total - a.total);
    
    // Set ranks and deltas
    const leaderTotal = leaderboardEntries[0]?.total || 0;
    leaderboardEntries.forEach((entry, index) => {
      entry.rank = index + 1;
      entry.deltaFromLeader = leaderTotal - entry.total;
    });
    
    return leaderboardEntries;
  }

  // Exercises
  async listExercises(): Promise<Exercise[]> {
    return await db.select().from(exercises).orderBy(asc(exercises.name));
  }

  async createExercise(exerciseData: InsertExercise): Promise<Exercise> {
    const [exercise] = await db.insert(exercises).values(exerciseData).returning();
    return exercise;
  }

  async getExercise(id: string): Promise<Exercise | null> {
    const [exercise] = await db.select().from(exercises).where(eq(exercises.id, id));
    return exercise || null;
  }

  // Workout Sessions
  async createSession(sessionData: InsertWorkoutSession): Promise<WorkoutSession> {
    const [session] = await db.insert(workoutSessions).values(sessionData).returning();
    return session;
  }

  async listSessions(userId: string, options?: { limit?: number; before?: Date; after?: Date }): Promise<WorkoutSession[]> {
    const conditions = [eq(workoutSessions.userId, userId)];
    
    if (options?.before) {
      conditions.push(lte(workoutSessions.startedAt, options.before));
    }
    if (options?.after) {
      conditions.push(gte(workoutSessions.startedAt, options.after));
    }
    
    let query = db
      .select()
      .from(workoutSessions)
      .where(and(...conditions))
      .orderBy(desc(workoutSessions.startedAt));
    
    if (options?.limit) {
      query = query.limit(options.limit) as typeof query;
    }
    
    return await query;
  }

  async getSession(id: string): Promise<WorkoutSession | null> {
    const [session] = await db.select().from(workoutSessions).where(eq(workoutSessions.id, id));
    return session || null;
  }

  async getSessionWithOwnership(id: string, userId: string): Promise<WorkoutSession | null> {
    const [session] = await db
      .select()
      .from(workoutSessions)
      .where(and(eq(workoutSessions.id, id), eq(workoutSessions.userId, userId)));
    return session || null;
  }

  async endSession(id: string): Promise<void> {
    await db.update(workoutSessions).set({ endedAt: new Date() }).where(eq(workoutSessions.id, id));
  }

  async getActiveSession(userId: string): Promise<WorkoutSession | null> {
    const [session] = await db
      .select()
      .from(workoutSessions)
      .where(and(eq(workoutSessions.userId, userId), isNull(workoutSessions.endedAt)));
    return session || null;
  }

  async updateSession(id: string, updates: UpdateWorkoutSession): Promise<WorkoutSession | null> {
    // First get the current session
    const [currentSession] = await db.select().from(workoutSessions).where(eq(workoutSessions.id, id));
    if (!currentSession) return null;
    
    // Merge updates with current values
    const finalStartedAt = updates.startedAt ?? currentSession.startedAt;
    const finalEndedAt = updates.endedAt !== undefined ? updates.endedAt : currentSession.endedAt;
    
    // Validate temporal integrity
    if (finalEndedAt && finalStartedAt && finalEndedAt < finalStartedAt) {
      throw new Error("End time cannot be before start time");
    }
    
    const [updated] = await db
      .update(workoutSessions)
      .set(updates)
      .where(eq(workoutSessions.id, id))
      .returning();
    
    return updated || null;
  }

  async deleteSession(id: string): Promise<void> {
    // Delete all sets in this session first
    await db.delete(workoutSets).where(eq(workoutSets.sessionId, id));
    // Then delete the session
    await db.delete(workoutSessions).where(eq(workoutSessions.id, id));
  }

  // Workout Sets
  async addSet(setData: InsertWorkoutSet): Promise<WorkoutSet> {
    const [set] = await db.insert(workoutSets).values(setData).returning();
    return set;
  }

  async getSet(id: string): Promise<WorkoutSet | null> {
    const [set] = await db.select().from(workoutSets).where(eq(workoutSets.id, id));
    return set || null;
  }

  async getSetWithOwnership(id: string, userId: string): Promise<WorkoutSet | null> {
    const [result] = await db
      .select({ set: workoutSets })
      .from(workoutSets)
      .innerJoin(workoutSessions, eq(workoutSets.sessionId, workoutSessions.id))
      .where(and(eq(workoutSets.id, id), eq(workoutSessions.userId, userId)));
    
    return result?.set || null;
  }

  async updateSet(id: string, updates: UpdateWorkoutSet): Promise<WorkoutSet | null> {
    const [updated] = await db
      .update(workoutSets)
      .set(updates)
      .where(eq(workoutSets.id, id))
      .returning();
    
    return updated || null;
  }

  async listSetsBySession(sessionId: string): Promise<WorkoutSet[]> {
    return await db
      .select()
      .from(workoutSets)
      .where(eq(workoutSets.sessionId, sessionId))
      .orderBy(asc(workoutSets.createdAt));
  }

  async listSetsByUser(userId: string, options?: { exerciseId?: string }): Promise<WorkoutSet[]> {
    const conditions = [eq(workoutSessions.userId, userId)];
    
    if (options?.exerciseId) {
      conditions.push(eq(workoutSets.exerciseId, options.exerciseId));
    }
    
    const results = await db
      .select({ set: workoutSets })
      .from(workoutSets)
      .innerJoin(workoutSessions, eq(workoutSets.sessionId, workoutSessions.id))
      .where(and(...conditions))
      .orderBy(desc(workoutSets.createdAt));
    
    return results.map(row => row.set);
  }

  async deleteSet(id: string): Promise<void> {
    await db.delete(workoutSets).where(eq(workoutSets.id, id));
  }

  // Analytics
  async getPersonalRecords(userId: string): Promise<PersonalRecord[]> {
    const userSets = await this.listSetsByUser(userId);
    const exerciseRecords = new Map<string, PersonalRecord>();

    for (const set of userSets) {
      const exercise = await this.getExercise(set.exerciseId);
      if (!exercise) continue;

      let value: number | null = null;
      
      switch (exercise.metricType) {
        case 'count':
          value = set.reps;
          break;
        case 'weight':
          value = set.weight;
          break;
        case 'duration':
          value = set.durationSec;
          break;
        case 'distance':
          value = set.distanceMeters;
          break;
      }

      if (value === null) continue;

      const existingRecord = exerciseRecords.get(exercise.id);
      if (!existingRecord || value > existingRecord.value) {
        exerciseRecords.set(exercise.id, {
          exercise,
          value,
          unit: exercise.unit,
          setId: set.id,
          date: set.createdAt,
        });
      }
    }

    return Array.from(exerciseRecords.values()).sort((a, b) => a.exercise.name.localeCompare(b.exercise.name));
  }

  async getExerciseTimeseries(userId: string, exerciseId: string, granularity: 'day' | 'week'): Promise<ExerciseTimeseriesPoint[]> {
    const sets = await this.listSetsByUser(userId, { exerciseId });
    const exercise = await this.getExercise(exerciseId);
    if (!exercise) return [];

    const dataPoints = new Map<string, { maxValue: number; totalVolume: number; date: Date }>();

    for (const set of sets) {
      let value: number | null = null;
      
      switch (exercise.metricType) {
        case 'count':
          value = set.reps;
          break;
        case 'weight':
          value = set.weight;
          break;
        case 'duration':
          value = set.durationSec;
          break;
        case 'distance':
          value = set.distanceMeters;
          break;
      }

      if (value === null) continue;

      const date = new Date(set.createdAt);
      let dateKey: string;
      if (granularity === 'day') {
        dateKey = date.toISOString().split('T')[0];
      } else {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        dateKey = weekStart.toISOString().split('T')[0];
      }

      const existing = dataPoints.get(dateKey);
      if (existing) {
        existing.maxValue = Math.max(existing.maxValue, value);
        existing.totalVolume += value;
      } else {
        dataPoints.set(dateKey, {
          maxValue: value,
          totalVolume: value,
          date: new Date(dateKey),
        });
      }
    }

    return Array.from(dataPoints.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async getTodayStats(userId: string): Promise<TodayStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sessions = await this.listSessions(userId, { after: today, before: tomorrow });
    
    let totalSets = 0;
    let totalVolume = 0;
    let totalWorkoutTime = 0;
    const uniqueExercises = new Set<string>();

    for (const session of sessions) {
      const sets = await this.listSetsBySession(session.id);
      totalSets += sets.length;

      if (session.endedAt && session.startedAt) {
        totalWorkoutTime += (session.endedAt.getTime() - session.startedAt.getTime()) / 1000 / 60;
      }

      for (const set of sets) {
        uniqueExercises.add(set.exerciseId);
        const exercise = await this.getExercise(set.exerciseId);
        if (exercise) {
          switch (exercise.metricType) {
            case 'count':
              if (set.reps) totalVolume += set.reps;
              break;
            case 'weight':
              if (set.weight) totalVolume += set.weight;
              break;
            case 'duration':
              if (set.durationSec) totalVolume += set.durationSec;
              break;
            case 'distance':
              if (set.distanceMeters) totalVolume += set.distanceMeters;
              break;
          }
        }
      }
    }

    return {
      totalSets,
      totalVolume: Math.round(totalVolume),
      workoutTime: totalWorkoutTime,
      exerciseCount: uniqueExercises.size
    };
  }
}

export const storage = new DatabaseStorage();
