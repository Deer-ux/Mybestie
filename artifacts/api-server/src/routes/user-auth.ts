import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db, users } from "@workspace/db";
import { eq, or } from "drizzle-orm";

const router = Router();

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function makeRestoreToken(): string {
  return crypto.randomBytes(48).toString("hex");
}

function toSlug(username: string): string {
  return username.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function safeInterests(raw: string): string[] {
  try { return JSON.parse(raw); } catch { return []; }
}

function toProfile(row: typeof users.$inferSelect) {
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
    hasPassword:    row.passwordHash !== null,
    badges:         [] as string[],
  };
}

// POST /api/auth/register — create account with username + password
router.post("/auth/register", async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required." });
    return;
  }

  const trimmedUsername = username.trim();
  const trimmedPassword = password.trim();

  if (trimmedUsername.length < 3 || trimmedUsername.length > 24) {
    res.status(400).json({ error: "Username must be 3–24 characters." });
    return;
  }
  if (trimmedPassword.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters." });
    return;
  }
  if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
    res.status(400).json({ error: "Username can only contain letters, numbers, and underscores." });
    return;
  }

  const slug = toSlug(trimmedUsername);

  try {
    // Check username is not taken
    const existing = await db.select({ id: users.id })
      .from(users)
      .where(or(eq(users.slug, slug), eq(users.username, trimmedUsername)));

    if (existing.length > 0) {
      res.status(409).json({ error: "That username is already taken. Please choose another." });
      return;
    }

    const passwordHash = await bcrypt.hash(trimmedPassword, 12);
    const id = makeId();
    const restoreToken = makeRestoreToken();

    const [row] = await db.insert(users).values({
      id,
      restoreToken,
      slug,
      username: trimmedUsername,
      passwordHash,
      iconIndex:  0,
      colorIndex: 0,
    }).returning();

    res.status(201).json({ user: toProfile(row) });
  } catch (err) {
    req.log.error(err, "register failed");
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

// POST /api/auth/login — sign in with username + password
router.post("/auth/login", async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required." });
    return;
  }

  const slug = toSlug(username.trim());

  try {
    const [row] = await db.select().from(users).where(eq(users.slug, slug));

    if (!row || !row.passwordHash) {
      res.status(401).json({ error: "Incorrect username or password." });
      return;
    }

    const match = await bcrypt.compare(password.trim(), row.passwordHash);
    if (!match) {
      res.status(401).json({ error: "Incorrect username or password." });
      return;
    }

    res.json({ user: toProfile(row) });
  } catch (err) {
    req.log.error(err, "login failed");
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

export default router;
