import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, readdirSync } from "node:fs";
import os from "node:os";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8"
};

/** Serve the repo root on a random port. */
export async function startServer() {
  const server = http.createServer(async (req, res) => {
    let pathname = decodeURIComponent((req.url || "/").split("?")[0]);
    if (pathname.endsWith("/")) pathname += "index.html";
    const file = path.join(ROOT, pathname);

    if (!file.startsWith(ROOT)) {
      res.writeHead(403).end("forbidden");
      return;
    }
    try {
      const body = await fs.readFile(file);
      res.writeHead(200, {
        "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream",
        "Cache-Control": "no-store"
      });
      res.end(body);
    } catch {
      try {
        const body = await fs.readFile(path.join(ROOT, "404.html"));
        res.writeHead(404, { "Content-Type": TYPES[".html"] });
        res.end(body);
      } catch {
        res.writeHead(404).end("not found");
      }
    }
  });

  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  return {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise(resolve => server.close(resolve))
  };
}

/** Locate a Chromium binary that playwright-core can drive. */
export function chromiumExecutable() {
  if (process.env.CHROMIUM_PATH && existsSync(process.env.CHROMIUM_PATH)) return process.env.CHROMIUM_PATH;

  const cache = process.env.PLAYWRIGHT_BROWSERS_PATH ||
    (process.platform === "win32"
      ? path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local"), "ms-playwright")
      : path.join(os.homedir(), ".cache", "ms-playwright"));

  const relative = process.platform === "win32"
    ? ["chrome-win64\\chrome.exe", "chrome-win\\chrome.exe", "chrome-headless-shell-win64\\chrome-headless-shell.exe"]
    : ["chrome-linux/chrome", "chrome-linux64/chrome", "chrome-headless-shell-linux64/chrome-headless-shell"];

  if (existsSync(cache)) {
    const dirs = readdirSync(cache).filter(d => d.startsWith("chromium"));
    for (const dir of dirs) {
      for (const rel of relative) {
        const candidate = path.join(cache, dir, rel);
        if (existsSync(candidate)) return candidate;
      }
    }
  }
  return undefined;
}
