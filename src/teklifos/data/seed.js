import catalog from "./eurCatalog.json";
import { addDaysInput } from "../domain/money.js";
import { buildSnapshotItem, computeQuoteTotals } from "../domain/quoteTotals.js";

function slug(value) {
  return String(value || "")
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function measuresFrom(text) {
  const parts = String(text || "").split("x").map((part) => Number(part.trim()));
  if (parts.length < 2 || parts.some((part) => !Number.isFinite(part) || part <= 0)) {
    return { widthMm: "", heightMm: "", depthMm: "", unit: "mm" };
  }
  return {
    widthMm: parts[0],
    depthMm: parts[1] || "",
    heightMm: parts[2] || "",
    unit: "mm",
  };
}

export function createSeedState() {
  const now = new Date().toISOString();
  const brandId = "brand-vital";
  const categories = catalog.categories.map((name) => ({
    id: `cat-${slug(name)}`,
    name,
    active: true,
  }));
  const categoryId = (name) => categories.find((item) => item.name === name)?.id || "";
  const products = catalog.products.map((item) => ({
    id: `prod-${slug(item.code)}`,
    code: item.code,
    name: item.name,
    description: [item.nameEn, item.specs].filter(Boolean).join("\n"),
    brandId,
    categoryId: categoryId(item.category),
    supplierId: "",
    type: "catalog",
    imageDataUrl: "",
    measures: measuresFrom(item.measure),
    attributes: [
      item.nameEn ? { key: "İngilizce ad", value: item.nameEn } : null,
      item.series ? { key: "Seri", value: item.series } : null,
      item.measure ? { key: "Ölçü", value: item.measure } : null,
      item.packageSize ? { key: "Paket ölçü", value: item.packageSize } : null,
      item.packageKg ? { key: "Paket kg", value: item.packageKg } : null,
    ].filter(Boolean),
    listPriceKurus: item.saleKurus || item.listKurus || 0,
    costKurus: 0,
    supplierDiscountBps: 0,
    pricingRuleId: "",
    active: true,
    createdAt: now,
    updatedAt: now,
  }));

  const brands = [{
    id: brandId,
    name: "VİTAL",
    email: "",
    phone: "",
    notes: "EUR sayfasındaki marka sütunu.",
    defaultDiscountBps: 0,
    active: true,
  }];
  const customers = [
    {
      id: "cust-ornek-otel",
      name: "Örnek Otel Mutfak A.Ş.",
      contactName: "Demo Yetkili",
      email: "mutfak@ornek-otel.test",
      phone: "+90 212 000 00 10",
      address: "Örnek Mah. Demo Sk. No: 1, İstanbul",
      taxNumber: "0000000000",
      notes: "Çalışma kitabında cari yok. Panel demosu için örnek kayıt.",
    },
    {
      id: "cust-demo-kafe",
      name: "Demo Kafe Ltd.",
      contactName: "Örnek Satınalma",
      email: "satinalma@demo-kafe.test",
      phone: "+90 232 000 00 11",
      address: "Demo Cad. No: 4, İzmir",
      taxNumber: "1111111111",
      notes: "",
    },
  ];
  const settings = {
    companyName: "Vital Mutfak",
    legalName: "Vital Mutfak",
    email: "info@vitalmutfak.com",
    phone: "",
    address: "",
    taxNumber: "",
    logoDataUrl: "",
    currency: "EUR",
    taxBps: 0,
    rounding: "half-up",
    quoteNumberFormat: "TKF-{YYYY}-{NNNN}",
    quoteSequence: 1004,
    validityDays: 15,
    paymentTerms: "Örnek koşul. Dosyadaki kurlar: 1 USD = 48 TL, 1 EUR = 56 TL.",
    deliveryTerms: "Stoktaki katalog ürünler için örnek teslim süresi 15 iş günü.",
    signatureName: "",
    footerNote: "Birim fiyatlar EUR sayfasındaki satış fiyatıdır. %64 iskonto satış fiyatına yeniden uygulanmaz. Vergi oranı dosyada doğrulanmadığı için 0.",
    demoRole: "admin",
    sourceFile: catalog.sourceFile,
    sourceSheet: catalog.sheet,
    fileDiscountPercent: catalog.discountPercent,
    recordedRates: catalog.rates,
    marginNote: catalog.marginNote,
  };
  const dayIso = (offset) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    date.setHours(9, 30, 0, 0);
    return date.toISOString();
  };
  const line = (code, quantityMilli) => {
    const product = products.find((item) => item.code === code);
    const built = buildSnapshotItem({
      product,
      rule: null,
      quantityMilli,
      rounding: settings.rounding,
      brands,
    });
    if (!built.ok) throw new Error(built.error);
    return { ...built.item, id: `${code}-line` };
  };
  const quoteFrom = ({ id, number, customer, status, productLines, offset, validityOffset, notes }) => {
    const totals = computeQuoteTotals({
      items: productLines,
      quoteDiscountBps: 0,
      taxBps: settings.taxBps,
      rounding: settings.rounding,
    });
    return {
      id,
      number,
      customerId: customer.id,
      customerSnapshot: {
        name: customer.name,
        contactName: customer.contactName,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        taxNumber: customer.taxNumber,
      },
      status,
      currency: settings.currency,
      items: totals.lines,
      quoteDiscountBps: 0,
      taxBps: settings.taxBps,
      rounding: settings.rounding,
      notes,
      validityDate: addDaysInput(validityOffset),
      deliveryTerms: settings.deliveryTerms,
      paymentTerms: settings.paymentTerms,
      totals: {
        subtotalKurus: totals.subtotalKurus,
        discountKurus: totals.discountKurus,
        taxKurus: totals.taxKurus,
        totalKurus: totals.totalKurus,
      },
      priceChanges: [],
      createdAt: dayIso(offset),
      updatedAt: dayIso(offset),
    };
  };
  const quotes = [
    quoteFrom({
      id: "quote-draft",
      number: "TKF-2026-1001",
      customer: customers[0],
      status: "draft",
      productLines: [line("GKO6010", 2000), line("GKO6020", 1000)],
      offset: -1,
      validityOffset: 14,
      notes: "Örnek taslak. Gazlı ocak satırları EUR kataloğundan.",
    }),
    quoteFrom({
      id: "quote-sent",
      number: "TKF-2026-1002",
      customer: customers[1],
      status: "sent",
      productLines: [line("GKW6010", 1000)],
      offset: -4,
      validityOffset: 10,
      notes: "Örnek gönderilmiş teklif. E-posta gönderilmedi.",
    }),
    quoteFrom({
      id: "quote-approved",
      number: "TKF-2026-1003",
      customer: customers[0],
      status: "approved",
      productLines: [line("GKO7010", 1000), line("GKO7020", 1000)],
      offset: -6,
      validityOffset: 20,
      notes: "Örnek onaylı proforma.",
    }),
  ];

  return {
    version: 1,
    settings,
    brands,
    categories,
    suppliers: [],
    customers,
    products,
    pricingRules: [{
      id: "rule-eur-discount",
      name: "EUR sayfası iskonto bilgisi",
      productType: "catalog",
      method: "discount",
      rateBps: catalog.discountPercent * 100,
      priority: 1,
      active: false,
      startsAt: "",
      endsAt: "",
      exampleOnly: false,
      updatedAt: now,
      updatedBy: "dosya",
    }],
    quotes,
    importJobs: [{
      id: "import-eur",
      fileName: catalog.sourceFile,
      profile: "catalog",
      mode: "only-new",
      createdAt: now,
      added: products.length,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: [],
      notes: [{ row: 0, message: "EUR sayfasındaki kodlu satırlar aktarıldı. Makro çalıştırılmadı." }],
    }],
    activities: [
      { id: "act-eur", at: now, message: `EUR sayfasından ${products.length} ürün okundu`, entityType: "import", entityId: "import-eur" },
      { id: "act-q1", at: dayIso(-1), message: "Teklif taslağı: TKF-2026-1001", entityType: "quote", entityId: "quote-draft" },
      { id: "act-q3", at: dayIso(-6), message: "Teklif onaylandı: TKF-2026-1003", entityType: "quote", entityId: "quote-approved" },
    ],
  };
}

export function blankProduct() {
  return {
    id: "",
    code: "",
    name: "",
    description: "",
    brandId: "",
    categoryId: "",
    supplierId: "",
    type: "catalog",
    imageDataUrl: "",
    measures: { widthMm: "", heightMm: "", depthMm: "", unit: "mm" },
    attributes: [{ key: "", value: "" }],
    listPriceKurus: 0,
    costKurus: 0,
    supplierDiscountBps: 0,
    pricingRuleId: "",
    active: true,
  };
}
