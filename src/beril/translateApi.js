const API_BASE = "/api";
const CLIENT_BATCH_SIZE = 1;

async function readJson(res) {
  const text = await res.text();
  const trimmed = text.trim();
  if (!trimmed) return {};
  if (trimmed.startsWith("<") || trimmed.startsWith("<!DOCTYPE")) {
    throw new Error(
      "Çeviri API’si HTML döndü. Local’de `npm run beril-server` veya `npm run dev` yeniden başlat; canlıda Vercel’e OPENAI_API_KEY ekleyip deploy et."
    );
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    throw new Error(`Çeviri API yanıtı okunamadı (${res.status})`);
  }
}

export async function checkBerilHealth() {
  const res = await fetch(`${API_BASE}/beril/health`);
  const data = await readJson(res);
  if (!res.ok) {
    throw new Error(data.error || "Çeviri API’sine ulaşılamıyor");
  }
  return data;
}

async function translateBatchRequest(payload) {
  const res = await fetch(`${API_BASE}/beril/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await readJson(res);
  if (!res.ok) {
    throw new Error(data.error || `Çeviri hatası (${res.status})`);
  }
  return data;
}

/**
 * Uzun PDF’leri küçük batch’lerle çevirir (Vercel timeout’una takılmamak için).
 * @param {{ title?: string, pages: string[], onProgress?: (done: number, total: number) => void }} payload
 * @returns {Promise<{ pages: string[], model: string }>}
 */
export async function translatePages(payload) {
  const pages = payload.pages || [];
  const translated = [];
  let model = "";

  for (let i = 0; i < pages.length; i += CLIENT_BATCH_SIZE) {
    const batch = pages.slice(i, i + CLIENT_BATCH_SIZE);
    const data = await translateBatchRequest({
      title: payload.title,
      pages: batch,
    });
    translated.push(...data.pages);
    model = data.model || model;
    payload.onProgress?.(Math.min(i + batch.length, pages.length), pages.length);
  }

  return { pages: translated, model };
}
