export function required(value, label) {
  if (!String(value ?? "").trim()) return `${label} gerekli`;
  return "";
}

export function emailOrEmpty(value) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) return "Geçerli bir e-posta girin";
  return "";
}

export function uniqueProductCode(products, code, ignoreId) {
  const key = String(code || "").trim().toLocaleLowerCase("tr-TR");
  if (!key) return "Ürün kodu gerekli";
  const clash = products.some(
    (product) => product.id !== ignoreId && product.code.trim().toLocaleLowerCase("tr-TR") === key
  );
  return clash ? "Bu ürün kodu zaten kullanılıyor" : "";
}
