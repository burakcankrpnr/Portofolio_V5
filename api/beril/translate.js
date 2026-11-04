import { translateBatch } from "../../server/beril-core.mjs";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const pages = Array.isArray(body.pages) ? body.pages.map((p) => String(p ?? "")) : null;
    const result = await translateBatch(pages, body.title);
    return res.status(200).json(result);
  } catch (error) {
    const status = error.status || error.statusCode || 500;
    return res.status(status).json({
      error: error.message || "Çeviri başarısız",
    });
  }
}
