import { divRound } from "./money.js";
import { priceProduct, resolveRule } from "./pricing.js";

export function lineFromUnit({
  unitPriceKurus,
  quantityMilli,
  discountBps = 0,
  rounding = "half-up",
}) {
  if (!Number.isInteger(unitPriceKurus) || unitPriceKurus < 0) {
    return { ok: false, error: "Negatif veya geçersiz tutar" };
  }
  if (!Number.isInteger(quantityMilli) || quantityMilli <= 0) {
    return { ok: false, error: "Miktar 0’dan büyük olmalı" };
  }
  if (!Number.isInteger(discountBps) || discountBps < 0 || discountBps > 10000) {
    return { ok: false, error: "Satır iskontosu 0 ile 100 arasında olmalı" };
  }
  const grossKurus = divRound(BigInt(unitPriceKurus) * BigInt(quantityMilli), 1000n, rounding);
  const lineDiscountKurus = divRound(BigInt(grossKurus) * BigInt(discountBps), 10000n, rounding);
  const lineNetKurus = grossKurus - lineDiscountKurus;
  if (lineNetKurus < 0) return { ok: false, error: "Satır tutarı negatif olamaz" };
  return { ok: true, grossKurus, lineDiscountKurus, lineNetKurus };
}

export function computeQuoteTotals({
  items,
  quoteDiscountBps = 0,
  taxBps = 0,
  rounding = "half-up",
}) {
  if (!Number.isInteger(quoteDiscountBps) || quoteDiscountBps < 0 || quoteDiscountBps > 10000) {
    return { ok: false, error: "Teklif iskontosu 0 ile 100 arasında olmalı" };
  }
  if (!Number.isInteger(taxBps) || taxBps < 0 || taxBps > 10000) {
    return { ok: false, error: "Vergi oranı geçersiz" };
  }
  const lines = [];
  for (const item of items) {
    const line = lineFromUnit({
      unitPriceKurus: item.unitPriceKurus,
      quantityMilli: item.quantityMilli,
      discountBps: item.discountBps || 0,
      rounding,
    });
    if (!line.ok) return line;
    lines.push({ ...item, ...line });
  }
  const subtotalKurus = lines.reduce((sum, line) => sum + line.lineNetKurus, 0);
  const discountKurus = divRound(BigInt(subtotalKurus) * BigInt(quoteDiscountBps), 10000n, rounding);
  const taxableKurus = subtotalKurus - discountKurus;
  const taxKurus = divRound(BigInt(taxableKurus) * BigInt(taxBps), 10000n, rounding);
  return {
    ok: true,
    lines,
    subtotalKurus,
    discountKurus,
    taxableKurus,
    taxKurus,
    totalKurus: taxableKurus + taxKurus,
    quoteDiscountBps,
    taxBps,
    rounding,
  };
}

export function buildSnapshotItem({
  product,
  rule,
  quantityMilli,
  discountBps = 0,
  measures,
  manualUnitPriceKurus = null,
  manualNote = "",
  rounding = "half-up",
  brands = [],
}) {
  const priced = priceProduct({ product, rule, measures, rounding });
  if (!priced.ok && manualUnitPriceKurus == null) return priced;
  const unitPriceKurus = manualUnitPriceKurus == null ? priced.unitPriceKurus : manualUnitPriceKurus;
  const line = lineFromUnit({ unitPriceKurus, quantityMilli, discountBps, rounding });
  if (!line.ok) return line;
  const brandName = brands.find((brand) => brand.id === product.brandId)?.name || product.brandName || "";
  const specs = (product.attributes || [])
    .filter((attr) => attr.key && attr.value)
    .map((attr) => `${attr.key}: ${attr.value}`)
    .join(" · ");
  return {
    ok: true,
    item: {
      id: product.lineId || crypto.randomUUID(),
      productId: product.id,
      code: product.code,
      name: product.name,
      brandName,
      type: product.type,
      specs,
      imageDataUrl: product.imageDataUrl || "",
      quantityMilli,
      measures: {
        widthMm: measures?.widthMm || null,
        heightMm: measures?.heightMm || null,
        depthMm: measures?.depthMm || null,
        unit: measures?.unit || product.measures?.unit || "mm",
      },
      unitPriceKurus,
      discountBps,
      ...line,
      method: manualUnitPriceKurus == null ? priced.method : "manual",
      methodLabel: manualUnitPriceKurus == null ? priced.methodLabel : "Manuel fiyat",
      formula: manualUnitPriceKurus == null ? priced.formula : "Yetkili kullanıcı birim fiyatı değiştirdi",
      exampleOnly: manualUnitPriceKurus == null ? Boolean(priced.exampleOnly) : false,
      ruleId: priced.ok ? priced.ruleId : null,
      ruleName: priced.ok ? priced.ruleName : "Manuel",
      manual: manualUnitPriceKurus != null,
      manualNote: manualNote || "",
    },
  };
}

export function snapshotIndependentOfCatalog(snapshotItem, changedProduct) {
  const priced = priceProduct({
    product: changedProduct,
    rule: null,
    measures: snapshotItem.measures,
  });
  return {
    snapshotUnit: snapshotItem.unitPriceKurus,
    catalogUnit: priced.ok ? priced.unitPriceKurus : null,
    unchanged: snapshotItem.unitPriceKurus !== (priced.ok ? priced.unitPriceKurus : snapshotItem.unitPriceKurus)
      ? true
      : snapshotItem.name === changedProduct.name,
  };
}

export function nextQuoteNumber(settings, date = new Date()) {
  const seq = settings.quoteSequence || 1;
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const nnnn = String(seq).padStart(4, "0");
  const number = (settings.quoteNumberFormat || "TKF-{YYYY}-{NNNN}")
    .replaceAll("{YYYY}", yyyy)
    .replaceAll("{MM}", mm)
    .replaceAll("{NNNN}", nnnn);
  return { number, quoteSequence: seq + 1 };
}

export function resolveRuleForProduct(state, product) {
  return resolveRule(state.pricingRules, product);
}
