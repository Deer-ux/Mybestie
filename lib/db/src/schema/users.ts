import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id:             text("id").primaryKey(),
  restoreToken:   text("restore_token").notNull().unique(),
  slug:           text("slug").notNull().unique(),
  username:       text("username").notNull(),
  iconIndex:      integer("icon_index").notNull().default(0),
  colorIndex:     integer("color_index").notNull().default(0),
  ageGroup:       text("age_group").notNull().default(""),
  mood:           text("mood").notNull().default(""),
  goal:           text("goal").notNull().default(""),
  interests:      text("interests").notNull().default("[]"),
  personality:    text("personality").notNull().default(""),
  temperament:    text("temperament").notNull().default(""),
  totalChats:     integer("total_chats").notNull().default(0),
  positiveStreak: integer("positive_streak").notNull().default(0),
  isOnboarded:    boolean("is_onboarded").notNull().default(false),
  isAdmin:        boolean("is_admin").notNull().default(false),
  createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
