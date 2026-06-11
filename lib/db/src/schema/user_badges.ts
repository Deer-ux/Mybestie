import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const userBadges = pgTable("user_badges", {
  id:       text("id").primaryKey(),
  userId:   text("user_id").notNull(),
  badgeId:  text("badge_id").notNull(),
  earnedAt: timestamp("earned_at", { withTimezone: true }).defaultNow().notNull(),
});

export type UserBadge = typeof userBadges.$inferSelect;
