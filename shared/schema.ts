import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
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

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Challenge = typeof challenges.$inferSelect;
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;

export type ChallengeParticipant = typeof challengeParticipants.$inferSelect;
export type InsertChallengeParticipant = z.infer<typeof insertChallengeParticipantSchema>;

export type ChallengeEntry = typeof challengeEntries.$inferSelect;
export type InsertChallengeEntry = z.infer<typeof insertChallengeEntrySchema>;
