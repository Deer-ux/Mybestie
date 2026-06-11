import { Router } from "express";
import { db, anonymousMessages, users } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

const BLOCKED_PATTERNS = [
  "kill yourself", "kys", "go kill yourself", "i will kill you",
  "send nudes", "send me nudes", "nude pic", "sex with me", "rape you",
  "cut yourself", "harm yourself", "end your life", "you should die",
  "bomb", "shooting", "stab you", "doxx",
  "@gmail.com", "@yahoo.com", "@hotmail", "telegram me at", "whatsapp me at",
];

function moderate(content: string): "approved" | "hidden" {
  const lower = content.toLowerCase();
  return BLOCKED_PATTERNS.some(p => lower.includes(p)) ? "hidden" : "approved";
}

// GET /api/inbox/:userId — load messages for the authenticated user
router.get("/inbox/:userId", async (req, res) => {
  try {
    const msgs = await db
      .select()
      .from(anonymousMessages)
      .where(eq(anonymousMessages.recipientUserId, req.params.userId))
      .orderBy(anonymousMessages.createdAt);
    res.json({ messages: msgs });
  } catch (err) {
    req.log.error(err, "get inbox failed");
    res.status(500).json({ error: "Failed to load inbox" });
  }
});

// POST /api/inbox/:slug/send — anonymous sender sends a message (slug is public)
router.post("/inbox/:slug/send", async (req, res) => {
  const { slug } = req.params;
  const { category, content, senderFingerprint } = req.body as {
    category?: string;
    content?: string;
    senderFingerprint?: string;
  };

  if (!category || !content || content.trim().length < 2) {
    res.status(400).json({ error: "category and content (min 2 chars) are required" });
    return;
  }

  try {
    const [recipient] = await db.select().from(users).where(eq(users.slug, slug));
    if (!recipient) {
      res.status(404).json({ error: "Recipient not found" });
      return;
    }

    const modStatus = moderate(content);
    const [msg] = await db
      .insert(anonymousMessages)
      .values({
        id:                makeId(),
        recipientUserId:   recipient.id,
        recipientSlug:     slug,
        category,
        content:           content.trim(),
        senderFingerprint: senderFingerprint ?? "anonymous",
        moderationStatus:  modStatus,
      })
      .returning();

    res.json({ message: msg, blocked: modStatus === "hidden" });
  } catch (err) {
    req.log.error(err, "send message failed");
    res.status(500).json({ error: "Failed to send message" });
  }
});

// PATCH /api/inbox/:userId/messages/:messageId — update read/saved/reported/reply
router.patch("/inbox/:userId/messages/:messageId", async (req, res) => {
  const { userId, messageId } = req.params;
  const body = req.body as Partial<{
    isRead: boolean;
    isSaved: boolean;
    isReported: boolean;
    publicReply: string;
  }>;

  const patch: Record<string, unknown> = {};
  if (body.isRead     !== undefined) patch.isRead     = body.isRead;
  if (body.isSaved    !== undefined) patch.isSaved    = body.isSaved;
  if (body.isReported !== undefined) patch.isReported = body.isReported;
  if (body.publicReply!== undefined) patch.publicReply= body.publicReply;

  if (Object.keys(patch).length === 0) {
    res.status(400).json({ error: "Nothing to update" });
    return;
  }

  try {
    await db
      .update(anonymousMessages)
      .set(patch)
      .where(and(
        eq(anonymousMessages.id, messageId),
        eq(anonymousMessages.recipientUserId, userId),
      ));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err, "update message failed");
    res.status(500).json({ error: "Failed to update message" });
  }
});

// DELETE /api/inbox/:userId/messages/:messageId
router.delete("/inbox/:userId/messages/:messageId", async (req, res) => {
  const { userId, messageId } = req.params;
  try {
    await db
      .delete(anonymousMessages)
      .where(and(
        eq(anonymousMessages.id, messageId),
        eq(anonymousMessages.recipientUserId, userId),
      ));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err, "delete message failed");
    res.status(500).json({ error: "Failed to delete message" });
  }
});

export default router;
