import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
const root = path.resolve(import.meta.dirname, "../..");
// Load the website's single copy source at runtime; do not add a cross-artifact TS project reference.
const { translations } = await import(path.join(root, "artifacts/muntej-website/src/translations.ts"));
const out = path.join(root, "artifacts/muntej-website/public/og-image.png");
const logo = await sharp(path.join(root, "artifacts/muntej-website/public/brand/logo.png")).resize({ width: 230 }).png().toBuffer();
const esc = (v: string) => v.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
const promise = (translations.en.hero.title as string).split(". ").map((v: string) => v.replace(/\.$/, ""));
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
<rect width="1200" height="630" fill="#F5F6FA"/><circle cx="1050" cy="90" r="230" fill="#5B5CFF" opacity=".08"/>
<circle cx="1160" cy="610" r="340" fill="#C13CFF" opacity=".06"/>
<rect x="70" y="190" width="56" height="7" rx="3" fill="#5B5CFF"/>
<g font-family="DejaVu Sans,sans-serif" font-weight="700" font-size="65"><text x="70" y="305" fill="#111827">${esc(promise[0] || translations.en.hero.title)}</text><text x="70" y="395" fill="#3D3ED6">${esc(promise[1] || "")}.</text></g>
<text x="70" y="505" fill="#4B5563" font-family="DejaVu Sans,sans-serif" font-size="25">${esc(translations.en.hero.badge)}</text>
<rect x="70" y="560" width="1060" height="2" fill="#E1E4EE"/></svg>`;
await fs.mkdir(path.dirname(out), { recursive: true });
await sharp(Buffer.from(svg)).composite([{ input: logo, left: 70, top: 70 }]).png().toFile(out);
console.info("Generated Muntej OG image: 1200 × 630.");
