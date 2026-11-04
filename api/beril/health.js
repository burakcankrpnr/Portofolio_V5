import { getModel, hasApiKey } from "../../server/beril-core.mjs";

export default function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  return res.status(200).json({
    ok: hasApiKey(),
    model: getModel(),
  });
}
