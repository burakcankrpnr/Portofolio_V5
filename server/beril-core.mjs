import OpenAI from "openai";

export const MAX_PAGES_PER_REQUEST = 8;

export const SYSTEM_PROMPT = `Sen bir akademik çevirmensin. Görevin ders notu metinlerini İngilizceden Türkçeye çevirmek.

Kurallar:
- Yalnızca İngilizce kısımları Türkçeye çevir.
- Zaten Türkçe olan cümleleri, terimleri ve açıklamaları olduğu gibi bırak.
- Anlamı uydurma, özetleme veya genişletme; içeriği koru.
- Madde işaretleri, numaralar, tarih ve hafta etiketleri gibi yapıyı koru.
- Yanıtını yalnızca geçerli JSON olarak ver: {"pages":["..."]} — pages dizisi girişteki sayfa sayısıyla aynı uzunlukta olmalı.`;

/** Jenkins Username/Password veya yapışık MODEL değerini ayıklar. */
export function normalizeApiKey(raw) {
  let key = String(raw || "")
    .trim()
    .replace(/^["']|["']$/g, "");

  // credentials('id') Username/Password → "sk-...:gpt-4o-mini"
  if (key.includes(":gpt-") || /:gpt-4/.test(key)) {
    key = key.split(":")[0].trim();
  }

  // Secret text'e yanlışlıkla model de yapıştırılmış
  key = key.replace(/\s*gpt-4o-mini\s*$/i, "").trim();
  key = key.split(/\r?\n/)[0].trim();

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

/** Tek istekte en fazla MAX_PAGES_PER_REQUEST sayfa çevirir (Vercel timeout için). */
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
  const completion = await client.chat.completions.create({
    model,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: JSON.stringify({ title, pages }),
      },
    ],
  });

  const raw = completion.choices?.[0]?.message?.content || "{}";
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("OpenAI geçersiz JSON döndürdü");
  }

  const out = Array.isArray(parsed.pages) ? parsed.pages : null;
  if (!out || out.length !== pages.length) {
    throw new Error(
      `Çeviri sayfa sayısı uyuşmuyor (beklenen ${pages.length}, gelen ${out?.length ?? 0})`
    );
  }

  return {
    pages: out.map((page) => (typeof page === "string" ? page : String(page ?? ""))),
    model,
  };
}
