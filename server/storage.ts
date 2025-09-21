import type { 
  User, InsertUser, 
  Challenge, InsertChallenge,
  ChallengeParticipant, InsertChallengeParticipant,
  ChallengeEntry, InsertChallengeEntry,
  Exercise, InsertExercise,
  WorkoutSession, InsertWorkoutSession, UpdateWorkoutSession,
  WorkoutSet, InsertWorkoutSet, UpdateWorkoutSet
} from "@shared/schema";
import { randomUUID } from "crypto";

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

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private challenges: Map<string, Challenge> = new Map();
  private participants: Map<string, ChallengeParticipant> = new Map();
  private entries: Map<string, ChallengeEntry> = new Map();
  private exercises: Map<string, Exercise> = new Map();
  private workoutSessions: Map<string, WorkoutSession> = new Map();
  private workoutSets: Map<string, WorkoutSet> = new Map();

  constructor() {
    this.createMockData();
  }

  private createMockData() {
    // Add some mock users for testing
    const user1: User = {
      id: 'user1',
      username: 'mike_sweat',
      name: 'Mike Johnson',
    };
    const user2: User = {
      id: 'user2', 
      username: 'sarah_gains',
      name: 'Sarah Wilson',
    };
    const user3: User = {
      id: 'user3',
      username: 'alex_fit', 
      name: 'Alex Chen',
    };

    this.users.set(user1.id, user1);
    this.users.set(user2.id, user2);
    this.users.set(user3.id, user3);

    // Create a sample challenge
    const challenge: Challenge = {
      id: 'challenge1',
      title: 'Push-up Championship',
      activity: 'pushups',
      metric: 'count',
      unit: 'reps',
      startAt: new Date('2025-09-15'),
      endAt: new Date('2025-10-15'),
      createdBy: 'user1',
      status: 'active',
      createdAt: new Date(),
    };

    this.challenges.set(challenge.id, challenge);

    // Add participants
    const participant1: ChallengeParticipant = { id: 'p1', challengeId: 'challenge1', userId: 'user1' };
    const participant2: ChallengeParticipant = { id: 'p2', challengeId: 'challenge1', userId: 'user2' };
    const participant3: ChallengeParticipant = { id: 'p3', challengeId: 'challenge1', userId: 'user3' };

    this.participants.set(participant1.id, participant1);
    this.participants.set(participant2.id, participant2);
    this.participants.set(participant3.id, participant3);

    // Add some entries
    const entries: ChallengeEntry[] = [
      { id: 'e1', challengeId: 'challenge1', userId: 'user1', value: 150, note: 'Morning workout', createdAt: new Date('2025-09-16') },
      { id: 'e2', challengeId: 'challenge1', userId: 'user2', value: 120, note: 'Felt strong today', createdAt: new Date('2025-09-16') },
      { id: 'e3', challengeId: 'challenge1', userId: 'user3', value: 180, note: 'PR!', createdAt: new Date('2025-09-16') },
      { id: 'e4', challengeId: 'challenge1', userId: 'user1', value: 100, note: null, createdAt: new Date('2025-09-17') },
      { id: 'e5', challengeId: 'challenge1', userId: 'user2', value: 140, note: 'Getting better', createdAt: new Date('2025-09-17') },
    ];

    entries.forEach(entry => this.entries.set(entry.id, entry));

    // Add sample exercises
    const exercises: Exercise[] = [
      { id: 'ex1', name: 'Push-ups', metricType: 'count', unit: 'reps', createdAt: new Date() },
      { id: 'ex2', name: 'Bench Press', metricType: 'weight', unit: 'lbs', createdAt: new Date() },
      { id: 'ex3', name: 'Running', metricType: 'distance', unit: 'miles', createdAt: new Date() },
      { id: 'ex4', name: 'Plank', metricType: 'duration', unit: 'seconds', createdAt: new Date() },
      { id: 'ex5', name: 'Squats', metricType: 'count', unit: 'reps', createdAt: new Date() },
    ];
    
    exercises.forEach(exercise => this.exercises.set(exercise.id, exercise));

    // Add sample workout sessions
    const sessions: WorkoutSession[] = [
      { 
        id: 'session1', 
        userId: 'user1', 
        startedAt: new Date('2025-09-19T09:00:00'), 
        endedAt: new Date('2025-09-19T10:30:00'), 
        note: 'Great upper body workout',
        createdAt: new Date('2025-09-19T09:00:00')
      },
      { 
        id: 'session2', 
        userId: 'user1', 
        startedAt: new Date('2025-09-20T08:00:00'), 
        endedAt: null, 
        note: null,
        createdAt: new Date('2025-09-20T08:00:00')
      },
    ];
    
    sessions.forEach(session => this.workoutSessions.set(session.id, session));

    // Add sample workout sets
    const sets: WorkoutSet[] = [
      { id: 'set1', sessionId: 'session1', exerciseId: 'ex1', reps: 25, weight: null, durationSec: null, distanceMeters: null, note: 'First set', createdAt: new Date('2025-09-19T09:15:00') },
      { id: 'set2', sessionId: 'session1', exerciseId: 'ex1', reps: 20, weight: null, durationSec: null, distanceMeters: null, note: null, createdAt: new Date('2025-09-19T09:20:00') },
      { id: 'set3', sessionId: 'session1', exerciseId: 'ex2', reps: 8, weight: 185, durationSec: null, distanceMeters: null, note: 'Personal best!', createdAt: new Date('2025-09-19T09:45:00') },
      { id: 'set4', sessionId: 'session2', exerciseId: 'ex1', reps: 30, weight: null, durationSec: null, distanceMeters: null, note: null, createdAt: new Date('2025-09-20T08:15:00') },
    ];
    
    sets.forEach(set => this.workoutSets.set(set.id, set));
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Challenges
  async createChallenge(challengeData: InsertChallenge): Promise<Challenge> {
    const id = randomUUID();
    const challenge: Challenge = {
      id,
      ...challengeData,
      status: challengeData.status || 'upcoming',
      metric: challengeData.metric || 'count',
      unit: challengeData.unit || 'reps',
      createdAt: new Date(),
    };
    this.challenges.set(id, challenge);
    return challenge;
  }

  async listChallenges(filters?: { status?: string; userId?: string }): Promise<Challenge[]> {
    let challenges = Array.from(this.challenges.values());
    
    if (filters?.status) {
      challenges = challenges.filter(c => c.status === filters.status);
    }
    
    if (filters?.userId) {
      // Filter by challenges the user participates in
      const userChallengeIds = Array.from(this.participants.values())
        .filter(p => p.userId === filters.userId)
        .map(p => p.challengeId);
      challenges = challenges.filter(c => userChallengeIds.includes(c.id));
    }
    
    return challenges.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getChallenge(id: string): Promise<Challenge | null> {
    return this.challenges.get(id) || null;
  }

  async updateChallengeStatus(id: string, status: string): Promise<void> {
    const challenge = this.challenges.get(id);
    if (challenge) {
      challenge.status = status;
      this.challenges.set(id, challenge);
    }
  }

  // Challenge Participants
  async addParticipants(challengeId: string, userIds: string[]): Promise<void> {
    for (const userId of userIds) {
      const id = randomUUID();
      const participant: ChallengeParticipant = {
        id,
        challengeId,
        userId,
      };
      this.participants.set(id, participant);
    }
  }

  async listParticipants(challengeId: string): Promise<User[]> {
    const participantUserIds = Array.from(this.participants.values())
      .filter(p => p.challengeId === challengeId)
      .map(p => p.userId);
    
    return participantUserIds.map(userId => this.users.get(userId)).filter(Boolean) as User[];
  }

  // Challenge Entries
  async createEntry(entryData: InsertChallengeEntry): Promise<ChallengeEntry> {
    const id = randomUUID();
    const entry: ChallengeEntry = {
      id,
      ...entryData,
      note: entryData.note || null,
      createdAt: new Date(),
    };
    this.entries.set(id, entry);
    return entry;
  }

  async listEntries(challengeId: string): Promise<ChallengeEntry[]> {
    return Array.from(this.entries.values())
      .filter(e => e.challengeId === challengeId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async deleteEntry(id: string): Promise<void> {
    this.entries.delete(id);
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
        rank: 0, // Will be set below
        deltaFromLeader: 0, // Will be set below
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
    return Array.from(this.exercises.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async createExercise(exerciseData: InsertExercise): Promise<Exercise> {
    const id = randomUUID();
    const exercise: Exercise = {
      id,
      ...exerciseData,
      createdAt: new Date(),
    };
    this.exercises.set(id, exercise);
    return exercise;
  }

  async getExercise(id: string): Promise<Exercise | null> {
    return this.exercises.get(id) || null;
  }

  // Workout Sessions
  async createSession(sessionData: InsertWorkoutSession): Promise<WorkoutSession> {
    const id = randomUUID();
    const session: WorkoutSession = {
      id,
      ...sessionData,
      note: sessionData.note || null,
      startedAt: new Date(),
      endedAt: null, // Explicitly set to null to match type
      createdAt: new Date(),
    };
    this.workoutSessions.set(id, session);
    return session;
  }

  async listSessions(userId: string, options?: { limit?: number; before?: Date; after?: Date }): Promise<WorkoutSession[]> {
    let sessions = Array.from(this.workoutSessions.values())
      .filter(s => s.userId === userId);
    
    if (options?.before) {
      sessions = sessions.filter(s => s.startedAt < options.before!);
    }
    if (options?.after) {
      sessions = sessions.filter(s => s.startedAt > options.after!);
    }
    
    sessions = sessions.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
    
    if (options?.limit) {
      sessions = sessions.slice(0, options.limit);
    }
    
    return sessions;
  }

  async getSession(id: string): Promise<WorkoutSession | null> {
    return this.workoutSessions.get(id) || null;
  }

  // Ownership validation helper
  async getSessionWithOwnership(id: string, userId: string): Promise<WorkoutSession | null> {
    const session = this.workoutSessions.get(id);
    if (!session || session.userId !== userId) return null;
    return session;
  }

  async endSession(id: string): Promise<void> {
    const session = this.workoutSessions.get(id);
    if (session) {
      session.endedAt = new Date();
      this.workoutSessions.set(id, session);
    }
  }

  async getActiveSession(userId: string): Promise<WorkoutSession | null> {
    return Array.from(this.workoutSessions.values())
      .find(session => session.userId === userId && !session.endedAt) || null;
  }

  async updateSession(id: string, updates: UpdateWorkoutSession): Promise<WorkoutSession | null> {
    const session = this.workoutSessions.get(id);
    if (!session) return null;
    
    const updatedSession = {
      ...session,
      ...updates,
    };
    
    // Enforce temporal integrity: endedAt must be >= startedAt even when only one field is updated
    const finalStartedAt = updatedSession.startedAt;
    const finalEndedAt = updatedSession.endedAt;
    
    if (finalEndedAt && finalStartedAt && finalEndedAt < finalStartedAt) {
      throw new Error("End time cannot be before start time");
    }
    
    this.workoutSessions.set(id, updatedSession);
    return updatedSession;
  }

  async deleteSession(id: string): Promise<void> {
    // First delete all sets in this session
    const setsToDelete = Array.from(this.workoutSets.values())
      .filter(set => set.sessionId === id)
      .map(set => set.id);
    
    setsToDelete.forEach(setId => {
      this.workoutSets.delete(setId);
    });
    
    // Then delete the session itself
    this.workoutSessions.delete(id);
  }

  // Workout Sets
  async addSet(setData: InsertWorkoutSet): Promise<WorkoutSet> {
    // Validate referential integrity
    const sessionExists = this.workoutSessions.has(setData.sessionId);
    if (!sessionExists) {
      throw new Error(`Session with id ${setData.sessionId} does not exist`);
    }
    
    const exerciseExists = this.exercises.has(setData.exerciseId);
    if (!exerciseExists) {
      throw new Error(`Exercise with id ${setData.exerciseId} does not exist`);
    }
    
    const id = randomUUID();
    const set: WorkoutSet = {
      id,
      sessionId: setData.sessionId,
      exerciseId: setData.exerciseId,
      reps: setData.reps ?? null,           // Use ?? to preserve 0 values
      weight: setData.weight ?? null,       // Use ?? to preserve 0 values
      durationSec: setData.durationSec ?? null,   // Use ?? to preserve 0 values
      distanceMeters: setData.distanceMeters ?? null, // Use ?? to preserve 0 values
      note: setData.note ?? null,
      createdAt: new Date(),
    };
    this.workoutSets.set(id, set);
    return set;
  }

  async getSet(id: string): Promise<WorkoutSet | null> {
    return this.workoutSets.get(id) || null;
  }

  // Ownership validation for sets
  async getSetWithOwnership(id: string, userId: string): Promise<WorkoutSet | null> {
    const set = this.workoutSets.get(id);
    if (!set) return null;
    
    const session = this.workoutSessions.get(set.sessionId);
    if (!session || session.userId !== userId) return null;
    
    return set;
  }

  async updateSet(id: string, updates: UpdateWorkoutSet): Promise<WorkoutSet | null> {
    const set = this.workoutSets.get(id);
    if (!set) return null;
    
    // Validate exercise exists if being updated
    if (updates.exerciseId && !this.exercises.has(updates.exerciseId)) {
      throw new Error(`Exercise with id ${updates.exerciseId} does not exist`);
    }
    
    // Build updated set with explicit field handling to preserve 0 values
    const updatedSet: WorkoutSet = {
      ...set,
      exerciseId: updates.exerciseId ?? set.exerciseId,
      reps: updates.reps !== undefined ? updates.reps : set.reps,       // Preserve 0 values
      weight: updates.weight !== undefined ? updates.weight : set.weight,
      durationSec: updates.durationSec !== undefined ? updates.durationSec : set.durationSec,
      distanceMeters: updates.distanceMeters !== undefined ? updates.distanceMeters : set.distanceMeters,
      note: updates.note !== undefined ? updates.note : set.note,
    };
    
    this.workoutSets.set(id, updatedSet);
    return updatedSet;
  }

  async listSetsBySession(sessionId: string): Promise<WorkoutSet[]> {
    return Array.from(this.workoutSets.values())
      .filter(s => s.sessionId === sessionId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async listSetsByUser(userId: string, options?: { exerciseId?: string }): Promise<WorkoutSet[]> {
    // Get user's sessions first
    const userSessions = Array.from(this.workoutSessions.values())
      .filter(s => s.userId === userId)
      .map(s => s.id);
    
    let sets = Array.from(this.workoutSets.values())
      .filter(s => userSessions.includes(s.sessionId));
    
    if (options?.exerciseId) {
      sets = sets.filter(s => s.exerciseId === options.exerciseId);
    }
    
    return sets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async deleteSet(id: string): Promise<void> {
    this.workoutSets.delete(id);
  }

  // Analytics
  async getPersonalRecords(userId: string): Promise<PersonalRecord[]> {
    const userSets = await this.listSetsByUser(userId);
    const exerciseRecords = new Map<string, PersonalRecord>();

    for (const set of userSets) {
      const exercise = this.exercises.get(set.exerciseId);
      if (!exercise) continue;

      let value: number | null = null;
      
      // Determine value based on exercise metric type
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
    const exercise = this.exercises.get(exerciseId);
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

      // Create date key based on granularity
      const date = new Date(set.createdAt);
      let dateKey: string;
      if (granularity === 'day') {
        dateKey = date.toISOString().split('T')[0];
      } else {
        // Week granularity
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
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Get today's sessions for the user
    const todaySessions = await this.listSessions(userId, {
      after: startOfDay,
      before: endOfDay
    });

    let totalSets = 0;
    let totalVolume = 0;
    let totalWorkoutTime = 0;
    const uniqueExercises = new Set<string>();

    for (const session of todaySessions) {
      // Calculate workout time
      if (session.endedAt) {
        const startTime = new Date(session.startedAt).getTime();
        const endTime = new Date(session.endedAt).getTime();
        totalWorkoutTime += Math.round((endTime - startTime) / (1000 * 60)); // Convert to minutes
      } else if (session.startedAt) {
        // For active sessions, calculate time since start
        const startTime = new Date(session.startedAt).getTime();
        const now = new Date().getTime();
        totalWorkoutTime += Math.round((now - startTime) / (1000 * 60)); // Convert to minutes
      }

      // Get sets for this session
      const sessionSets = await this.listSetsBySession(session.id);
      totalSets += sessionSets.length;

      // Calculate volume and track unique exercises
      for (const set of sessionSets) {
        uniqueExercises.add(set.exerciseId);
        
        // Calculate volume based on exercise type
        const exercise = this.exercises.get(set.exerciseId);
        if (exercise) {
          switch (exercise.metricType) {
            case 'count':
              if (set.reps) totalVolume += set.reps;
              break;
            case 'weight':
              if (set.weight && set.reps) totalVolume += set.weight * set.reps;
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

export const storage = new MemStorage();
