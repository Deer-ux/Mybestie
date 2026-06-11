import { Router } from "express";
import { db, users, userBadges, anonymousMessages } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function makeRestoreToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let t = "";
  for (let i = 0; i < 64; i++) t += chars[Math.floor(Math.random() * chars.length)];
  return t;
}

function toSlug(username: string): string {
  return username.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function safeInterests(raw: string): string[] {
  try { return JSON.parse(raw); } catch { return []; }
}

function toProfile(row: typeof users.$inferSelect, badgeIds: string[]) {
  return {
    id:             row.id,
    restoreToken:   row.restoreToken,
    slug:           row.slug,
    username:       row.username,
    iconIndex:      row.iconIndex,
    colorIndex:     row.colorIndex,
    ageGroup:       row.ageGroup,
    mood:           row.mood,
    goal:           row.goal,
    interests:      safeInterests(row.interests),
    personality:    row.personality,
    temperament:    row.temperament,
    totalChats:     row.totalChats,
    positiveStreak: row.positiveStreak,
    isOnboarded:    row.isOnboarded,
    isAdmin:        row.isAdmin,
    badges:         badgeIds,
  };
}

// POST /api/users — create anonymous user
router.post("/users", async (req, res) => {
  const { username, iconIndex, colorIndex } = req.body as {
    username?: string;
    iconIndex?: number;
    colorIndex?: number;
  };
  if (!username) {
    res.status(400).json({ error: "username is required" });
    return;
  }

  const slug = toSlug(username);

  try {
    const id = makeId();
    const restoreToken = makeRestoreToken();

    const [row] = await db.insert(users).values({
      id,
      restoreToken,
      slug,
      username,
      iconIndex:  iconIndex  ?? 0,
      colorIndex: colorIndex ?? 0,
    }).returning();

    res.json({ user: toProfile(row, []) });
  } catch (err) {
    req.log.error(err, "create user failed");
    res.status(500).json({ error: "Failed to create user" });
  }
});

// POST /api/users/restore — restore session by id + restoreToken
router.post("/users/restore", async (req, res) => {
  const { userId, restoreToken } = req.body as {
    userId?: string;
    restoreToken?: string;
  };
  if (!userId || !restoreToken) {
    res.status(400).json({ error: "userId and restoreToken are required" });
    return;
  }

  try {
    const [row] = await db.select().from(users).where(eq(users.id, userId));
    if (!row || row.restoreToken !== restoreToken) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    const badges = await db.select().from(userBadges).where(eq(userBadges.userId, userId));
    res.json({ user: toProfile(row, badges.map(b => b.badgeId)) });
  } catch (err) {
    req.log.error(err, "restore session failed");
    res.status(500).json({ error: "Failed to restore session" });
  }
});

// PATCH /api/users/:userId — update profile fields
router.patch("/users/:userId", async (req, res) => {
  const { userId } = req.params;
  const body = req.body as Record<string, unknown>;

  const allowed = [
    "username", "iconIndex", "colorIndex", "ageGroup", "mood", "goal",
    "personality", "temperament", "totalChats", "positiveStreak", "isOnboarded",
  ];

  const patch: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) patch[key] = body[key];
  }
  if ("interests" in body && Array.isArray(body.interests)) {
    patch.interests = JSON.stringify(body.interests);
  }

  if (Object.keys(patch).length === 0) {
    res.status(400).json({ error: "No valid fields to update" });
    return;
  }

  try {
    const [updated] = await db.update(users).set(patch).where(eq(users.id, userId)).returning();
    if (!updated) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const badges = await db.select().from(userBadges).where(eq(userBadges.userId, userId));
    res.json({ user: toProfile(updated, badges.map(b => b.badgeId)) });
  } catch (err) {
    req.log.error(err, "update user failed");
    res.status(500).json({ error: "Failed to update user" });
  }
});

// GET /api/users/:userId/badges
router.get("/users/:userId/badges", async (req, res) => {
  try {
    const badges = await db.select().from(userBadges).where(eq(userBadges.userId, req.params.userId));
    res.json({ badges: badges.map(b => b.badgeId) });
  } catch (err) {
    req.log.error(err, "get badges failed");
    res.status(500).json({ error: "Failed to get badges" });
  }
});

// POST /api/users/:userId/badges — add badge (idempotent)
router.post("/users/:userId/badges", async (req, res) => {
  const { userId } = req.params;
  const { badgeId } = req.body as { badgeId?: string };
  if (!badgeId) {
    res.status(400).json({ error: "badgeId is required" });
    return;
  }

  try {
    const existing = await db.select().from(userBadges).where(
      and(eq(userBadges.userId, userId), eq(userBadges.badgeId, badgeId))
    );
    if (existing.length === 0) {
      await db.insert(userBadges).values({ id: makeId(), userId, badgeId });
    }
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err, "add badge failed");
    res.status(500).json({ error: "Failed to add badge" });
  }
});

// DELETE /api/users/:userId — permanently delete account
router.delete("/users/:userId", async (req, res) => {
  const { userId } = req.params;
  const { restoreToken } = req.body as { restoreToken?: string };
  if (!restoreToken) {
    res.status(400).json({ error: "restoreToken is required" });
    return;
  }

  try {
    const [row] = await db.select().from(users).where(eq(users.id, userId));
    if (!row || row.restoreToken !== restoreToken) {
      res.status(404).json({ error: "Profile not found or token mismatch" });
      return;
    }
    await db.delete(userBadges).where(eq(userBadges.userId, userId));
    await db.delete(anonymousMessages).where(eq(anonymousMessages.recipientUserId, userId));
    await db.delete(users).where(eq(users.id, userId));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err, "delete user failed");
    res.status(500).json({ error: "Failed to delete account" });
  }
});

export default router;
