import { divRound } from "./money.js";

export const METHODS = {
  discount: {
    id: "discount",
    label: "Liste fiyatı üzerinden iskonto",
    formula: "net = liste fiyatı × (1 − d / 100)",
    exampleOnly: false,
  },
  markup: {
    id: "markup",
    label: "Maliyet üzerine kâr",
    formula: "satış = maliyet × (1 + m / 100)",
    exampleOnly: false,
  },
  margin: {
    id: "margin",
    label: "Hedef brüt marj",
    formula: "satış = maliyet / (1 − g / 100)",
    exampleOnly: false,
  },
  "example-area": {
    id: "example-area",
    label: "Örnek alan hesabı",
    formula: "örnek satış = birim fiyat × (en mm × boy mm / 1.000.000)",
    exampleOnly: true,
  },
};

export function pricingError(message, code) {
  return { ok: false, error: message, code };
}

export function pricingOk(unitPriceKurus, extra = {}) {
  return { ok: true, unitPriceKurus, ...extra };
}

function invalidAmount(baseKurus) {
  return !Number.isInteger(baseKurus) || baseKurus < 0;
}

function invalidRate(rateBps) {
  return !Number.isInteger(rateBps) || rateBps < 0;
}

export function applyDiscount(baseKurus, rateBps, rounding = "half-up") {
  if (invalidAmount(baseKurus)) return pricingError("Negatif veya geçersiz tutar", "INVALID_AMOUNT");
  if (invalidRate(rateBps) || rateBps > 10000) {
    return pricingError("İskonto oranı 0 ile 100 arasında olmalı", "INVALID_RATE");
  }
  const unitPriceKurus = divRound(BigInt(baseKurus) * BigInt(10000 - rateBps), 10000n, rounding);
  return pricingOk(unitPriceKurus, {
    method: "discount",
    methodLabel: METHODS.discount.label,
    formula: METHODS.discount.formula,
    exampleOnly: false,
  });
}

export function applyMarkup(baseKurus, rateBps, rounding = "half-up") {
  if (invalidAmount(baseKurus)) return pricingError("Negatif veya geçersiz tutar", "INVALID_AMOUNT");
  if (invalidRate(rateBps)) return pricingError("Kâr oranı negatif olamaz", "INVALID_RATE");
  const unitPriceKurus = divRound(BigInt(baseKurus) * BigInt(10000 + rateBps), 10000n, rounding);
  return pricingOk(unitPriceKurus, {
    method: "markup",
    methodLabel: METHODS.markup.label,
    formula: METHODS.markup.formula,
    exampleOnly: false,
  });
}

export function applyMargin(baseKurus, rateBps, rounding = "half-up") {
  if (invalidAmount(baseKurus)) return pricingError("Negatif veya geçersiz tutar", "INVALID_AMOUNT");
  if (invalidRate(rateBps) || rateBps >= 10000) {
    return pricingError("Hedef marj %100 veya üzeri olamaz", "INVALID_RATE");
  }
  const unitPriceKurus = divRound(BigInt(baseKurus) * 10000n, BigInt(10000 - rateBps), rounding);
  return pricingOk(unitPriceKurus, {
    method: "margin",
    methodLabel: METHODS.margin.label,
    formula: METHODS.margin.formula,
    exampleOnly: false,
  });
}

export function applyExampleArea(unitPerM2Kurus, widthMm, heightMm, rounding = "half-up") {
  if (invalidAmount(unitPerM2Kurus)) return pricingError("Negatif veya geçersiz tutar", "INVALID_AMOUNT");
  if (!Number.isInteger(widthMm) || !Number.isInteger(heightMm) || widthMm <= 0 || heightMm <= 0) {
    return pricingError("İmalat örneği için en ve boy (mm) gerekli", "MISSING_MEASURE");
  }
  const unitPriceKurus = divRound(
    BigInt(unitPerM2Kurus) * BigInt(widthMm) * BigInt(heightMm),
    1000000n,
    rounding
  );
  return pricingOk(unitPriceKurus, {
    method: "example-area",
    methodLabel: `${METHODS["example-area"].label} (doğrulanmamış örnek)`,
    formula: METHODS["example-area"].formula,
    exampleOnly: true,
  });
}

