import { Router } from "express";
import crypto from "crypto";

const router = Router();

const TOKEN_SECRET = process.env["SESSION_SECRET"] ?? "mindbridge-dev-secret";

function makeToken(role: string): string {
  const payload = JSON.stringify({ role, iat: Date.now() });
  const b64 = Buffer.from(payload).toString("base64url");
  const sig = crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(b64)
    .digest("base64url");
  return `${b64}.${sig}`;
}

export function verifyToken(token: string): { role: string } | null {
  try {
    const [b64, sig] = token.split(".");
    if (!b64 || !sig) return null;
    const expected = crypto
      .createHmac("sha256", TOKEN_SECRET)
      .update(b64)
      .digest("base64url");
    if (sig !== expected) return null;
    return JSON.parse(Buffer.from(b64, "base64url").toString("utf-8"));
  } catch {
    return null;
  }
}

// Owner login — single OWNER_CODE env var
router.post("/auth/owner-login", (req, res) => {
  const { code } = req.body as { code?: string };

  if (!code) {
    res.status(400).json({ error: "Owner code is required." });
    return;
  }

  const ownerCode = process.env["OWNER_CODE"];

  if (!ownerCode) {
    req.log.error("OWNER_CODE env var is not set");
    res.status(503).json({ error: "Owner login is not configured on this server. Set the OWNER_CODE secret in Replit." });
    return;
  }

  if (code.trim() !== ownerCode.trim()) {
    res.status(401).json({ error: "Incorrect owner code. Please try again." });
    return;
  }

  const token = makeToken("owner");
  res.json({ role: "owner", token });
});

// Verify a token — used by the mobile client on app restart
router.post("/auth/verify", (req, res) => {
  const { token } = req.body as { token?: string };
  if (!token) { res.status(400).json({ error: "token required" }); return; }
  const payload = verifyToken(token);
  if (!payload) { res.status(401).json({ error: "invalid or expired token" }); return; }
  res.json({ role: payload.role });
});

export default router;
