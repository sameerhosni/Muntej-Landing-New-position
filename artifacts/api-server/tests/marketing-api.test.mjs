import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { fingerprint } from "../src/lib/marketing-security.ts";
import { buildLeadEmail } from "../src/lib/lead-notifications.ts";

// Test-process-only fixtures. Never inspect or use the user's configured secrets.
process.env.ADMIN_PASSWORD = "test-fixture-password-only";
process.env.SESSION_SECRET = "test-fixture-session-key-only";
process.env.LOG_LEVEL = "silent";
const { default: app } = await import("../src/app.ts");
const { pool } = await import("@workspace/db");
const marker = `MUNTEJ_TEST_${Date.now()}`;
const address = "192.0.2.99";
const shortFormAddress = "192.0.2.100";
const headers = { Host: "fixture.test", Origin: "https://fixture.test", "X-Forwarded-For": address };
const lead = {
  name: marker, company: "Test fixture company", role: "Operations",
  teamSize: "6-15", whatsapp: "+966500000000", language: "ar",
  utmSource: "test", utmMedium: "test", utmCampaign: marker,
};

test("marketing API: persistence, validation, admin gate, export, logout, analytics", async (t) => {
  try {
    await t.test("rejects unauthorized lead and CSV reads", async () => {
      assert.equal((await request(app).get("/api/admin/leads").set(headers)).status, 401);
      assert.equal((await request(app).get("/api/admin/leads.csv").set(headers)).status, 401);
    });
    await t.test("blocks cross-origin requests and invalid Saudi numbers", async () => {
      assert.equal((await request(app).post("/api/early-access").set({ ...headers, Origin: "https://evil.test" }).send(lead)).status, 403);
      assert.equal((await request(app).post("/api/early-access").set(headers).send({ ...lead, whatsapp: "0512345678" })).status, 400);
      assert.equal((await request(app).post("/api/early-access").set(headers).send({ ...lead, name: "  " })).status, 400);
    });
    await t.test("stores both languages, first-touch UTMs and server timestamps", async () => {
      for (const language of ["ar", "en"]) {
        const result = await request(app).post("/api/early-access").set(headers).send({ ...lead, language });
        assert.equal(result.status, 201);
        assert.deepEqual(result.body, { ok: true });
      }
      const { rows } = await pool.query("SELECT language,utm_source,utm_medium,utm_campaign,created_at FROM early_access_leads WHERE name=$1 ORDER BY id", [marker]);
      assert.deepEqual(rows.map(r => r.language), ["ar", "en"]);
      assert.ok(rows.every(r => r.utm_campaign === marker && r.utm_source === "test" && r.utm_medium === "test" && r.created_at instanceof Date));
    });
    await t.test("short contact form persists without inventing role or team size", async () => {
      const { role: _role, teamSize: _teamSize, ...shortLead } = lead;
      const result = await request(app).post("/api/early-access")
        .set({ ...headers, "X-Forwarded-For": shortFormAddress })
        .send({ ...shortLead, language: "en" });
      assert.equal(result.status, 201);
      const { rows } = await pool.query(
        "SELECT role,team_size,whatsapp,utm_campaign FROM early_access_leads WHERE name=$1 ORDER BY id DESC LIMIT 1", [marker]);
      assert.equal(rows[0].role, "");
      assert.equal(rows[0].team_size, "");
      assert.equal(rows[0].whatsapp, lead.whatsapp);
      assert.equal(rows[0].utm_campaign, marker);
      const queued = await pool.query(
        `SELECT n.status FROM lead_notifications n JOIN early_access_leads l ON l.id=n.lead_id
         WHERE l.name=$1 ORDER BY l.id DESC LIMIT 1`, [marker]);
      assert.equal(queued.rows[0].status, "pending");
      const raw = buildLeadEmail({
        ...lead, id: 123, createdAt: new Date("2026-10-26T10:00:00Z"),
        utmSource: "fixture", utmMedium: "", utmCampaign: marker,
      });
      assert.match(raw, /^To: sales@muntej\.app\r\n/);
      assert.match(raw, /Message-ID: <muntej-lead-123@muntej\.app>/);
      const decodedBody = Buffer.from(raw.split("\r\n\r\n")[1].replace(/\r\n/g, ""), "base64").toString("utf8");
      assert.ok(decodedBody.includes(marker));
      assert.ok(decodedBody.includes(lead.whatsapp));
    });
    await t.test("authenticated session can list/export; logout revokes session", async () => {
      assert.equal((await request(app).post("/api/admin/login").set(headers).send({ password: "incorrect-fixture" })).status, 401);
      const login = await request(app).post("/api/admin/login").set(headers).send({ password: "test-fixture-password-only" });
      assert.equal(login.status, 200);
      const cookie = login.headers["set-cookie"][0];
      assert.match(cookie, /HttpOnly/);
      assert.match(cookie, /SameSite=Strict/);
      assert.match(cookie, /Path=\/api\/admin/);
      const cookieHeader = cookie.split(";")[0];
      const listed = await request(app).get("/api/admin/leads").set(headers).set("Cookie", cookieHeader);
      assert.equal(listed.status, 200);
      assert.equal(listed.body.filter(r => r.name === marker).length, 3);
      const csv = await request(app).get("/api/admin/leads.csv").set(headers).set("Cookie", cookieHeader);
      assert.equal(csv.status, 200);
      assert.match(csv.headers["content-type"], /text\/csv/);
      assert.ok(csv.text.includes(marker));
      assert.ok(csv.text.includes("'+966500000000"));
      assert.equal((await request(app).post("/api/admin/logout").set(headers).set("Cookie", cookieHeader)).status, 200);
      assert.equal((await request(app).get("/api/admin/leads").set(headers).set("Cookie", cookieHeader)).status, 401);
    });
    await t.test("records exactly the five requested event names", async () => {
      for (const event of ["cta_join_click", "form_submit_success", "whatsapp_click", "language_switch", "demo_view"]) {
        assert.equal((await request(app).post("/api/events").set(headers).send({ event, language: "ar", section: "hero", utmCampaign: marker })).status, 200);
      }
      assert.equal((await request(app).post("/api/events").set(headers).send({ event: "not_allowed", language: "ar" })).status, 400);
      const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM marketing_events WHERE utm_campaign=$1", [marker]);
      assert.equal(rows[0].count, 5);
    });
    await t.test("rate limits lead submissions", async () => {
      const result = await request(app).post("/api/early-access").set(headers).send(lead);
      assert.equal(result.status, 201); // fifth allowed request
      const blocked = await request(app).post("/api/early-access").set(headers).send(lead);
      assert.equal(blocked.status, 429);
    });
  } finally {
    await pool.query("DELETE FROM early_access_leads WHERE name=$1", [marker]);
    await pool.query("DELETE FROM marketing_events WHERE utm_campaign=$1", [marker]);
    for (const scope of ["lead", "login", "events"]) {
      await pool.query("DELETE FROM request_limits WHERE key=$1", [scope + ":" + fingerprint(address, "test-fixture-session-key-only")]);
    }
    await pool.query("DELETE FROM request_limits WHERE key=$1", ["lead:" + fingerprint(shortFormAddress, "test-fixture-session-key-only")]);
    await pool.end();
  }
});
