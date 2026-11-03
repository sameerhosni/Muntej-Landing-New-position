import { test } from "node:test";
import assert from "node:assert/strict";
import { csvCell, validSaudiWhatsapp, matchesPassword, sameOrigin, allowedMarketingOrigin, digest, fingerprint } from "../src/lib/marketing-security.ts";

test("Saudi WhatsApp accepts only exact Saudi mobile format", () => {
  assert.equal(validSaudiWhatsapp("+966512345678"), true);
  for (const value of ["0512345678", "+966412345678", "+96651234567", "+9665123456789", "+9665abcdefgh", " +966512345678", "966512345678"]) {
    assert.equal(validSaudiWhatsapp(value), false, value);
  }
});
test("password comparison rejects incorrect values and length differences", () => {
  assert.equal(matchesPassword("fixture-only", "fixture-only"), true);
  assert.equal(matchesPassword("fixture-only", "not-the-same"), false);
  assert.equal(matchesPassword("", "fixture-only"), false);
});
test("CSV quotes fields and neutralizes spreadsheet formulas", () => {
  assert.equal(csvCell('a,"b"'), '"a,""b"""');
  assert.equal(csvCell("=SUM(1,2)"), "\"'=SUM(1,2)\"");
  assert.equal(csvCell(" \t@cmd"), "\"' \t@cmd\"");
  assert.equal(csvCell("+966512345678"), "\"'+966512345678\"");
  assert.equal(csvCell(null), '""');
});
test("origin matching rejects external, malformed, absent origins", () => {
  assert.equal(sameOrigin("https://example.test", "example.test"), true);
  assert.equal(sameOrigin("https://evil.test", "example.test"), false);
  assert.equal(sameOrigin("null", "example.test"), false);
  assert.equal(sameOrigin(undefined, "example.test"), false);
  assert.equal(sameOrigin("https://example.test.evil.test", "example.test"), false);
});
test("marketing origin supports the confirmed reverse proxy without trusting other sites", () => {
  const upstream = "muntej-marketing-website.replit.app";
  assert.equal(allowedMarketingOrigin("https://muntej.app", upstream, "same-origin"), true);
  assert.equal(allowedMarketingOrigin(`https://${upstream}`, upstream, "same-origin"), true);
  assert.equal(allowedMarketingOrigin("http://localhost:8080", "localhost:8080", undefined), true);
  for (const origin of [undefined, "null", "http://muntej.app", "https://muntej.app.evil.test", "https://evil.test", "https://muntej.app:444", "https://www.muntej.app"]) {
    assert.equal(allowedMarketingOrigin(origin, upstream, "same-origin"), false, origin);
  }
  assert.equal(allowedMarketingOrigin("https://muntej.app", upstream, "cross-site"), false);
  assert.equal(allowedMarketingOrigin(`https://${upstream}`, upstream, "cross-site"), false);
});
test("session and limit hashes are deterministic and keyed", () => {
  assert.equal(digest("fixture").length, 64);
  assert.notEqual(fingerprint("fixture", "key1"), fingerprint("fixture", "key2"));
});
