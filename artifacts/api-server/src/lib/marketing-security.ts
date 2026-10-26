import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
export function matchesPassword(candidate: string, expected: string): boolean {
  return timingSafeEqual(Buffer.from(digest(candidate), "hex"), Buffer.from(digest(expected), "hex"));
}
export function fingerprint(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("hex");
}
export function csvCell(value: unknown): string {
  let text = String(value ?? "");
  // Neutralize spreadsheet formulas, including whitespace-prefixed formulas.
  if (/^[\s\u0000-\u001f]*[=+\-@]/u.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}
export function validSaudiWhatsapp(value: string): boolean {
  return /^\+9665[0-9]{8}$/.test(value);
}
export function sameOrigin(origin: string | undefined, host: string | undefined): boolean {
  if (!origin || !host) return false;
  try {
    const url = new URL(origin);
    return ["https:", "http:"].includes(url.protocol) && url.host === host;
  } catch { return false; }
}
