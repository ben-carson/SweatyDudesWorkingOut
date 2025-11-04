import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, real } from "drizzle-orm/pg-core";
import { sqliteTable } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { nanoid } from 'nanoid';

const dbMode = (process.env.DB_MODE || 'neon').toLowerCase();
const isSqlite = dbMode === 'sqlite-file' || dbMode === 'sqlite-memory';

const generateId = () => nanoid();

export const users = isSqlite
  ? sqliteTable("users", {
      id: text("id").primaryKey().$defaultFn(generateId),
      username: text("username").notNull().unique(),
      name: text("name").notNull(),
    })
  : pgTable("users", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      username: text("username").notNull().unique(),
      name: text("name").notNull(),
    });

export const challenges = isSqlite
  ? sqliteTable("challenges", {
      id: text("id").primaryKey().$defaultFn(generateId),
      title: text("title").notNull(),
      activity: text("activity").notNull(),
      metric: text("metric").notNull().default("count"),
      unit: text("unit").notNull().default("reps"),
      startAt: integer("start_at", { mode: 'timestamp' }).notNull(),
      endAt: integer("end_at", { mode: 'timestamp' }).notNull(),
      createdBy: text("created_by").references(() => users.id).notNull(),
      status: text("status").notNull().default("upcoming"),
      createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    })
  : pgTable("challenges", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      title: text("title").notNull(),
      activity: text("activity").notNull(),
      metric: text("metric").notNull().default("count"),
      unit: text("unit").notNull().default("reps"),
      startAt: timestamp("start_at").notNull(),
      endAt: timestamp("end_at").notNull(),
      createdBy: varchar("created_by").references(() => users.id).notNull(),
      status: text("status").notNull().default("upcoming"),
      createdAt: timestamp("created_at").notNull().default(sql`now()`),
    });

export const challengeParticipants = isSqlite
  ? sqliteTable("challenge_participants", {
      id: text("id").primaryKey().$defaultFn(generateId),
      challengeId: text("challenge_id").references(() => challenges.id).notNull(),
      userId: text("user_id").references(() => users.id).notNull(),
    })
  : pgTable("challenge_participants", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      challengeId: varchar("challenge_id").references(() => challenges.id).notNull(),
      userId: varchar("user_id").references(() => users.id).notNull(),
    });

export const challengeEntries = isSqlite
  ? sqliteTable("challenge_entries", {
      id: text("id").primaryKey().$defaultFn(generateId),
      challengeId: text("challenge_id").references(() => challenges.id).notNull(),
      userId: text("user_id").references(() => users.id).notNull(),
      value: integer("value").notNull(),
      note: text("note"),
      createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    })
  : pgTable("challenge_entries", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      challengeId: varchar("challenge_id").references(() => challenges.id).notNull(),
      userId: varchar("user_id").references(() => users.id).notNull(),
      value: integer("value").notNull(),
      note: text("note"),
      createdAt: timestamp("created_at").notNull().default(sql`now()`),
    });

export const exercises = isSqlite
  ? sqliteTable("exercises", {
      id: text("id").primaryKey().$defaultFn(generateId),
      name: text("name").notNull().unique(),
      metricType: text("metric_type").notNull(),
      unit: text("unit").notNull(),
      createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    })
  : pgTable("exercises", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: text("name").notNull().unique(),
      metricType: text("metric_type").notNull(),
      unit: text("unit").notNull(),
      createdAt: timestamp("created_at").notNull().default(sql`now()`),
    });

export const workoutSessions = isSqlite
  ? sqliteTable("workout_sessions", {
      id: text("id").primaryKey().$defaultFn(generateId),
      userId: text("user_id").references(() => users.id).notNull(),
      startedAt: integer("started_at", { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
      endedAt: integer("ended_at", { mode: 'timestamp' }),
      note: text("note"),
      createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    })
  : pgTable("workout_sessions", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id).notNull(),
      startedAt: timestamp("started_at").notNull().default(sql`now()`),
      endedAt: timestamp("ended_at"),
      note: text("note"),
      createdAt: timestamp("created_at").notNull().default(sql`now()`),
    });

