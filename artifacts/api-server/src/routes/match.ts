import { Router } from "express";
import { db, waitingPool, chatSessions } from "@workspace/db";
import { eq, and, ne, lt, sql } from "drizzle-orm";
import { verifyToken } from "./auth";

const router = Router();

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// How long before a waiting record is considered stale
const STALE_MS = 2 * 60 * 1000; // 2 minutes

// ── POST /api/match/join ─────────────────────────────────────────────────────
// Adds (or refreshes) the current user in the waiting pool, then tries to find
// a match immediately. If a match exists a chat_session is created.
router.post("/match/join", async (req, res) => {
  const { userId, anonymousUsername, ageGroup, conversationMode, mood } =
    req.body as {
      userId?: string;
      anonymousUsername?: string;
      ageGroup?: string;
      conversationMode?: string;
      mood?: string;
    };

  if (!userId || !anonymousUsername || !ageGroup) {
    res.status(400).json({ error: "userId, anonymousUsername and ageGroup are required" });
    return;
  }

  try {
    const staleThreshold = new Date(Date.now() - STALE_MS);

    // 1. Remove stale/old records for this user AND any globally stale records
    await db
      .delete(waitingPool)
      .where(
        sql`user_id = ${userId} OR (status = 'waiting' AND last_active < ${staleThreshold})`
      );

    // 2. Insert this user into the waiting pool
    const entryId = makeId();
    await db.insert(waitingPool).values({
      id:               entryId,
      userId,
      anonymousUsername: anonymousUsername,
      ageGroup,
      conversationMode: conversationMode ?? "general",
      mood:             mood ?? "",
      status:           "waiting",
      joinedAt:         new Date(),
      lastActive:       new Date(),
      matchedSessionId: null,
    });

    req.log.info(`User added to waiting pool: ${userId}`);

    // 3. Look for another waiting user with the same age_group
    const candidates = await db
      .select()
      .from(waitingPool)
      .where(
        and(
          eq(waitingPool.status, "waiting"),
          ne(waitingPool.userId, userId),
          eq(waitingPool.ageGroup, ageGroup)
        )
      )
      .limit(1);

    if (candidates.length === 0) {
      // No match yet — tell the client to start polling
      res.json({ status: "waiting", entryId });
      return;
    }

    const opponent = candidates[0]!;

    // 4. Create a chat session
    const sessionId = makeId();
    await db.insert(chatSessions).values({
      id:        sessionId,
      user1Id:   userId,
      user2Id:   opponent.userId,
      status:    "active",
      createdAt: new Date(),
    });

    // 5. Mark both pool entries as matched
    await db
      .update(waitingPool)
      .set({ status: "matched", matchedSessionId: sessionId })
      .where(eq(waitingPool.userId, userId));

    await db
      .update(waitingPool)
      .set({ status: "matched", matchedSessionId: sessionId })
      .where(eq(waitingPool.userId, opponent.userId));

    req.log.info(`Match created: session=${sessionId} users=${userId} + ${opponent.userId}`);

    res.json({ status: "matched", sessionId });
  } catch (err) {
    req.log.error({ err }, "match/join error");
    res.status(500).json({ error: "Server error" });
  }
});

// ── GET /api/match/status/:userId ────────────────────────────────────────────
// Polled by the client every 2 s while waiting. Returns waiting | matched.
router.get("/match/status/:userId", async (req, res) => {
  const { userId } = req.params as { userId: string };

  try {
    // Refresh last_active so we know the user is still here
    await db
      .update(waitingPool)
      .set({ lastActive: new Date() })
      .where(and(eq(waitingPool.userId, userId), eq(waitingPool.status, "waiting")));

    const rows = await db
      .select()
      .from(waitingPool)
      .where(eq(waitingPool.userId, userId))
      .limit(1);

    if (rows.length === 0) {
      res.json({ status: "not_found" });
      return;
    }

    const row = rows[0]!;
    if (row.status === "matched" && row.matchedSessionId) {
      res.json({ status: "matched", sessionId: row.matchedSessionId });
    } else {
      res.json({ status: "waiting" });
    }
  } catch (err) {
    req.log.error({ err }, "match/status error");
    res.status(500).json({ error: "Server error" });
  }
});

// ── POST /api/match/leave ────────────────────────────────────────────────────
// Called when user cancels or navigates away.
router.post("/match/leave", async (req, res) => {
  const { userId } = req.body as { userId?: string };
  if (!userId) { res.status(400).json({ error: "userId required" }); return; }

  try {
    await db.delete(waitingPool).where(eq(waitingPool.userId, userId));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "match/leave error");
    res.status(500).json({ error: "Server error" });
  }
});

// ── GET /api/match/debug ─────────────────────────────────────────────────────
// Owner-only debug view of the waiting pool.
router.get("/match/debug", async (req, res) => {
  const token = (req.headers["x-owner-token"] ?? req.query["token"]) as string | undefined;
  if (!token) { res.status(401).json({ error: "Unauthorized" }); return; }
  const payload = verifyToken(token);
  if (!payload || payload.role !== "owner") {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const entries = await db.select().from(waitingPool).orderBy(waitingPool.joinedAt);
    res.json({ entries });
  } catch (err) {
    req.log.error({ err }, "match/debug error");
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
