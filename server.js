import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getProvider, listProviders } from "./src/providers/index.js";
import { ProviderStop } from "./src/providers/grok-bot.js";

const HOST = "127.0.0.1";
const PORT = Number(process.env.PORT || 4173);
const root = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(root, "public");
const provider = getProvider("grok-bot");
provider.setSessionOptions({ skipElectronLaunch: true, windowMode: "desktop" });

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

const allowedHosts = new Set([`${HOST}:${PORT}`, `localhost:${PORT}`]);
const allowedOrigins = new Set([...allowedHosts].map((host) => `http://${host}`));

// Only this page may use the office. Other websites (and DNS-rebinding tricks) are refused,
// so nothing outside the office can launch Grok Bot or message your agents.
function isTrusted(request, url) {
  if (!allowedHosts.has(request.headers.host ?? "")) return false;
  if (!url.pathname.startsWith("/api/")) return true;
  const origin = request.headers.origin;
  if (origin && !allowedOrigins.has(origin)) return false;
  const site = request.headers["sec-fetch-site"];
  if (site && site !== "same-origin" && site !== "none") return false;
  return request.method !== "POST" || String(request.headers["content-type"] ?? "").startsWith("application/json");
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://${HOST}:${PORT}`);
    if (!isTrusted(request, url)) {
      return sendJson(response, 403, { ok: false, error: "Only the office page on this computer can do that.", logs: [] });
    }
    if (request.method === "GET" && url.pathname === "/api/status") {
      const status = await provider.status();
      return sendJson(response, 200, { ...status, providers: listProviders() });
    }
    if (request.method === "GET" && url.pathname === "/api/bots") {
      const result = await provider.listBots();
      return sendJson(response, 200, result);
    }
    if (request.method === "POST" && url.pathname === "/api/chat") {
      const body = await readJson(request);
      const botId = typeof body.botId === "string" ? body.botId.trim() : "";
      const text = typeof body.text === "string" ? body.text.trim() : "";
      const selected = getProvider(typeof body.provider === "string" ? body.provider : "grok-bot");
      if (!botId || !text) {
        return sendJson(response, 400, { ok: false, error: "Choose a bot and enter a message.", logs: [] });
      }
      if (text.length > 8_000) {
        return sendJson(response, 400, { ok: false, error: "Message is too long for this proof.", logs: [] });
      }
      const result = await selected.sendMessage({ botId, text });
      return sendJson(response, 200, result);
    }
    if (request.method === "POST" && url.pathname === "/api/release") {
      const result = await provider.release();
      return sendJson(response, 200, result);
    }
    if (request.method === "GET") return serveStatic(url.pathname, response);
    sendJson(response, 405, { ok: false, error: "Method not allowed.", logs: [] });
  } catch (error) {
    if (error instanceof ProviderStop) {
      const status = error.code === "login" || error.code === "captcha" || error.code === "already-running" ? 409 : 422;
      return sendJson(response, status, { ok: false, error: error.message, code: error.code, logs: error.logs });
    }
    console.error(error);
    sendJson(response, 500, {
      ok: false,
      error: error instanceof Error ? error.message : "Request failed.",
      logs: [],
    });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`The Branch is running at http://${HOST}:${PORT}`);
  console.log("Keep this window open while you use the office. Close it (or press Ctrl+C) to stop.");
});

let shuttingDown = false;

function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  server.close();
  provider.close().finally(() => process.exit(0));
}

// On Windows, closing the terminal window sends SIGHUP and Ctrl+Break sends SIGBREAK.
// Without these, the hidden Grok Bot outlives the server and blocks the next launch.
for (const signal of ["SIGINT", "SIGTERM", "SIGHUP", "SIGBREAK"]) {
  process.on(signal, shutdown);
}

function sendJson(response, status, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
  });
  response.end(body);
}

function serveStatic(pathname, response) {
  const requested = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.normalize(path.join(publicDir, requested));
  const relative = path.relative(publicDir, filePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    response.writeHead(403);
    response.end();
    return;
  }
  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404);
      response.end();
      return;
    }
    response.writeHead(200, {
      "Content-Type": types[path.extname(filePath)] ?? "application/octet-stream",
      "Cache-Control": "no-store",
    });
    response.end(data);
  });
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > 32_000) {
        reject(new Error("Request body is too large."));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("Request body is not JSON."));
      }
    });
    request.on("error", reject);
  });
}
