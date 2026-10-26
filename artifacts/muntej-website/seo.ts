import { translations, type Lang } from "./src/translations";

// Deliberately not a claimed production address. Set VITE_SITE_ORIGIN before publishing.
export const placeholderOrigin = "https://todo-site-origin.invalid";
export function siteOrigin(): string {
  const value = process.env.VITE_SITE_ORIGIN || placeholderOrigin;
  const url = new URL(value);
  if (url.protocol !== "https:" || url.pathname !== "/" || url.search || url.hash || url.username || url.password) {
    throw new Error("VITE_SITE_ORIGIN must be an HTTPS origin without a path, credentials or query.");
  }
  return url.origin;
}
export const publicRoutes = ["/", "/en", "/privacy", "/en/privacy"] as const;
export const knownRoutes = [...publicRoutes, "/admin/leads"];
const escape = (value: string) => value.replace(/[&"<>]/g, (v) => ({ "&": "&amp;", '"': "&quot;", "<": "&lt;", ">": "&gt;" }[v]!));

export function localizedHtml(html: string, path: string): string {
  const lang: Lang = path.startsWith("/en") ? "en" : "ar";
  const t = translations[lang];
  const privacy = path.endsWith("/privacy");
  const admin = path.startsWith("/admin/");
  const known = (knownRoutes as readonly string[]).includes(path);
  const title = privacy ? t.seo.privacyTitle : admin ? t.seo.adminTitle : t.seo.title;
  const description = privacy ? t.meta.privacyDescription : t.seo.description;
  const origin = siteOrigin();
  const index = !privacy && !admin && known && origin !== placeholderOrigin;
  const arPath = privacy ? "/privacy" : "/";
  const enPath = privacy ? "/en/privacy" : "/en";
  const tags = [
    `<title>${escape(title)}</title>`,
    `<meta name="description" content="${escape(description)}">`,
    `<meta name="robots" content="${index ? "index, follow" : "noindex, nofollow"}">`,
    `<meta property="og:title" content="${escape(privacy || admin ? title : t.seo.ogTitle)}">`,
    `<meta property="og:description" content="${escape(privacy ? description : t.seo.ogDescription)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:locale" content="${lang === "ar" ? "ar_SA" : "en_US"}">`,
    `<meta property="og:locale:alternate" content="${lang === "ar" ? "en_US" : "ar_SA"}">`,
    `<meta property="og:image" content="${origin}/og-image.png">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:image:alt" content="${escape(translations.en.seo.ogTitle)}">`,
    `<meta property="og:url" content="${origin}${known ? path : "/"}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escape(privacy || admin ? title : t.seo.ogTitle)}">`,
    `<meta name="twitter:description" content="${escape(description)}">`,
    `<meta name="twitter:image" content="${origin}/og-image.png">`,
    ...(known && !admin ? [
      `<link rel="canonical" href="${origin}${path}">`,
      `<link rel="alternate" hreflang="ar" href="${origin}${arPath}">`,
      `<link rel="alternate" hreflang="en" href="${origin}${enPath}">`,
      `<link rel="alternate" hreflang="x-default" href="${origin}${arPath}">`,
    ] : []),
  ].join("\n    ");
  return html.replace(/<html[^>]*>/, `<html lang="${lang}" dir="${lang === "ar" ? "rtl" : "ltr"}">`)
    .replace(/<!--MUNTEJ_META_START-->[\s\S]*?<!--MUNTEJ_META_END-->/,
      `<!--MUNTEJ_META_START-->\n    ${tags}\n    <!--MUNTEJ_META_END-->`);
}
export function sitemap(): string {
  const origin = siteOrigin();
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${["/", "/en"].map(path =>
    `<url><loc>${origin}${path}</loc><xhtml:link rel="alternate" hreflang="ar" href="${origin}/"/><xhtml:link rel="alternate" hreflang="en" href="${origin}/en"/></url>`).join("")}</urlset>`;
}
export function robots(): string {
  const origin = siteOrigin();
  return origin === placeholderOrigin ? "User-agent: *\nDisallow: /\n" :
    `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nDisallow: /privacy\nDisallow: /en/privacy\nSitemap: ${origin}/sitemap.xml\n`;
}