export function resolveRule(rules, product, today = new Date()) {
  if (!product) return null;
  if (product.pricingRuleId) {
    const chosen = rules.find((rule) => rule.id === product.pricingRuleId && rule.active);
    if (chosen && ruleInForce(chosen, today)) return chosen;
  }
  const matches = (rules || [])
    .filter((rule) => rule.active && ruleInForce(rule, today))
    .filter((rule) => rule.productType === "all" || rule.productType === product.type)
    .sort((a, b) => b.priority - a.priority || String(b.updatedAt).localeCompare(String(a.updatedAt)));
  return matches[0] || null;
}

function ruleInForce(rule, today) {
  const day = todayInput(today);
  if (rule.startsAt && rule.startsAt > day) return false;
  if (rule.endsAt && rule.endsAt < day) return false;
  return true;
}

function todayInput(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function priceProduct({ product, rule, measures, rounding = "half-up" }) {
  if (!product) return pricingError("Ürün bulunamadı", "MISSING_PRODUCT");
  if (product.type === "catalog") {
    const rate = rule?.method === "discount" ? rule.rateBps : 0;
    const result = applyDiscount(product.listPriceKurus || 0, rate, rounding);
    if (!result.ok) return result;
    return {
      ...result,
      ruleId: rule?.id || null,
      ruleName: rule?.name || "Kural yok",
      baseLabel: "Liste fiyatı",
    };
  }
  if (product.type === "external") {
    const supplierRate = product.supplierDiscountBps || 0;
    const netCost = applyDiscount(product.costKurus || 0, supplierRate, rounding);
    if (!netCost.ok) return netCost;
    const method = rule?.method === "margin" ? "margin" : "markup";
    const rate = rule && (rule.method === "margin" || rule.method === "markup") ? rule.rateBps : 0;
    const priced = method === "margin"
      ? applyMargin(netCost.unitPriceKurus, rate, rounding)
      : applyMarkup(netCost.unitPriceKurus, rate, rounding);
    if (!priced.ok) return priced;
    const ruleName = rule ? rule.name : "Kural yok — kâr %0";
    return {
      ...priced,
      ruleId: rule?.id || null,
      ruleName,
      baseLabel: "Net maliyet",
      costKurus: netCost.unitPriceKurus,
    };
  }
  if (rule?.method === "example-area") {
    const width = Number(measures?.widthMm ?? product.measures?.widthMm);
    const height = Number(measures?.heightMm ?? product.measures?.heightMm);
    const priced = applyExampleArea(product.listPriceKurus || 0, width, height, rounding);
    if (!priced.ok) return priced;
    return {
      ...priced,
      ruleId: rule.id,
      ruleName: rule.name,
      baseLabel: "m² birim fiyatı",
    };
  }
  const rate = rule?.method === "discount" ? rule.rateBps : 0;
  const priced = applyDiscount(product.listPriceKurus || 0, rate, rounding);
  if (!priced.ok) return priced;
  return {
    ...priced,
    methodLabel: rule ? priced.methodLabel : "Kural yok — liste fiyatı",
    ruleId: rule?.id || null,
    ruleName: rule?.name || "Kural yok",
    baseLabel: "Liste fiyatı",
    exampleOnly: false,
  };
}

export function simulatePricing({ method, baseKurus, rateBps, widthMm, heightMm, rounding = "half-up" }) {
  if (method === "discount") return applyDiscount(baseKurus, rateBps, rounding);
  if (method === "markup") return applyMarkup(baseKurus, rateBps, rounding);
  if (method === "margin") return applyMargin(baseKurus, rateBps, rounding);
  if (method === "example-area") return applyExampleArea(baseKurus, widthMm, heightMm, rounding);
  return pricingError("Yöntem seçin", "INVALID_METHOD");
}
