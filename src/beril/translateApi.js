const API_BASE = "/api";
const CLIENT_BATCH_SIZE = 6;

export async function checkBerilHealth() {
  const res = await fetch(`${API_BASE}/beril/health`);
  if (!res.ok) {
    throw new Error("Çeviri API’sine ulaşılamıyor");
  }
  return res.json();
}

async function translateBatchRequest(payload) {
  const res = await fetch(`${API_BASE}/beril/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
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
