// cache-fix: v2 - 404 for missing assets, no-store for HTML
import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  // Guard for /assets/* requests: if the hashed file no longer exists, return a
  // real 404 instead of falling through to index.html. This prevents browsers
  // from receiving HTML when they request a stale JS/CSS bundle from cache,
  // which would cause a JS parse error (NotFoundError: insertBefore).
  app.use("/assets", (req, res, next) => {
    const assetPath = path.join(distPath, "assets", req.path);
    if (!fs.existsSync(assetPath)) {
      res.status(404).set("Cache-Control", "no-store").end("Asset not found");
      return;
    }
    // Hashed assets are immutable — safe to cache for 1 year
    res.set("Cache-Control", "public, max-age=31536000, immutable");
    next();
  });

  // Serve static files; HTML files must never be cached so the browser always
  // fetches the latest index.html (which references the current hashed bundle)
  app.use(
    express.static(distPath, {
      setHeaders(res, filePath) {
        if (filePath.endsWith(".html")) {
          res.set("Cache-Control", "no-cache, no-store, must-revalidate");
          res.set("Pragma", "no-cache");
          res.set("Expires", "0");
        }
      },
    })
  );

  // SPA fallback: serve index.html for navigation routes only.
  // For any request that looks like a static asset (has a file extension),
  // return 404 — never serve HTML in place of a missing JS/CSS/font file.
  const indexHtml = path.resolve(distPath, "index.html");
  app.use((req, res) => {
    const ext = path.extname(req.path);
    if (ext && ext !== ".html") {
      res.status(404).set("Cache-Control", "no-store").end("Not found");
      return;
    }
    res
      .set("Cache-Control", "no-cache, no-store, must-revalidate")
      .set("Pragma", "no-cache")
      .set("Expires", "0")
      .sendFile(indexHtml, (err) => {
        if (err) {
          console.error("[SPA fallback] Failed to serve index.html:", err.message, "| path:", indexHtml);
          res.status(500).end("Server error");
        }
      });
  });
}
