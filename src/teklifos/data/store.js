import { QUOTE_STATUSES } from "../domain/labels.js";
import { canSeeCosts, canWrite } from "../domain/permissions.js";
import { computeQuoteTotals, nextQuoteNumber } from "../domain/quoteTotals.js";
import { uniqueProductCode } from "../domain/validation.js";
import { createSeedState } from "./seed.js";

export const STORAGE_KEY = "buse.v2";

export function loadState() {
  if (typeof localStorage === "undefined") return createSeedState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createSeedState();
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1 || !parsed.settings || !Array.isArray(parsed.products)) {
      return createSeedState();
    }
    return parsed;
  } catch {
    return createSeedState();
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function activity(state, message, entityType, entityId) {
  return [{
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    message,
    entityType,
    entityId,
  }, ...state.activities].slice(0, 100);
}

function replaceById(list, item) {
  const index = list.findIndex((entry) => entry.id === item.id);
  if (index === -1) return [item, ...list];
  const next = list.slice();
  next[index] = item;
  return next;
}

function customerSnapshot(customer) {
  return {
    name: customer.name,
    contactName: customer.contactName,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    taxNumber: customer.taxNumber,
  };
}

export function saveProduct(state, input) {
  const role = state.settings.demoRole;
  if (!canWrite(role)) return { ok: false, error: "Bu demo rolü değişiklik yapamaz" };
  const codeError = uniqueProductCode(state.products, input.code, input.id);
  if (codeError) return { ok: false, error: codeError };
  if (!String(input.name || "").trim()) return { ok: false, error: "Ürün adı gerekli" };
  const listPriceKurus = input.listPriceKurus ?? 0;
  if (!Number.isInteger(listPriceKurus) || listPriceKurus < 0) {
    return { ok: false, error: "Liste fiyatı geçersiz" };
  }
  const existing = state.products.find((product) => product.id === input.id);
  const seeCosts = canSeeCosts(role);
  const costKurus = seeCosts ? (input.costKurus ?? 0) : (existing?.costKurus || 0);
  const supplierDiscountBps = seeCosts ? (input.supplierDiscountBps ?? 0) : (existing?.supplierDiscountBps || 0);
  if (!Number.isInteger(costKurus) || costKurus < 0) return { ok: false, error: "Maliyet geçersiz" };
  if (!Number.isInteger(supplierDiscountBps) || supplierDiscountBps < 0 || supplierDiscountBps > 10000) {
    return { ok: false, error: "Tedarikçi iskontosu geçersiz" };
  }
  const now = new Date().toISOString();
  const product = {
    id: existing?.id || crypto.randomUUID(),
    code: input.code.trim(),
    name: input.name.trim(),
    description: String(input.description || "").trim(),
    brandId: input.brandId || "",
    categoryId: input.categoryId || "",
    supplierId: input.supplierId || "",
    type: input.type || "catalog",
    imageDataUrl: input.imageDataUrl || "",
    measures: {
      widthMm: input.measures?.widthMm === "" || input.measures?.widthMm == null ? "" : Number(input.measures.widthMm),
      heightMm: input.measures?.heightMm === "" || input.measures?.heightMm == null ? "" : Number(input.measures.heightMm),
      depthMm: input.measures?.depthMm === "" || input.measures?.depthMm == null ? "" : Number(input.measures.depthMm),
      unit: input.measures?.unit || "mm",
    },
    attributes: (input.attributes || []).filter((attr) => String(attr.key || "").trim() || String(attr.value || "").trim()),
    listPriceKurus,
    costKurus,
    supplierDiscountBps,
    pricingRuleId: input.pricingRuleId || "",
    active: input.active !== false,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
  const products = replaceById(state.products, product);
  return {
    ok: true,
    id: product.id,
    state: {
      ...state,
      products,
      activities: activity(state, `${existing ? "Ürün güncellendi" : "Ürün eklendi"}: ${product.code}`, "product", product.id),
    },
  };
}

export function setProductActive(state, id, active) {
  if (!canWrite(state.settings.demoRole)) return { ok: false, error: "Bu demo rolü değişiklik yapamaz" };
  const product = state.products.find((item) => item.id === id);
  if (!product) return { ok: false, error: "Ürün bulunamadı" };
  const next = { ...product, active, updatedAt: new Date().toISOString() };
  return {
    ok: true,
    state: {
      ...state,
      products: state.products.map((item) => (item.id === id ? next : item)),
      activities: activity(state, `${active ? "Ürün yeniden açıldı" : "Ürün arşivlendi"}: ${product.code}`, "product", id),
    },
  };
}

export function deleteProduct(state, id) {
  if (!canWrite(state.settings.demoRole)) return { ok: false, error: "Bu demo rolü değişiklik yapamaz" };
  const product = state.products.find((item) => item.id === id);
  if (!product) return { ok: false, error: "Ürün bulunamadı" };
  const used = state.quotes.some((quote) => quote.items.some((item) => item.productId === id));
  if (used) return { ok: false, error: "Bu ürün tekliflerde kullanıldığı için silinmedi. Arşivleyin." };
  return {
    ok: true,
    state: {
      ...state,
      products: state.products.filter((item) => item.id !== id),
      activities: activity(state, `Ürün silindi: ${product.code}`, "product", id),
    },
  };
}

function saveNamed(state, key, input, label) {
  if (!canWrite(state.settings.demoRole)) return { ok: false, error: "Bu demo rolü değişiklik yapamaz" };
  const name = String(input.name || "").trim();
  if (!name) return { ok: false, error: `${label} adı gerekli` };
  const clash = state[key].some(
    (item) => item.id !== input.id && item.name.trim().toLocaleLowerCase("tr-TR") === name.toLocaleLowerCase("tr-TR")
  );
  if (clash) return { ok: false, error: `Bu ${label.toLocaleLowerCase("tr-TR")} adı zaten var` };
  const existing = state[key].find((item) => item.id === input.id);
  const record = {
    ...existing,
    ...input,
    id: existing?.id || crypto.randomUUID(),
    name,
    email: String(input.email || "").trim(),
    phone: String(input.phone || "").trim(),
    notes: String(input.notes || "").trim(),
    active: input.active !== false,
  };
  return {
    ok: true,
    id: record.id,
    state: {
      ...state,
      [key]: replaceById(state[key], record),
      activities: activity(state, `${label} kaydedildi: ${name}`, key, record.id),
    },
  };
}

export function saveBrand(state, input) {
  const discount = input.defaultDiscountBps ?? 0;
  if (!Number.isInteger(discount) || discount < 0 || discount > 10000) {
    return { ok: false, error: "Varsayılan iskonto geçersiz" };
  }
  return saveNamed(state, "brands", { ...input, defaultDiscountBps: discount }, "Marka");
}

export function saveCategory(state, input) {
  return saveNamed(state, "categories", input, "Kategori");
}

export function saveSupplier(state, input) {
  const discount = input.defaultDiscountBps ?? 0;
  if (!canSeeCosts(state.settings.demoRole) && input.id) {
    const existing = state.suppliers.find((item) => item.id === input.id);
    input = { ...input, defaultDiscountBps: existing?.defaultDiscountBps || 0 };
  } else if (!Number.isInteger(discount) || discount < 0 || discount > 10000) {
    return { ok: false, error: "Varsayılan iskonto geçersiz" };
  }
  return saveNamed(state, "suppliers", { ...input, defaultDiscountBps: input.defaultDiscountBps ?? discount }, "Tedarikçi");
}

export function saveCustomer(state, input) {
  if (!canWrite(state.settings.demoRole)) return { ok: false, error: "Bu demo rolü değişiklik yapamaz" };
  const name = String(input.name || "").trim();
  if (!name) return { ok: false, error: "Müşteri adı gerekli" };
  const existing = state.customers.find((item) => item.id === input.id);
  const customer = {
    id: existing?.id || crypto.randomUUID(),
    name,
    contactName: String(input.contactName || "").trim(),
    email: String(input.email || "").trim(),
    phone: String(input.phone || "").trim(),
    address: String(input.address || "").trim(),
    taxNumber: String(input.taxNumber || "").trim(),
    notes: String(input.notes || "").trim(),
  };
  return {
    ok: true,
    id: customer.id,
    state: {
      ...state,
      customers: replaceById(state.customers, customer),
      activities: activity(state, `Müşteri kaydedildi: ${name}`, "customer", customer.id),
    },
  };
}

export function deleteCustomer(state, id) {
  if (!canWrite(state.settings.demoRole)) return { ok: false, error: "Bu demo rolü değişiklik yapamaz" };
  if (state.quotes.some((quote) => quote.customerId === id)) {
    return { ok: false, error: "Teklifi bulunan müşteri silinmedi" };
  }
  const customer = state.customers.find((item) => item.id === id);
  return {
    ok: true,
    state: {
      ...state,
      customers: state.customers.filter((item) => item.id !== id),
      activities: activity(state, `Müşteri silindi: ${customer?.name || ""}`, "customer", id),
    },
  };
}

export function deleteByUsage(state, key, id, usage) {
  if (!canWrite(state.settings.demoRole)) return { ok: false, error: "Bu demo rolü değişiklik yapamaz" };
  if (usage) return { ok: false, error: "Bağlı kayıtlar olduğu için silinmedi. Pasife alın." };
  const current = state[key].find((item) => item.id === id);
  return {
    ok: true,
    state: {
      ...state,
      [key]: state[key].filter((item) => item.id !== id),
      activities: activity(state, `Kayıt silindi: ${current?.name || ""}`, key, id),
    },
  };
}

export function saveRule(state, input) {
  if (!canWrite(state.settings.demoRole)) return { ok: false, error: "Bu demo rolü değişiklik yapamaz" };
  const name = String(input.name || "").trim();
  if (!name) return { ok: false, error: "Kural adı gerekli" };
  if (!["discount", "markup", "margin", "example-area"].includes(input.method)) {
    return { ok: false, error: "Yöntem seçin" };
  }
  if (!Number.isInteger(input.rateBps) || input.rateBps < 0) return { ok: false, error: "Oran geçersiz" };
  if (input.method === "discount" && input.rateBps > 10000) return { ok: false, error: "İskonto %100’ü geçemez" };
  if (input.method === "margin" && input.rateBps >= 10000) return { ok: false, error: "Hedef marj %100 veya üzeri olamaz" };
  const existing = state.pricingRules.find((rule) => rule.id === input.id);
  const rule = {
    id: existing?.id || crypto.randomUUID(),
    name,
    productType: input.productType || "all",
    method: input.method,
    rateBps: input.method === "example-area" ? 0 : input.rateBps,
    priority: Number.isFinite(Number(input.priority)) ? Number(input.priority) : 0,
    active: input.active !== false,
    startsAt: input.startsAt || "",
    endsAt: input.endsAt || "",
    exampleOnly: input.method === "example-area",
    updatedAt: new Date().toISOString(),
    updatedBy: state.settings.demoRole,
  };
  if (rule.startsAt && rule.endsAt && rule.endsAt < rule.startsAt) {
    return { ok: false, error: "Bitiş tarihi başlangıçtan önce olamaz" };
  }
  return {
    ok: true,
    id: rule.id,
    state: {
      ...state,
      pricingRules: replaceById(state.pricingRules, rule),
      activities: activity(state, `Fiyat kuralı kaydedildi: ${name}`, "rule", rule.id),
    },
  };
}

export function saveQuote(state, input) {
  if (!canWrite(state.settings.demoRole)) return { ok: false, error: "Bu demo rolü teklif kaydedemez" };
  const customer = state.customers.find((item) => item.id === input.customerId);
  if (!customer) return { ok: false, error: "Müşteri seçin" };
  if (!input.items?.length) return { ok: false, error: "En az bir ürün ekleyin" };
  const totals = computeQuoteTotals({
    items: input.items,
    quoteDiscountBps: input.quoteDiscountBps || 0,
    taxBps: state.settings.taxBps,
    rounding: state.settings.rounding,
  });
  if (!totals.ok) return totals;
  const existing = state.quotes.find((quote) => quote.id === input.id);
  let settings = state.settings;
  let number = existing?.number;
  if (!existing) {
    const next = nextQuoteNumber(settings);
    number = next.number;
    settings = { ...settings, quoteSequence: next.quoteSequence };
  }
  const now = new Date().toISOString();
  const quote = {
    id: existing?.id || input.id || crypto.randomUUID(),
    number,
    customerId: customer.id,
    customerSnapshot: customerSnapshot(customer),
    status: existing?.status || "draft",
    currency: state.settings.currency,
    items: totals.lines,
    quoteDiscountBps: totals.quoteDiscountBps,
    taxBps: totals.taxBps,
    rounding: totals.rounding,
    notes: String(input.notes || ""),
    validityDate: input.validityDate || "",
    deliveryTerms: input.deliveryTerms ?? state.settings.deliveryTerms,
    paymentTerms: input.paymentTerms ?? state.settings.paymentTerms,
    totals: {
      subtotalKurus: totals.subtotalKurus,
      discountKurus: totals.discountKurus,
      taxKurus: totals.taxKurus,
      totalKurus: totals.totalKurus,
    },
    priceChanges: input.priceChanges || [],
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
  return {
    ok: true,
    id: quote.id,
    state: {
      ...state,
      settings,
      quotes: replaceById(state.quotes, quote),
      activities: activity(state, `${existing ? "Teklif güncellendi" : "Teklif oluşturuldu"}: ${quote.number}`, "quote", quote.id),
    },
  };
}

export function updateQuoteStatus(state, id, status) {
  if (!canWrite(state.settings.demoRole)) return { ok: false, error: "Bu demo rolü durum değiştiremez" };
  if (!QUOTE_STATUSES.some((item) => item.id === status)) return { ok: false, error: "Durum geçersiz" };
  const quote = state.quotes.find((item) => item.id === id);
  if (!quote) return { ok: false, error: "Teklif bulunamadı" };
  const label = QUOTE_STATUSES.find((item) => item.id === status)?.label || status;
  const next = { ...quote, status, updatedAt: new Date().toISOString() };
  return {
    ok: true,
    state: {
      ...state,
      quotes: state.quotes.map((item) => (item.id === id ? next : item)),
      activities: activity(state, `Teklif durumu ${label}: ${quote.number}`, "quote", id),
    },
  };
}

export function copyQuote(state, id) {
  if (!canWrite(state.settings.demoRole)) return { ok: false, error: "Bu demo rolü teklif kopyalayamaz" };
  const quote = state.quotes.find((item) => item.id === id);
  if (!quote) return { ok: false, error: "Teklif bulunamadı" };
  const next = nextQuoteNumber(state.settings);
  const now = new Date().toISOString();
  const copy = {
    ...quote,
    id: crypto.randomUUID(),
    number: next.number,
    status: "draft",
    items: quote.items.map((item) => ({ ...item, id: crypto.randomUUID() })),
    priceChanges: [],
    createdAt: now,
    updatedAt: now,
  };
  return {
    ok: true,
    id: copy.id,
    state: {
      ...state,
      settings: { ...state.settings, quoteSequence: next.quoteSequence },
      quotes: [copy, ...state.quotes],
      activities: activity(state, `Teklif kopyalandı: ${quote.number} → ${copy.number}`, "quote", copy.id),
    },
  };
}

export function deleteQuote(state, id) {
  if (!canWrite(state.settings.demoRole)) return { ok: false, error: "Bu demo rolü teklif silemez" };
  const quote = state.quotes.find((item) => item.id === id);
  if (!quote) return { ok: false, error: "Teklif bulunamadı" };
  return {
    ok: true,
    state: {
      ...state,
      quotes: state.quotes.filter((item) => item.id !== id),
      activities: activity(state, `Teklif silindi: ${quote.number}`, "quote", id),
    },
  };
}

export function commitImport(state, result, meta) {
  const job = {
    id: crypto.randomUUID(),
    fileName: meta.fileName,
    profile: meta.profile,
    mode: meta.mode,
    createdAt: new Date().toISOString(),
    added: result.added,
    updated: result.updated,
    skipped: result.skipped,
    failed: meta.failed || 0,
    errors: meta.errors || [],
    notes: result.notes || [],
  };
  return {
    ok: true,
    job,
    state: {
      ...state,
      products: result.products,
      brands: result.brands,
      categories: result.categories,
      suppliers: result.suppliers,
      importJobs: [job, ...state.importJobs].slice(0, 30),
      activities: activity(
        state,
        `Excel aktarımı (${meta.fileName}): ${result.added} eklendi, ${result.updated} güncellendi, ${result.skipped} atlandı`,
        "import",
        job.id
      ),
    },
  };
}

export function updateSettings(state, patch) {
  if (state.settings.demoRole === "sales" || state.settings.demoRole === "viewer") {
    return { ok: false, error: "Ayarları bu demo rolü değiştiremez" };
  }
  const next = { ...state.settings, ...patch, demoRole: state.settings.demoRole };
  if (!next.companyName?.trim()) return { ok: false, error: "Şirket adı gerekli" };
  if (!Number.isInteger(next.taxBps) || next.taxBps < 0 || next.taxBps > 10000) {
    return { ok: false, error: "Vergi oranı geçersiz" };
  }
  return {
    ok: true,
    state: {
      ...state,
      settings: next,
      activities: activity(state, "Şirket ayarları güncellendi", "settings", "settings"),
    },
  };
}

export function setDemoRole(state, role) {
  if (!["owner", "admin", "sales", "viewer"].includes(role)) return { ok: false, error: "Rol geçersiz" };
  return { ok: true, state: { ...state, settings: { ...state.settings, demoRole: role } } };
}

export function productUsageCount(state, productId) {
  return state.quotes.reduce(
    (count, quote) => count + quote.items.filter((item) => item.productId === productId).length,
    0
  );
}

export function customerQuoteStats(state, customerId) {
  const quotes = state.quotes.filter((quote) => quote.customerId === customerId);
  const latest = quotes.map((quote) => quote.createdAt).sort().at(-1) || "";
  return { count: quotes.length, latest };
}

export function reducer(state, action) {
  if (action.type === "replace") return action.state;
  return state;
}

export function createActions(dispatch, getState) {
  const commit = (result) => {
    if (result?.ok && result.state) dispatch({ type: "replace", state: result.state });
    return result;
  };
  return {
    saveProduct: (input) => commit(saveProduct(getState(), input)),
    setProductActive: (id, active) => commit(setProductActive(getState(), id, active)),
    deleteProduct: (id) => commit(deleteProduct(getState(), id)),
    saveBrand: (input) => commit(saveBrand(getState(), input)),
    saveCategory: (input) => commit(saveCategory(getState(), input)),
    saveSupplier: (input) => commit(saveSupplier(getState(), input)),
    saveCustomer: (input) => commit(saveCustomer(getState(), input)),
    deleteCustomer: (id) => commit(deleteCustomer(getState(), id)),
    deleteBrand: (id) => {
      const state = getState();
      const used = state.products.some((product) => product.brandId === id);
      return commit(deleteByUsage(state, "brands", id, used));
    },
    deleteCategory: (id) => {
      const state = getState();
      const used = state.products.some((product) => product.categoryId === id);
      return commit(deleteByUsage(state, "categories", id, used));
    },
    deleteSupplier: (id) => {
      const state = getState();
      const used = state.products.some((product) => product.supplierId === id);
      return commit(deleteByUsage(state, "suppliers", id, used));
    },
    setRecordActive: (key, id, active) => {
      const state = getState();
      if (!canWrite(state.settings.demoRole)) return { ok: false, error: "Bu demo rolü değişiklik yapamaz" };
      const current = state[key].find((item) => item.id === id);
      if (!current) return { ok: false, error: "Kayıt bulunamadı" };
      return commit({
        ok: true,
        state: {
          ...state,
          [key]: state[key].map((item) => (item.id === id ? { ...item, active } : item)),
          activities: activity(state, `${current.name} ${active ? "aktif" : "pasif"}`, key, id),
        },
      });
    },
    saveRule: (input) => commit(saveRule(getState(), input)),
    setRuleActive: (id, active) => {
      const state = getState();
      if (!canWrite(state.settings.demoRole)) return { ok: false, error: "Bu demo rolü değişiklik yapamaz" };
      return commit({
        ok: true,
        state: {
          ...state,
          pricingRules: state.pricingRules.map((rule) => (
            rule.id === id ? { ...rule, active, updatedAt: new Date().toISOString(), updatedBy: state.settings.demoRole } : rule
          )),
          activities: activity(state, `Fiyat kuralı ${active ? "açıldı" : "kapatıldı"}`, "rule", id),
        },
      });
    },
    saveQuote: (input) => commit(saveQuote(getState(), input)),
    updateQuoteStatus: (id, status) => commit(updateQuoteStatus(getState(), id, status)),
    copyQuote: (id) => commit(copyQuote(getState(), id)),
    deleteQuote: (id) => commit(deleteQuote(getState(), id)),
    commitImport: (result, meta) => commit(commitImport(getState(), result, meta)),
    updateSettings: (patch) => commit(updateSettings(getState(), patch)),
    setDemoRole: (role) => commit(setDemoRole(getState(), role)),
    resetDemo: () => commit({ ok: true, state: createSeedState() }),
    replaceAll: (next) => {
      if (!next || next.version !== 1 || !next.settings) return { ok: false, error: "Yedek dosyası tanınmadı" };
      return commit({ ok: true, state: next });
    },
  };
}
