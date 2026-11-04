import { getModel, hasApiKey } from "../../server/beril-core.mjs";

export default function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ok = hasApiKey();
  return res.status(200).json({
    ok,
    model: getModel(),
    hint: ok
      ? undefined
      : "OPENAI_API_KEY eksik: Docker beril servisine .env verin veya Vercel Environment Variables ekleyin",
  });
}
