import { describe, expect, it } from "vitest";
import { formatMoney } from "../domain/money.js";
import { computeQuoteTotals } from "../domain/quoteTotals.js";
import { buildQuotePdfDefinition } from "./pdfQuote.js";

describe("pdf teklif", () => {
  it("belgedeki genel toplam kayıtlı hesapla aynıdır", () => {
    const totals = computeQuoteTotals({
      items: [{
        code: "DRM-1",
        name: "Örnek sandalye",
        specs: "Malzeme: Meşe",
        quantityMilli: 2000,
        unitPriceKurus: 10000,
        discountBps: 0,
        lineNetKurus: 20000,
      }],
      quoteDiscountBps: 0,
      taxBps: 2000,
    });
    const quote = {
      number: "TKF-TEST-1",
      createdAt: "2026-10-14T09:00:00.000Z",
      validityDate: "2026-10-30",
      currency: "TRY",
      taxBps: 2000,
      customerSnapshot: { name: "Örnek Müşteri A.Ş." },
      items: totals.lines,
      totals,
      notes: "Demo not",
      deliveryTerms: "Örnek teslimat",
      paymentTerms: "Örnek ödeme",
    };
    const definition = buildQuotePdfDefinition(quote, {
      companyName: "Demo Atölye",
      currency: "TRY",
      footerNote: "Demo",
    });
    expect(JSON.stringify(definition)).toContain(formatMoney(totals.totalKurus, "TRY"));
    expect(JSON.stringify(definition)).toContain("Örnek Müşteri A.Ş.");
    expect(definition.footer).toBeTypeOf("function");
  });
});
