const API_BASE = "/api";

async function readJson(res) {
  const text = await res.text();
  const trimmed = text.trim();
  if (!trimmed) return {};
  if (trimmed.startsWith("<")) {
    throw new Error(
      "Çeviri API’si HTML döndü. Beril sunucusu / Docker deploy çalışıyor mu?"
    );
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    throw new Error(`API yanıtı okunamadı (${res.status})`);
  }
}

export async function checkBerilHealth() {
  const res = await fetch(`${API_BASE}/beril/health`);
  const data = await readJson(res);
  if (!res.ok) throw new Error(data.error || "Çeviri API’sine ulaşılamıyor");
  return data;
}

export async function listServerJobs() {
  const res = await fetch(`${API_BASE}/beril/jobs`);
  const data = await readJson(res);
  if (!res.ok) throw new Error(data.error || "İş listesi alınamadı");
  return data.jobs || [];
}

export async function createServerJob(file) {
  const res = await fetch(`${API_BASE}/beril/jobs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/pdf",
      "X-Filename": encodeURIComponent(file.name || "dosya.pdf"),
    },
    body: file,
  });
  const data = await readJson(res);
  if (!res.ok) throw new Error(data.error || "Yükleme başarısız");
  return data.job;
}

export async function deleteServerJob(id) {
  const res = await fetch(`${API_BASE}/beril/jobs/${id}`, { method: "DELETE" });
  const data = await readJson(res);
  if (!res.ok) throw new Error(data.error || "Silinemedi");
  return data;
}

export function downloadServerJobUrl(id) {
  return `${API_BASE}/beril/jobs/${id}/download`;
}

export function downloadServerJob(id, name) {
  const a = document.createElement("a");
  a.href = downloadServerJobUrl(id);
  a.download = (name || "ceviri").replace(/\.pdf$/i, "") + "-TR.pdf";
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}
