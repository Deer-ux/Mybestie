import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const chatMessages = pgTable("chat_messages", {
  id:        text("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  senderId:  text("sender_id").notNull(),
  text:      text("text").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
