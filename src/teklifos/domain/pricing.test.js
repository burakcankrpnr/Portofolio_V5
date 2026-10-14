import { describe, expect, it } from "vitest";
import { createSeedState } from "../data/seed.js";
import { divRound, parseMoneyToKurus, parsePercentToBps } from "./money.js";
import { applyDiscount, applyExampleArea, applyMargin, applyMarkup } from "./pricing.js";
import { buildSnapshotItem, computeQuoteTotals } from "./quoteTotals.js";

describe("para", () => {
  it("Türkçe tutarı kuruşa çevirir", () => {
    expect(parseMoneyToKurus("1.250,50")).toBe(125050);
    expect(parseMoneyToKurus("1250.50")).toBe(125050);
    expect(parseMoneyToKurus("10")).toBe(1000);
  });

  it("negatif tutarı reddeder", () => {
    expect(parseMoneyToKurus("-5")).toBeNull();
    expect(applyDiscount(-1, 0).ok).toBe(false);
  });

  it("yarım kuruşu yukarı yuvarlar", () => {
    expect(divRound(1, 2)).toBe(1);
    expect(divRound(10 * 8500, 10000)).toBe(9);
  });

  it("yüzdeyi baz puana çevirir", () => {
    expect(parsePercentToBps("12,5")).toBe(1250);
    expect(parsePercentToBps("100")).toBe(10000);
  });
});

describe("fiyat yöntemleri", () => {
  it("katalog iskontosunu uygular", () => {
    expect(applyDiscount(10000, 1000).unitPriceKurus).toBe(9000);
  });

  it("maliyet üzerine kâr ile hedef marjı ayırır", () => {
    const markup = applyMarkup(10000, 2000);
    const margin = applyMargin(10000, 2000);
    expect(markup.unitPriceKurus).toBe(12000);
    expect(margin.unitPriceKurus).toBe(12500);
    expect(markup.unitPriceKurus).not.toBe(margin.unitPriceKurus);
    expect(markup.formula).not.toBe(margin.formula);
  });

  it("%100 ve üzeri marjı reddeder", () => {
    expect(applyMargin(10000, 10000).ok).toBe(false);
    expect(applyMargin(10000, 10001).ok).toBe(false);
  });

  it("örnek alan hesabında eksik ölçüyü reddeder", () => {
    expect(applyExampleArea(50000, 0, 1000).ok).toBe(false);
    expect(applyExampleArea(50000, 1000, 2000).unitPriceKurus).toBe(100000);
    expect(applyExampleArea(50000, 1000, 2000).exampleOnly).toBe(true);
  });
});

describe("teklif toplamı", () => {
  it("iskonto sonrası vergiyi kuruş hassasiyetiyle hesaplar", () => {
    const totals = computeQuoteTotals({
      items: [{ unitPriceKurus: 10000, quantityMilli: 2000, discountBps: 0 }],
      quoteDiscountBps: 1000,
      taxBps: 2000,
    });
    expect(totals.subtotalKurus).toBe(20000);
    expect(totals.discountKurus).toBe(2000);
    expect(totals.taxKurus).toBe(3600);
    expect(totals.totalKurus).toBe(21600);
  });

  it("katalog fiyatı değişince kayıtlı snapshot bozulmaz", () => {
    const product = {
      id: "p1",
      code: "DRM-1",
      name: "Örnek sandalye",
      type: "catalog",
      listPriceKurus: 10000,
      attributes: [],
      brandId: "",
    };
    const snapshot = buildSnapshotItem({
      product,
      rule: { id: "r1", name: "Liste iskontosu", method: "discount", rateBps: 1000 },
      quantityMilli: 1000,
      brands: [],
    });
    expect(snapshot.ok).toBe(true);
    expect(snapshot.item.unitPriceKurus).toBe(9000);
    const changed = { ...product, listPriceKurus: 50000, name: "Başka ad" };
    const totals = computeQuoteTotals({
      items: [snapshot.item],
      quoteDiscountBps: 0,
      taxBps: 0,
    });
    expect(totals.totalKurus).toBe(9000);
    expect(snapshot.item.name).toBe("Örnek sandalye");
    expect(changed.listPriceKurus).toBe(50000);
  });

  it("demo teklif toplamları satır snapshot’ından gelir", () => {
    const state = createSeedState();
    for (const quote of state.quotes) {
      const totals = computeQuoteTotals({
        items: quote.items,
        quoteDiscountBps: quote.quoteDiscountBps,
        taxBps: quote.taxBps,
        rounding: quote.rounding,
      });
      expect(totals.ok).toBe(true);
      expect(totals.totalKurus).toBe(quote.totals.totalKurus);
    }
  });

  it("EUR sayfasındaki satış fiyatını kataloga yazar", () => {
    const state = createSeedState();
    const product = state.products.find((item) => item.code === "GKO6010");
    expect(product?.name).toBe("2li gazlı ocak");
    expect(product?.listPriceKurus).toBe(33500);
    expect(state.products.length).toBeGreaterThan(500);
    expect(state.pricingRules[0].active).toBe(false);
  });
});
