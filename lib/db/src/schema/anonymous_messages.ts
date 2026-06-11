import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const anonymousMessages = pgTable("anonymous_messages", {
  id:                text("id").primaryKey(),
  recipientUserId:   text("recipient_user_id").notNull(),
  recipientSlug:     text("recipient_slug").notNull(),
  category:          text("category").notNull(),
  content:           text("content").notNull(),
  senderFingerprint: text("sender_fingerprint").notNull(),
  moderationStatus:  text("moderation_status").notNull().default("approved"),
  isRead:            boolean("is_read").notNull().default(false),
  isSaved:           boolean("is_saved").notNull().default(false),
  isReported:        boolean("is_reported").notNull().default(false),
  publicReply:       text("public_reply"),
  createdAt:         timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type AnonymousMessage = typeof anonymousMessages.$inferSelect;
