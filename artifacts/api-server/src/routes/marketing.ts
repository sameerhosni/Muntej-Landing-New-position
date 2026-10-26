import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import cookieParser from "cookie-parser";
import { randomBytes } from "node:crypto";
import { desc, eq, and, gt, lt } from "drizzle-orm";
import { db, pool, earlyAccessLeads, leadNotifications, marketingEvents, adminSessions, requestLimits } from "@workspace/db";
import { JoinEarlyAccessBody, AdminLoginBody, TrackEventBody, GetAdminLeadsResponse } from "@workspace/api-zod";
import { csvCell, digest, fingerprint, matchesPassword, sameOrigin } from "../lib/marketing-security";

const router: IRouter = Router();
const cookieName = "muntej_admin";
const sessionDuration = 8 * 60 * 60 * 1000;
router.use(cookieParser());
router.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "no-store");
  next();
});

function originGuard(req: Request, res: Response, next: NextFunction): void {
  const forwarded = req.get("x-forwarded-host")?.split(",")[0]?.trim();
  if (!sameOrigin(req.get("origin"), forwarded || req.get("host")) || req.get("sec-fetch-site") === "cross-site") {
    res.status(403).json({ error: "forbidden_origin" }); return;
  }
  next();
}

function limit(scope: string, max: number, windowSeconds: number) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const secret = process.env.SESSION_SECRET;
    if (!secret) { res.status(503).json({ error: "configuration_missing" }); return; }
    const key = scope + ":" + fingerprint(req.ip ?? req.socket.remoteAddress ?? "unknown", secret);
    const result = await pool.query<{ count: number }>(
      `INSERT INTO request_limits (key,count,expires_at) VALUES ($1,1,NOW()+$2*INTERVAL '1 second')
       ON CONFLICT (key) DO UPDATE SET
       count=CASE WHEN request_limits.expires_at<NOW() THEN 1 ELSE request_limits.count+1 END,
       expires_at=CASE WHEN request_limits.expires_at<NOW() THEN NOW()+$2*INTERVAL '1 second' ELSE request_limits.expires_at END
       RETURNING count`, [key, windowSeconds]);
    if (result.rows[0]!.count > max) {
      res.setHeader("Retry-After", String(windowSeconds));
      res.status(429).json({ error: "rate_limited" }); return;
    }
    next();
  };
}

async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.SESSION_SECRET;
  const token: unknown = req.cookies?.[cookieName];
  if (!password || !secret) { res.status(503).json({ error: "configuration_missing" }); return; }
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) {
    res.status(401).json({ error: "unauthorized" }); return;
  }
  const [session] = await db.select().from(adminSessions).where(and(
    eq(adminSessions.tokenHash, digest(token)), gt(adminSessions.expiresAt, new Date()),
    eq(adminSessions.passwordFingerprint, fingerprint(password, secret))));
  if (!session) { res.status(401).json({ error: "unauthorized" }); return; }
  next();
}

router.post("/early-access", originGuard, limit("lead", 5, 900), async (req, res): Promise<void> => {
  const body = req.body && typeof req.body === "object" ? { ...req.body } : {};
  for (const key of ["name", "company", "role", "whatsapp"]) {
    if (typeof body[key] === "string") body[key] = body[key].trim();
  }
  const parsed = JoinEarlyAccessBody.safeParse(body);
  if (!parsed.success || parsed.data.website) {
    res.status(400).json({ error: "invalid_input" }); return;
  }
  const { website: _website, ...lead } = parsed.data;
  // Historical columns remain for existing admin exports. Blank means not supplied;
  // never invent a role or team size for the simplified contact form.
  await db.transaction(async (tx) => {
    const [saved] = await tx.insert(earlyAccessLeads)
      .values({ ...lead, role: lead.role ?? "", teamSize: lead.teamSize ?? "" }).returning({ id: earlyAccessLeads.id });
    await tx.insert(leadNotifications).values({ leadId: saved!.id });
  });
  res.status(201).json({ ok: true });
});

router.post("/admin/login", originGuard, limit("login", 5, 900), async (req, res): Promise<void> => {
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.SESSION_SECRET;
  if (!password || !secret) { res.status(503).json({ error: "configuration_missing" }); return; }
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success || !matchesPassword(parsed.data.password, password)) {
    res.status(401).json({ error: "unauthorized" }); return;
  }
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + sessionDuration);
  await db.delete(adminSessions).where(lt(adminSessions.expiresAt, new Date()));
  await db.delete(requestLimits).where(lt(requestLimits.expiresAt, new Date()));
  await db.insert(adminSessions).values({ tokenHash: digest(token), passwordFingerprint: fingerprint(password, secret), expiresAt });
  res.cookie(cookieName, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production" || req.secure || req.get("x-forwarded-proto") === "https",
    sameSite: "strict", path: "/api/admin", maxAge: sessionDuration,
  });
  res.json({ ok: true });
});

router.post("/admin/logout", originGuard, requireAdmin, async (req, res): Promise<void> => {
  await db.delete(adminSessions).where(eq(adminSessions.tokenHash, digest(req.cookies[cookieName])));
  res.clearCookie(cookieName, { path: "/api/admin", httpOnly: true, sameSite: "strict" });
  res.json({ ok: true });
});

router.get("/admin/leads", requireAdmin, async (_req, res): Promise<void> => {
  const leads = await db.select().from(earlyAccessLeads).orderBy(desc(earlyAccessLeads.createdAt)).limit(1000);
  res.json(GetAdminLeadsResponse.parse(leads.map((lead) => ({
    ...lead,
    role: lead.role || undefined,
    teamSize: lead.teamSize || undefined,
    createdAt: lead.createdAt.toISOString(),
  }))));
});

router.get("/admin/leads.csv", requireAdmin, async (_req, res): Promise<void> => {
  const fields = ["id", "name", "company", "role", "teamSize", "whatsapp", "language", "utmSource", "utmMedium", "utmCampaign", "createdAt"] as const;
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="muntej-early-access-leads.csv"');
  res.write("\uFEFF" + fields.join(",") + "\r\n");
  // Keyset paging keeps large exports bounded in memory.
  let after = 0;
  for (;;) {
    const page = await db.select().from(earlyAccessLeads).where(gt(earlyAccessLeads.id, after)).orderBy(earlyAccessLeads.id).limit(500);
    if (!page.length) break;
    for (const lead of page) {
      res.write(fields.map((key) => csvCell(key === "createdAt" ? lead.createdAt.toISOString() : lead[key])).join(",") + "\r\n");
    }
    after = page[page.length - 1]!.id;
  }
  res.end();
});

router.post("/events", originGuard, limit("events", 120, 300), async (req, res): Promise<void> => {
  const parsed = TrackEventBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "invalid_input" }); return; }
  await db.insert(marketingEvents).values(parsed.data);
  res.json({ ok: true });
});

export default router;
