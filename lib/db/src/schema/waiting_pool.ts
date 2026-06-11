import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const waitingPool = pgTable("waiting_pool", {
  id:               text("id").primaryKey(),
  userId:           text("user_id").notNull(),
  anonymousUsername:text("anonymous_username").notNull(),
  ageGroup:         text("age_group").notNull(),
  conversationMode: text("conversation_mode").notNull().default("general"),
  mood:             text("mood").notNull().default(""),
  status:           text("status").notNull().default("waiting"),
  joinedAt:         timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
  lastActive:       timestamp("last_active",  { withTimezone: true }).defaultNow().notNull(),
  matchedSessionId: text("matched_session_id"),
});

export type WaitingPoolEntry = typeof waitingPool.$inferSelect;
