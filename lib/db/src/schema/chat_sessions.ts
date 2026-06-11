import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const chatSessions = pgTable("chat_sessions", {
  id:        text("id").primaryKey(),
  user1Id:   text("user1_id").notNull(),
  user2Id:   text("user2_id").notNull(),
  status:    text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type ChatSession = typeof chatSessions.$inferSelect;