export const workoutSets = isSqlite
  ? sqliteTable("workout_sets", {
      id: text("id").primaryKey().$defaultFn(generateId),
      sessionId: text("session_id").references(() => workoutSessions.id).notNull(),
      exerciseId: text("exercise_id").references(() => exercises.id).notNull(),
      reps: integer("reps"),
      weight: real("weight"),
      durationSec: integer("duration_sec"),
      distanceMeters: real("distance_meters"),
      note: text("note"),
      createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    })
  : pgTable("workout_sets", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      sessionId: varchar("session_id").references(() => workoutSessions.id).notNull(),
      exerciseId: varchar("exercise_id").references(() => exercises.id).notNull(),
      reps: integer("reps"),
      weight: real("weight"),
      durationSec: integer("duration_sec"),
      distanceMeters: real("distance_meters"),
      note: text("note"),
      createdAt: timestamp("created_at").notNull().default(sql`now()`),
    });

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  id: true,
  username: true,
  name: true,
}).partial({ id: true });

export const updateUserSchema = createInsertSchema(users).pick({
  username: true,
}).partial();

export const insertChallengeSchema = createInsertSchema(challenges).omit({
  id: true,
  createdAt: true,
});

export const insertChallengeParticipantSchema = createInsertSchema(challengeParticipants).omit({
  id: true,
});

export const insertChallengeEntrySchema = createInsertSchema(challengeEntries).omit({
  id: true,
  createdAt: true,
});

export const insertExerciseSchema = createInsertSchema(exercises).omit({
  id: true,
  createdAt: true,
});

export const insertWorkoutSessionSchema = createInsertSchema(workoutSessions).omit({
  id: true,
  createdAt: true,
  startedAt: true, // auto-generated on creation
});

export const insertWorkoutSetSchema = createInsertSchema(workoutSets).omit({
  id: true,
  createdAt: true,
});

// Update schemas for CRUD operations - Fixed date validation and removed userId mutability
export const updateWorkoutSessionSchema = z.object({
  note: z.string().optional(),
  startedAt: z.coerce.date().optional(), // Allow string dates from JSON
  endedAt: z.coerce.date().optional(),   // Allow string dates from JSON
}).partial()
.refine((data) => {
  // Ensure endedAt >= startedAt when both are provided
  if (data.startedAt && data.endedAt) {
    return data.endedAt >= data.startedAt;
  }
  return true;
}, {
  message: "End time must be after start time",
  path: ["endedAt"]
});

export const updateWorkoutSetSchema = insertWorkoutSetSchema.omit({
  sessionId: true, // sessionId should not be updatable
}).partial();

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;

export type Challenge = typeof challenges.$inferSelect;
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;

export type ChallengeParticipant = typeof challengeParticipants.$inferSelect;
export type InsertChallengeParticipant = z.infer<typeof insertChallengeParticipantSchema>;

export type ChallengeEntry = typeof challengeEntries.$inferSelect;
export type InsertChallengeEntry = z.infer<typeof insertChallengeEntrySchema>;

export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;

export type WorkoutSession = typeof workoutSessions.$inferSelect;
export type InsertWorkoutSession = z.infer<typeof insertWorkoutSessionSchema>;

export type WorkoutSet = typeof workoutSets.$inferSelect;
export type InsertWorkoutSet = z.infer<typeof insertWorkoutSetSchema>;
export type UpdateWorkoutSession = z.infer<typeof updateWorkoutSessionSchema>;
export type UpdateWorkoutSet = z.infer<typeof updateWorkoutSetSchema>;

// Today's stats interface
export interface TodayStats {
  totalSets: number;
  totalVolume: number;
  workoutTime: number;
  exerciseCount: number;
}
