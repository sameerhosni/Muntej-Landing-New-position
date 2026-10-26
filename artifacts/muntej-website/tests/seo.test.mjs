import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { translations } from "../src/translations.ts";

const dir = path.resolve(import.meta.dirname, "../dist/public");
for (const [file, lang] of [["index.html", "ar"], ["en/index.html", "en"], ["privacy/index.html", "ar"], ["en/privacy/index.html", "en"]]) {
  test(`${file} ships localized crawler-visible metadata and allows zoom`, () => {
    const html = fs.readFileSync(path.join(dir, file), "utf8");
    assert.ok(html.includes(`lang="${lang}"`));
    assert.ok(html.includes(`dir="${lang === "ar" ? "rtl" : "ltr"}"`));
    assert.ok(html.includes("hreflang=\"ar\""));
    assert.ok(html.includes("hreflang=\"en\""));
    assert.ok(html.includes(file.includes("privacy") ? translations[lang].seo.privacyTitle : translations[lang].seo.title));
    assert.ok(html.includes('og:image:width" content="1200'));
    assert.ok(html.includes('og:image:height" content="630'));
    assert.ok(!html.includes("maximum-scale"));
    assert.ok(!html.includes("user-scalable=no"));
  });
}
test("protected admin route is noindex", () => {
  assert.ok(fs.readFileSync(path.join(dir, "admin/leads/index.html"), "utf8").includes("noindex, nofollow"));
});
test("launch placeholder prevents indexing and sitemap lists both languages", () => {
  const html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
  if (html.includes(".invalid")) {
    assert.ok(html.includes('name="robots" content="noindex, nofollow"'));
    assert.ok(fs.readFileSync(path.join(dir, "robots.txt"), "utf8").includes("Disallow: /"));
  }
  const sitemap = fs.readFileSync(path.join(dir, "sitemap.xml"), "utf8");
  assert.ok(sitemap.includes('hreflang="ar"'));
  assert.ok(sitemap.includes('hreflang="en"'));
  assert.ok(!sitemap.includes("/admin"));
});
test("translations preserve product surface in each language", () => {
  for (const t of Object.values(translations)) {
    assert.equal(t.faq.items.length, 6);
    assert.equal(t.how.steps.length, 4);
    assert.equal(t.promise.items.length, 3);
    assert.equal(t.values.items.length, 4);
    assert.equal(t.showcase.items.length, 8);
    for (const lang of ["ar", "en"]) {
      for (const screen of t.showcase.items) {
        assert.ok(fs.existsSync(new URL(`../public/screens/muntej-${screen.key}-${lang}.webp`, import.meta.url)));
      }
    }
    assert.equal(t.day.items.length, 6);
    assert.equal(t.channels.items.length, 5);
    assert.ok(t.channels.items.every((item) => item.kind === "available"));
    for (const tool of ["Gmail", "Google Chat", "Google Meet"]) {
      assert.ok(t.channels.items.some((item) => item.title === tool));
    }
    const valueTitles = new Set(t.values.items.map((item) => item.title));
    assert.ok(t.differentiators.items.every((item) => !valueTitles.has(item.title)));
    assert.ok(!JSON.stringify(t).includes("Coming soon to WhatsApp"));
    assert.ok(!JSON.stringify(t).includes("لم تُطلق بعد"));
    assert.ok(!JSON.stringify(t).includes("TODO"));
  }
});
