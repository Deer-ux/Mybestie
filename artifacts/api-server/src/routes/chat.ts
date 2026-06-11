import { Router } from "express";
import { db, chatSessions, chatMessages, waitingPool } from "@workspace/db";
import { eq, asc } from "drizzle-orm";

const router = Router();

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// ── GET /api/chat/:sessionId ─────────────────────────────────────────────────
// Returns session info + all messages. Mobile polls this every 2 s for new msgs.
router.get("/chat/:sessionId", async (req, res) => {
  const { sessionId } = req.params as { sessionId: string };

  try {
    const sessions = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.id, sessionId))
      .limit(1);

    if (sessions.length === 0) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const session = sessions[0]!;
    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(asc(chatMessages.createdAt));

    // Resolve anonymous usernames from waiting pool (may have been cleaned up)
    const poolRows = await db
      .select()
      .from(waitingPool)
      .where(eq(waitingPool.matchedSessionId, sessionId));

    const usernameMap: Record<string, string> = {};
    for (const row of poolRows) {
      usernameMap[row.userId] = row.anonymousUsername;
    }

    res.json({ session, messages, usernameMap });
  } catch (err) {
    req.log.error({ err }, "chat/get error");
    res.status(500).json({ error: "Server error" });
  }
});

// ── POST /api/chat/:sessionId/send ───────────────────────────────────────────
router.post("/chat/:sessionId/send", async (req, res) => {
  const { sessionId } = req.params as { sessionId: string };
  const { userId, text } = req.body as { userId?: string; text?: string };

  if (!userId || !text?.trim()) {
    res.status(400).json({ error: "userId and text are required" });
    return;
  }

  try {
    // Verify session exists and user belongs to it
    const sessions = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.id, sessionId))
      .limit(1);

    if (sessions.length === 0) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const session = sessions[0]!;
    if (session.user1Id !== userId && session.user2Id !== userId) {
      res.status(403).json({ error: "Not a participant" });
      return;
    }

    const msg = {
      id:        makeId(),
      sessionId,
      senderId:  userId,
      text:      text.trim(),
      createdAt: new Date(),
    };

    await db.insert(chatMessages).values(msg);
    res.json({ message: msg });
  } catch (err) {
    req.log.error({ err }, "chat/send error");
    res.status(500).json({ error: "Server error" });
  }
});

// ── POST /api/chat/:sessionId/end ────────────────────────────────────────────
router.post("/chat/:sessionId/end", async (req, res) => {
  const { sessionId } = req.params as { sessionId: string };
  const { userId } = req.body as { userId?: string };

  try {
    await db
      .update(chatSessions)
      .set({ status: "ended" })
      .where(eq(chatSessions.id, sessionId));
    req.log.info(`Chat ended: session=${sessionId} by=${userId ?? "unknown"}`);
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "chat/end error");
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
