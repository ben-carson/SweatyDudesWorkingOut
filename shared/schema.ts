import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  name: text("name").notNull(),
});

export const challenges = pgTable("challenges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  activity: text("activity").notNull(), // 'pushups', 'squats', 'pullups', etc.
  metric: text("metric").notNull().default("count"), // 'count', 'weight', 'duration', 'distance'
  unit: text("unit").notNull().default("reps"), // 'reps', 'lbs', 'minutes', 'miles'
  startAt: timestamp("start_at").notNull(),
  endAt: timestamp("end_at").notNull(),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  status: text("status").notNull().default("upcoming"), // 'upcoming', 'active', 'completed'
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const challengeParticipants = pgTable("challenge_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  challengeId: varchar("challenge_id").references(() => challenges.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
});

export const challengeEntries = pgTable("challenge_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  challengeId: varchar("challenge_id").references(() => challenges.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  value: integer("value").notNull(), // the number they logged (e.g., 50 pushups)
  note: text("note"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Workout tracking tables
export const exercises = pgTable("exercises", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  metricType: text("metric_type").notNull(), // 'count', 'weight', 'duration', 'distance'
  unit: text("unit").notNull(), // 'reps', 'lbs', 'minutes', 'miles', 'kg', 'seconds'
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const workoutSessions = pgTable("workout_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  startedAt: timestamp("started_at").notNull().default(sql`now()`),
  endedAt: timestamp("ended_at"),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const workoutSets = pgTable("workout_sets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => workoutSessions.id).notNull(),
  exerciseId: varchar("exercise_id").references(() => exercises.id).notNull(),
  reps: integer("reps"), // for count-based exercises
  weight: real("weight"), // for weight-based exercises  
  durationSec: integer("duration_sec"), // for duration-based exercises
  distanceMeters: real("distance_meters"), // for distance-based exercises
  note: text("note"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  name: true,
});

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
