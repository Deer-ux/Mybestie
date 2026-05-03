import { Router } from "express";
import crypto from "crypto";

const router = Router();

// Simple HMAC-signed token — no DB needed, stateless
const TOKEN_SECRET = process.env["SESSION_SECRET"] ?? "mindbridge-dev-secret";

function makeToken(role: string, email: string): string {
  const payload = JSON.stringify({ role, email, iat: Date.now() });
  const b64 = Buffer.from(payload).toString("base64url");
  const sig = crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(b64)
    .digest("base64url");
  return `${b64}.${sig}`;
}

export function verifyToken(token: string): { role: string; email: string } | null {
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

router.post("/auth/admin-login", (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }

  const adminEmail = process.env["ADMIN_EMAIL"];
  const adminPassword = process.env["ADMIN_PASSWORD"];

  if (!adminEmail || !adminPassword) {
    req.log.error("ADMIN_EMAIL or ADMIN_PASSWORD env vars are not set");
    res.status(503).json({ error: "Admin login is not configured on this server." });
    return;
  }

  const emailMatch = email.trim().toLowerCase() === adminEmail.trim().toLowerCase();
  const passMatch  = password === adminPassword;

  if (!emailMatch || !passMatch) {
    res.status(401).json({ error: "Incorrect email or password." });
    return;
  }

  const token = makeToken("owner", email.trim().toLowerCase());
  res.json({ role: "owner", token });
});

// Verify a token — used by the mobile client to re-validate on app restart
router.post("/auth/verify", (req, res) => {
  const { token } = req.body as { token?: string };
  if (!token) { res.status(400).json({ error: "token required" }); return; }
  const payload = verifyToken(token);
  if (!payload) { res.status(401).json({ error: "invalid or expired token" }); return; }
  res.json({ role: payload.role, email: payload.email });
});

export default router;
