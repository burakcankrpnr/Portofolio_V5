import "./polyfills.mjs";
import http from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { getModel, hasApiKey, translateBatch } from "./beril-core.mjs";
import {
  createJob,
  deleteJob,
  getJob,
  getJobPdf,
  listJobs,
  loadJobsFromDisk,
  pump,
} from "./beril-jobs.mjs";

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

function readRaw(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function decodeFilename(header) {
  if (!header) return "dosya.pdf";
  try {
    return decodeURIComponent(header);
  } catch {
    return header;
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Filename",
    });
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/beril/health") {
    json(res, 200, { ok: hasApiKey(), model: getModel() });
    return;
  }

  if (req.method === "GET" && url.pathname === "/beril/jobs") {
    json(res, 200, { jobs: listJobs() });
    return;
  }

  const jobMatch = url.pathname.match(/^\/beril\/jobs\/([^/]+)(?:\/(download))?$/);
  if (jobMatch) {
    const id = jobMatch[1];
    const action = jobMatch[2];

    if (req.method === "GET" && action === "download") {
      const pdf = await getJobPdf(id);
      const job = getJob(id);
      if (!pdf || !job) {
        json(res, 404, { error: "PDF hazır değil" });
        return;
      }
      const filename = encodeURIComponent(job.name.replace(/\.pdf$/i, "") + "-TR.pdf");
      res.writeHead(200, {
        "Content-Type": "application/pdf",
        "Content-Length": pdf.length,
        "Content-Disposition": `attachment; filename*=UTF-8''${filename}`,
      });
      res.end(pdf);
      return;
    }

    if (req.method === "GET" && !action) {
      const job = getJob(id);
      if (!job) {
        json(res, 404, { error: "İş bulunamadı" });
        return;
      }
      json(res, 200, { job });
      return;
    }

    if (req.method === "DELETE" && !action) {
      const ok = await deleteJob(id);
      json(res, ok ? 200 : 404, ok ? { ok: true } : { error: "İş bulunamadı" });
      return;
    }
  }

  if (req.method === "POST" && url.pathname === "/beril/jobs") {
    try {
      const buffer = await readRaw(req);
      const name = decodeFilename(req.headers["x-filename"]);
      const job = await createJob({ name, buffer });
      json(res, 201, { job });
    } catch (error) {
      const status = error.status || 500;
      json(res, status, { error: error.message || "Yükleme başarısız" });
    }
    return;
  }

  // Eski batch endpoint (uyumluluk)
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

const HOST = process.env.BERIL_HOST || "0.0.0.0";

await loadJobsFromDisk();
pump();

server.listen(PORT, HOST, () => {
  console.log(`[beril] http://${HOST}:${PORT} model=${getModel()} key=${hasApiKey() ? "ok" : "missing"}`);
});
