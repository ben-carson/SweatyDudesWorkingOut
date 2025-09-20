import type { 
  User, InsertUser, 
  Challenge, InsertChallenge,
  ChallengeParticipant, InsertChallengeParticipant,
  ChallengeEntry, InsertChallengeEntry
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface LeaderboardEntry {
  user: User;
  total: number;
  rank: number;
  deltaFromLeader: number;
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
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private challenges: Map<string, Challenge> = new Map();
  private participants: Map<string, ChallengeParticipant> = new Map();
  private entries: Map<string, ChallengeEntry> = new Map();

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
}

export const storage = new MemStorage();
