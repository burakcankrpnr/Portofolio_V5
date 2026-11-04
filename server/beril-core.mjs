import OpenAI from "openai";

/** Sayfa sayfa çeviri — JSON bozulması / kesilme riski en düşük. */
export const MAX_PAGES_PER_REQUEST = 1;

export const SYSTEM_PROMPT = `Sen bir akademik çevirmensin. Görevin ders notu metinlerini İngilizceden Türkçeye çevirmek.

Kurallar:
- Yalnızca İngilizce kısımları Türkçeye çevir.
- Zaten Türkçe olan cümleleri, terimleri ve açıklamaları olduğu gibi bırak.
- Anlamı uydurma, özetleme veya genişletme; içeriği koru.
- Madde işaretleri, numaralar, tarih ve hafta etiketleri gibi yapıyı koru.
- Çıktı SADECE geçerli JSON olsun, markdown yok: {"pages":["sayfa1","sayfa2"]}
- pages dizisi girişteki sayfa sayısıyla BİREBİR aynı uzunlukta olmalı.
- Her sayfa metnindeki tırnak ve satır sonlarını JSON string kaçış kurallarına uygun yaz.`;

/** Jenkins’e .env satırı / model yapışınca bozulan key’i ayıklar. */
export function normalizeApiKey(raw) {
  let key = String(raw || "")
    .trim()
    .replace(/^["']|["']$/g, "");

  key = key.replace(/^OPENAI_API_KEY\s*=\s*/i, "");
  key = key.replace(/OPENAI_MODEL\s*=.*$/i, "");
  key = key.replace(/BERIL_PORT\s*=.*$/i, "");

  if (key.includes(":gpt-") || /:gpt-4/.test(key)) {
    key = key.split(":")[0];
  }

  key = key.replace(/\s*gpt-4o-mini\s*$/i, "");
  key = key.split(/\r?\n/)[0].trim().replace(/^["']|["']$/g, "");

  return key;
}

export function getModel() {
  const model = String(process.env.OPENAI_MODEL || "gpt-4o-mini")
    .trim()
    .replace(/^["']|["']$/g, "")
    .split(/\r?\n/)[0]
    .trim();
  return model || "gpt-4o-mini";
}

export function hasApiKey() {
  const key = normalizeApiKey(process.env.OPENAI_API_KEY);
  return Boolean(key) && key.startsWith("sk-");
}

function getClient() {
  const key = normalizeApiKey(process.env.OPENAI_API_KEY);
  if (!key) {
    const err = new Error("OPENAI_API_KEY tanımlı değil");
    err.status = 500;
    throw err;
  }
  if (!key.startsWith("sk-")) {
    const err = new Error(
      "OPENAI_API_KEY geçersiz. Jenkins’te Secret text olarak yalnız sk-… key’ini koy (model ayrı)."
    );
    err.status = 500;
    throw err;
  }
  return new OpenAI({ apiKey: key });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Model bazen markdown veya kırık JSON döner; mümkün olduğunca kurtar. */
export function parsePagesJson(raw, expectedCount) {
  let text = String(raw || "").trim();
  if (!text) throw new Error("boş yanıt");

  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end > start) {
    text = text.slice(start, end + 1);
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Kırık string kaçışlarını yumuşatmayı dene
    const repaired = text
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]");
    parsed = JSON.parse(repaired);
  }

  let pages = parsed?.pages;
  if (!Array.isArray(pages) && typeof parsed === "object" && parsed !== null) {
    const values = Object.keys(parsed)
      .filter((k) => /^\d+$/.test(k))
      .sort((a, b) => Number(a) - Number(b))
      .map((k) => parsed[k]);
    if (values.length) pages = values;
  }

  if (!Array.isArray(pages)) {
    throw new Error("pages dizisi yok");
  }

  pages = pages.map((p) => (typeof p === "string" ? p : String(p ?? "")));

  if (expectedCount != null && pages.length !== expectedCount) {
    throw new Error(`sayfa sayısı ${pages.length}/${expectedCount}`);
  }

  return pages;
}

async function callTranslateOnce(client, model, pages, title) {
  const completion = await client.chat.completions.create({
    model,
    temperature: 0.1,
    max_tokens: 16000,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: JSON.stringify({
          title: title || "",
          pageCount: pages.length,
          pages,
        }),
      },
    ],
  });

  const choice = completion.choices?.[0];
  const raw = choice?.message?.content || "";
  if (choice?.finish_reason === "length") {
    throw new Error("yanıt kesildi (token)");
  }
  return parsePagesJson(raw, pages.length);
}

/**
 * Batch çeviri: bozuk JSON’da retry, gerekirse yarıya böl, tek sayfada orijinali koru.
 * Tüm işi düşürmez.
 */
export async function translateBatch(pages, title = "") {
  if (!Array.isArray(pages) || pages.length === 0) {
    const err = new Error("pages dizisi gerekli");
    err.status = 400;
    throw err;
  }
  if (pages.length > MAX_PAGES_PER_REQUEST) {
    const err = new Error(`En fazla ${MAX_PAGES_PER_REQUEST} sayfa / istek`);
    err.status = 400;
    throw err;
  }

  const model = getModel();
  const client = getClient();

  let lastError = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const out = await callTranslateOnce(client, model, pages, title);
      return { pages: out, model };
    } catch (error) {
      lastError = error;
      await sleep(400 * attempt);
    }
  }

  // Batch büyükse ikiye böl
  if (pages.length > 1) {
    const mid = Math.ceil(pages.length / 2);
    const left = await translateBatch(pages.slice(0, mid), title);
    const right = await translateBatch(pages.slice(mid), title);
    return { pages: [...left.pages, ...right.pages], model };
  }

  // Tek sayfa hâlâ bozuluyorsa orijinali bırak — iş devam etsin
  console.warn("[beril] sayfa çevirisi atlandı:", lastError?.message || lastError);
  return { pages: [pages[0]], model };
}
