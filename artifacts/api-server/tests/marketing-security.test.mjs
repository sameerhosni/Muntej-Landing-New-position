import { test } from "node:test";
import assert from "node:assert/strict";
import { csvCell, validSaudiWhatsapp, matchesPassword, sameOrigin, digest, fingerprint } from "../src/lib/marketing-security.ts";

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
test("session and limit hashes are deterministic and keyed", () => {
  assert.equal(digest("fixture").length, 64);
  assert.notEqual(fingerprint("fixture", "key1"), fingerprint("fixture", "key2"));
});
