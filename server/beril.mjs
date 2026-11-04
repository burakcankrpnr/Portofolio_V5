import http from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { getModel, hasApiKey, translateBatch } from "./beril-core.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "..", ".env") });

const PORT = Number(process.env.BERIL_PORT || 3001);

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/beril/health") {
    json(res, 200, { ok: hasApiKey(), model: getModel() });
    return;
  }

  if (req.method === "POST" && url.pathname === "/beril/translate") {
    try {
      const body = await readBody(req);
      const pages = Array.isArray(body.pages) ? body.pages.map((p) => String(p ?? "")) : null;
      const result = await translateBatch(pages, body.title);
      json(res, 200, result);
    } catch (error) {
      const status = error.status || error.statusCode || 500;
      json(res, status, { error: error.message || "Çeviri başarısız" });
    }
    return;
  }

  json(res, 404, { error: "Not found" });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[beril] http://127.0.0.1:${PORT} model=${getModel()}`);
});
