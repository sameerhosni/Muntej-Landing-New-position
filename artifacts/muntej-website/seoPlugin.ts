import fs from "node:fs/promises";
import path from "node:path";
import type { Plugin, ViteDevServer, PreviewServer } from "vite";
import { knownRoutes, localizedHtml, robots, sitemap } from "./seo";

export default function seoPlugin(): Plugin {
  function attach(server: ViteDevServer | PreviewServer, preview: boolean) {
    server.middlewares.use(async (req, res, next) => {
      const url = new URL(req.url || "/", "http://local.test");
      const route = url.pathname.replace(/\/$/, "") || "/";
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
      res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
      if (route === "/sitemap.xml" || route === "/robots.txt") {
        res.setHeader("Content-Type", route === "/sitemap.xml" ? "application/xml" : "text/plain");
        res.end(route === "/sitemap.xml" ? sitemap() : robots()); return;
      }
      if (url.pathname !== route && route !== "/") {
        res.statusCode = 308;
        res.setHeader("Location", route + url.search); res.end(); return;
      }
      if (preview && (knownRoutes as readonly string[]).includes(route)) {
        const html = await fs.readFile(path.join(import.meta.dirname, "dist/public/index.html"), "utf8");
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache");
        res.end(localizedHtml(html, route)); return;
      }
      if (route.startsWith("/admin")) res.setHeader("X-Robots-Tag", "noindex, nofollow");
      next();
    });
  }
  return {
    name: "muntej-localized-seo",
    enforce: "post",
    configureServer(server) { attach(server, false); },
    configurePreviewServer(server) { attach(server, true); },
    transformIndexHtml: {
      order: "post",
      handler(html, ctx) {
        const route = new URL(ctx.originalUrl || ctx.path || "/", "http://local.test").pathname.replace(/\/$/, "") || "/";
        return localizedHtml(html, route === "/index.html" ? "/" : route);
      },
    },
    async writeBundle(options) {
      const dir = options.dir!;
      const html = await fs.readFile(path.join(dir, "index.html"), "utf8");
      for (const route of knownRoutes.filter(r => r !== "/")) {
        const dest = path.join(dir, route.slice(1), "index.html");
        await fs.mkdir(path.dirname(dest), { recursive: true });
        await fs.writeFile(dest, localizedHtml(html, route));
      }
      await fs.writeFile(path.join(dir, "404.html"), localizedHtml(html, "/404"));
      await fs.writeFile(path.join(dir, "sitemap.xml"), sitemap());
      await fs.writeFile(path.join(dir, "robots.txt"), robots());
    },
  };
}
