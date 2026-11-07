import test from "node:test";
import assert from "node:assert/strict";
import {
  buildLeadEmail, leadEmailConfiguration, LeadEmailError, sendResendLeadEmail,
} from "../src/lib/lead-email.ts";

const lead = {
  id: 42, name: "اختبار", company: "Diagnostic fixture", whatsapp: "+966500000000",
  language: "ar", role: "", teamSize: "", createdAt: new Date("2026-11-02T10:00:00Z"),
  utmSource: "fixture", utmMedium: null, utmCampaign: null,
};
const config = { provider: "resend", apiKey: "fixture-not-a-real-key", from: "requests@example.com" };

test("Replit Gmail compatibility and explicit provider selection", () => {
  assert.deepEqual(leadEmailConfiguration({}), { provider: "gmail" });
  assert.deepEqual(leadEmailConfiguration({ EMAIL_PROVIDER: "gmail" }), { provider: "gmail" });
  assert.deepEqual(leadEmailConfiguration({
    EMAIL_PROVIDER: "resend", RESEND_API_KEY: config.apiKey, RESEND_FROM: config.from,
  }), config);
});

test("Railway defaults to standalone Resend and requires configuration before claiming", () => {
  assert.throws(() => leadEmailConfiguration({ RAILWAY_SERVICE_ID: "fixture" }),
    { category: "resend_configuration_missing" });
  for (const env of [
    { EMAIL_PROVIDER: "resend" },
    { EMAIL_PROVIDER: "resend", RESEND_API_KEY: "fixture" },
    { EMAIL_PROVIDER: "unsupported" },
    { EMAIL_PROVIDER: "resend", RESEND_API_KEY: "fixture", RESEND_FROM: "bad\r\nBcc:x@example.com" },
  ]) assert.throws(() => leadEmailConfiguration(env), LeadEmailError);
});

test("Resend HTTPS payload preserves bilingual details, recipient and stable idempotency", async () => {
  const calls = [];
  const request = async (url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify({ id: "fixture-provider-id" }), { status: 200 });
  };
  assert.equal(await sendResendLeadEmail(lead, config, request), "fixture-provider-id");
  await sendResendLeadEmail(lead, config, request);
  const { url, init } = calls[0];
  assert.equal(url, "https://api.resend.com/emails");
  assert.equal(init.method, "POST");
  assert.equal(init.headers.Authorization, `Bearer ${config.apiKey}`);
  assert.equal(init.headers["Idempotency-Key"], calls[1].init.headers["Idempotency-Key"]);
  const body = JSON.parse(init.body);
  assert.equal(body.from, config.from);
  assert.deepEqual(body.to, ["sales@muntej.app"]);
  assert.match(body.text, /اختبار/);
  assert.match(body.text, /UTM source: fixture/);
  assert.equal(body.headers["Message-ID"], "<muntej-lead-42@muntej.app>");
  assert.ok(init.signal instanceof AbortSignal);
});

test("rejections expose safe status only, never provider response body", async () => {
  for (const status of [401, 403, 422, 429, 500]) {
    await assert.rejects(
      sendResendLeadEmail(lead, config, async () => new Response("sensitive provider body", { status })),
      error => error.category === "provider_rejected" && error.status === status &&
        !error.message.includes("sensitive"),
    );
  }
});

test("network failure or missing confirmation never counts as success or retries", async () => {
  let calls = 0;
  await assert.rejects(sendResendLeadEmail(lead, config, async () => {
    calls++;
    throw new Error("network error containing credentials");
  }), { category: "provider_network_or_timeout" });
  assert.equal(calls, 1);
  for (const body of ["not-json", "{}", '{"id":1}']) {
    await assert.rejects(sendResendLeadEmail(lead, config, async () => new Response(body)),
      { category: "provider_confirmation_missing" });
  }
});

test("Gmail MIME format remains compatible", () => {
  const raw = buildLeadEmail(lead);
  assert.match(raw, /^To: sales@muntej\.app\r\n/);
  assert.match(raw, /Message-ID: <muntej-lead-42@muntej\.app>/);
  const text = Buffer.from(raw.split("\r\n\r\n")[1].replace(/\r\n/g, ""), "base64").toString("utf8");
  assert.match(text, /اختبار/);
});
