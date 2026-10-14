export const QUOTE_STATUSES = [
  { id: "draft", label: "Taslak" },
  { id: "preparing", label: "Hazırlanıyor" },
  { id: "sent", label: "Gönderildi" },
  { id: "approved", label: "Onaylandı" },
  { id: "rejected", label: "Reddedildi" },
  { id: "expired", label: "Süresi Doldu" },
];

export const PRODUCT_TYPES = [
  { id: "catalog", label: "Katalog" },
  { id: "manufacturing", label: "İmalat" },
  { id: "external", label: "Dış Ürün" },
];

export function statusLabel(id) {
  return QUOTE_STATUSES.find((item) => item.id === id)?.label || id;
}

export function typeLabel(id) {
  return PRODUCT_TYPES.find((item) => item.id === id)?.label || id;
}

export function effectiveStatus(quote, today = new Date()) {
  if (!quote) return "draft";
  if (quote.status === "sent" || quote.status === "preparing") {
    if (quote.validityDate && quote.validityDate < inputDate(today)) return "expired";
  }
  return quote.status;
}

function inputDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function normalizeProductType(value) {
  const raw = String(value || "")
    .trim()
    .toLocaleLowerCase("tr-TR");
  if (!raw) return "";
  if (["katalog", "catalog", "stok"].includes(raw)) return "catalog";
  if (["imalat", "manufacturing", "uretim", "üretim"].includes(raw)) return "manufacturing";
  if (["dis urun", "dış ürün", "dis", "dış", "external", "tedarik"].includes(raw)) return "external";
  return null;
}
