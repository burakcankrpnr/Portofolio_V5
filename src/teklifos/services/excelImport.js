import { canImportCosts } from "../domain/permissions.js";
import { parseMoneyToKurus, parsePercentToBps } from "../domain/money.js";
import { normalizeProductType } from "../domain/labels.js";

export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
export const MAX_IMPORT_ROWS = 2000;

export const CATALOG_FIELDS = [
  { id: "code", label: "Ürün kodu", required: true },
  { id: "name", label: "Ürün adı", required: true },
  { id: "brand", label: "Marka" },
  { id: "category", label: "Kategori" },
  { id: "type", label: "Ürün türü" },
  { id: "listPrice", label: "Liste fiyatı" },
  { id: "costPrice", label: "Alış / maliyet", restricted: true },
  { id: "description", label: "Açıklama" },
  { id: "supplier", label: "Tedarikçi" },
  { id: "supplierDiscount", label: "Tedarikçi iskontosu", restricted: true },
];

export const COST_FIELDS = [
  { id: "code", label: "Ürün kodu", required: true },
  { id: "costPrice", label: "Alış / maliyet", required: true, restricted: true },
  { id: "supplierDiscount", label: "Tedarikçi iskontosu", restricted: true },
  { id: "supplier", label: "Tedarikçi" },
];

const ALIASES = {
  code: ["kod", "urun kodu", "urun kod", "stok kodu", "sku", "code", "product code"],
  name: ["ad", "urun adi", "urun ad", "name", "product name", "urun"],
  brand: ["marka", "brand"],
  category: ["kategori", "category"],
  type: ["tur", "urun turu", "type", "urun tipi"],
  listPrice: ["liste fiyati", "satis fiyati", "fiyat", "list price", "price", "birim fiyat"],
  costPrice: ["alis", "alis fiyati", "maliyet", "cost", "cost price"],
  description: ["aciklama", "description", "tanim"],
  supplierDiscount: ["tedarikci iskonto", "iskonto", "discount", "iskonto orani"],
  supplier: ["tedarikci", "supplier"],
};

export function fieldsForProfile(profile) {
  return profile === "cost" ? COST_FIELDS : CATALOG_FIELDS;
}

export function fold(value) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i")
    .replaceAll("i̇", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function validateFileMeta(file) {
  if (!file) return "Dosya seçin";
  const name = String(file.name || "").toLowerCase();
  if (name.endsWith(".xlsm") || name.endsWith(".xlsb")) {
    return "Makro veya ikili çalışma kitabı kabul edilmez";
  }
  if (!(name.endsWith(".xlsx") || name.endsWith(".csv"))) {
    return "Yalnızca XLSX veya CSV yükleyin";
  }
  if (file.size === 0) return "Dosya boş";
  if (file.size > MAX_IMPORT_BYTES) return "Dosya 5 MB sınırını aşıyor";
  return "";
}

export function suggestMapping(headers, profile) {
  const mapping = {};
  const used = new Set();
  for (const field of fieldsForProfile(profile)) {
    const aliases = ALIASES[field.id] || [];
    const index = headers.findIndex((header, column) => {
      if (used.has(column)) return false;
      return aliases.includes(fold(header));
    });
    if (index >= 0) {
      mapping[field.id] = index;
      used.add(index);
    } else {
      mapping[field.id] = "";
    }
  }
  return mapping;
}

export function readTable(matrix, headerRowNumber = 1) {
  const headerIndex = Math.max(0, Number(headerRowNumber) - 1);
  const headerRow = matrix[headerIndex] || [];
  const headers = headerRow.map((cell, index) => String(cell ?? "").trim() || `Sütun ${index + 1}`);
  const data = [];
  for (let rowIndex = headerIndex + 1; rowIndex < matrix.length; rowIndex += 1) {
    const row = matrix[rowIndex] || [];
    if (row.every((cell) => String(cell ?? "").trim() === "")) continue;
    data.push({
      rowNumber: rowIndex + 1,
      cells: headers.map((_, index) => row[index] ?? ""),
    });
  }
  return { headers, data };
}

function cell(entry, mapping, field) {
  const index = mapping[field];
  if (index === "" || index == null) return "";
  return entry.cells[index] ?? "";
}

export function validateRows({ data, mapping, profile, products, role }) {
  const fields = fieldsForProfile(profile);
  const restricted = fields.filter((field) => field.restricted && mapping[field.id] !== "" && mapping[field.id] != null);
  if (restricted.length && !canImportCosts(role)) {
    return {
      ok: false,
      blocked: true,
      errors: [{
        row: 0,
        field: "yetki",
        message: "Maliyet sütunlarını bu demo rolü içe aktaramaz",
      }],
      warnings: [],
      rows: [],
    };
  }
  const missingRequired = fields.filter((field) => field.required && (mapping[field.id] === "" || mapping[field.id] == null));
  if (missingRequired.length) {
    return {
      ok: false,
      blocked: true,
      errors: missingRequired.map((field) => ({
        row: 0,
        field: field.id,
        message: `${field.label} sütunu eşleştirilmedi`,
      })),
      warnings: [],
      rows: [],
    };
  }
  if (data.length > MAX_IMPORT_ROWS) {
    return {
      ok: false,
      blocked: true,
      errors: [{ row: 0, field: "dosya", message: `En fazla ${MAX_IMPORT_ROWS} satır aktarılabilir` }],
      warnings: [],
      rows: [],
    };
  }

  const errors = [];
  const warnings = [];
  const rows = [];
  const seen = new Map();

  for (const entry of data) {
    const code = String(cell(entry, mapping, "code")).trim();
    if (!code) {
      errors.push({ row: entry.rowNumber, field: "code", message: "Ürün kodu eksik" });
      continue;
    }
    const key = code.toLocaleLowerCase("tr-TR");
    if (seen.has(key)) {
      errors.push({
        row: entry.rowNumber,
        field: "code",
        message: `Yinelenen kod (${code}), satır ${seen.get(key)} ile çakışıyor`,
      });
      continue;
    }
    seen.set(key, entry.rowNumber);

    const draft = { rowNumber: entry.rowNumber, code };
    let rowFailed = false;

    if (profile !== "cost") {
      const name = String(cell(entry, mapping, "name")).trim();
      if (!name) {
        errors.push({ row: entry.rowNumber, field: "name", message: "Ürün adı eksik" });
        rowFailed = true;
      }
      draft.name = name;
      draft.brand = String(cell(entry, mapping, "brand")).trim();
      draft.category = String(cell(entry, mapping, "category")).trim();
      draft.description = String(cell(entry, mapping, "description")).trim();
      const typeRaw = String(cell(entry, mapping, "type")).trim();
      if (!typeRaw) {
        draft.type = "catalog";
        warnings.push({ row: entry.rowNumber, field: "type", message: "Ürün türü boş, Katalog kabul edildi" });
      } else {
        const type = normalizeProductType(typeRaw);
        if (!type) {
          errors.push({ row: entry.rowNumber, field: "type", message: `Bilinmeyen ürün türü: ${typeRaw}` });
          rowFailed = true;
        } else {
          draft.type = type;
        }
      }
      const listRaw = String(cell(entry, mapping, "listPrice")).trim();
      if (listRaw) {
        const money = parseMoneyToKurus(listRaw);
        if (money == null) {
          errors.push({ row: entry.rowNumber, field: "listPrice", message: "Liste fiyatı okunamadı" });
          rowFailed = true;
        } else {
          draft.listPriceKurus = money;
        }
      } else {
        draft.listPriceKurus = null;
      }
    }

    if (mapping.costPrice !== "" && mapping.costPrice != null) {
      const costRaw = String(cell(entry, mapping, "costPrice")).trim();
      if (!costRaw && profile === "cost") {
        errors.push({ row: entry.rowNumber, field: "costPrice", message: "Maliyet boş" });
        rowFailed = true;
      } else if (costRaw) {
        const money = parseMoneyToKurus(costRaw);
        if (money == null) {
          errors.push({ row: entry.rowNumber, field: "costPrice", message: "Maliyet okunamadı" });
          rowFailed = true;
        } else {
          draft.costKurus = money;
        }
      }
    }

    if (mapping.supplierDiscount !== "" && mapping.supplierDiscount != null) {
      const rateRaw = String(cell(entry, mapping, "supplierDiscount")).trim();
      if (rateRaw) {
        const bps = parsePercentToBps(rateRaw);
        if (bps == null || bps > 10000) {
          errors.push({ row: entry.rowNumber, field: "supplierDiscount", message: "İskonto oranı geçersiz" });
          rowFailed = true;
        } else {
          draft.supplierDiscountBps = bps;
        }
      }
    }

    if (mapping.supplier !== "" && mapping.supplier != null) {
      draft.supplier = String(cell(entry, mapping, "supplier")).trim();
    }

    const existing = products.find((product) => product.code.trim().toLocaleLowerCase("tr-TR") === key);
    draft.existingId = existing?.id || null;
    if (!rowFailed) rows.push(draft);
  }

  return { ok: errors.length === 0, blocked: false, errors, warnings, rows };
}

function findOrCreate(list, name, factory) {
  if (!name) return { list, id: "" , created: false };
  const found = list.find((item) => item.name.trim().toLocaleLowerCase("tr-TR") === name.toLocaleLowerCase("tr-TR"));
  if (found) return { list, id: found.id, created: false };
  const created = factory(name);
  return { list: [...list, created], id: created.id, created: true };
}

export function applyImport({ rows, state, mode, profile, role }) {
  if (!canImportCosts(role)) {
    const touchesCost = rows.some((row) => row.costKurus != null || row.supplierDiscountBps != null);
    if (touchesCost || profile === "cost") {
      return {
        ok: false,
        error: "Maliyet aktarımı bu demo rolünde kapalı",
        added: 0,
        updated: 0,
        skipped: 0,
        failed: rows.length,
      };
    }
  }

  let products = state.products.slice();
  let brands = state.brands.slice();
  let categories = state.categories.slice();
  let suppliers = state.suppliers.slice();
  let added = 0;
  let updated = 0;
  let skipped = 0;
  const notes = [];

  for (const row of rows) {
    const exists = products.find((product) => product.id === row.existingId)
      || products.find((product) => product.code.trim().toLocaleLowerCase("tr-TR") === row.code.toLocaleLowerCase("tr-TR"));
    if (exists && (mode === "only-new" || mode === "skip")) {
      skipped += 1;
      notes.push({ row: row.rowNumber, message: `${row.code} atlandı (kayıt var)` });
      continue;
    }
    if (!exists && mode === "update") {
      skipped += 1;
      notes.push({ row: row.rowNumber, message: `${row.code} atlandı (eşleşen ürün yok)` });
      continue;
    }

    let brandId = exists?.brandId || "";
    if (row.brand) {
      const brand = findOrCreate(brands, row.brand, (name) => ({
        id: crypto.randomUUID(),
        name,
        email: "",
        phone: "",
        notes: "",
        defaultDiscountBps: 0,
        active: true,
      }));
      brands = brand.list;
      brandId = brand.id;
      if (brand.created) notes.push({ row: row.rowNumber, message: `Yeni marka: ${row.brand}` });
    }
    let categoryId = exists?.categoryId || "";
    if (row.category) {
      const category = findOrCreate(categories, row.category, (name) => ({
        id: crypto.randomUUID(),
        name,
        active: true,
      }));
      categories = category.list;
      categoryId = category.id;
      if (category.created) notes.push({ row: row.rowNumber, message: `Yeni kategori: ${row.category}` });
    }
    let supplierId = exists?.supplierId || "";
    if (row.supplier) {
      const supplier = findOrCreate(suppliers, row.supplier, (name) => ({
        id: crypto.randomUUID(),
        name,
        email: "",
        phone: "",
        notes: "",
        defaultDiscountBps: 0,
        active: true,
      }));
      suppliers = supplier.list;
      supplierId = supplier.id;
      if (supplier.created) notes.push({ row: row.rowNumber, message: `Yeni tedarikçi: ${row.supplier}` });
    }

    if (!exists) {
      products = [{
        id: crypto.randomUUID(),
        code: row.code,
        name: row.name || row.code,
        description: row.description || "",
        brandId,
        categoryId,
        supplierId,
        type: row.type || "catalog",
        imageDataUrl: "",
        measures: { widthMm: "", heightMm: "", depthMm: "", unit: "mm" },
        attributes: [],
        listPriceKurus: row.listPriceKurus || 0,
        costKurus: row.costKurus || 0,
        supplierDiscountBps: row.supplierDiscountBps || 0,
        pricingRuleId: "",
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, ...products];
      added += 1;
      continue;
    }

    products = products.map((product) => {
      if (product.id !== exists.id) return product;
      return {
        ...product,
        name: profile === "cost" ? product.name : (row.name || product.name),
        description: row.description ?? product.description,
        brandId: row.brand ? brandId : product.brandId,
        categoryId: row.category ? categoryId : product.categoryId,
        supplierId: row.supplier ? supplierId : product.supplierId,
        type: profile === "cost" ? product.type : (row.type || product.type),
        listPriceKurus: row.listPriceKurus == null ? product.listPriceKurus : row.listPriceKurus,
        costKurus: row.costKurus == null ? product.costKurus : row.costKurus,
        supplierDiscountBps: row.supplierDiscountBps == null ? product.supplierDiscountBps : row.supplierDiscountBps,
        updatedAt: new Date().toISOString(),
      };
    });
    updated += 1;
  }

  return {
    ok: true,
    added,
    updated,
    skipped,
    failed: 0,
    notes,
    products,
    brands,
    categories,
    suppliers,
  };
}

export function errorsToCsv(errors) {
  const lines = ["Satır;Alan;Açıklama"];
  for (const error of errors) {
    const message = String(error.message || "").replaceAll(";", ",");
    lines.push(`${error.row};${error.field};${message}`);
  }
  return `\uFEFF${lines.join("\n")}`;
}

export async function readSpreadsheet(file) {
  const XLSX = await import("xlsx");
  const name = String(file.name || "").toLowerCase();
  const workbook = name.endsWith(".csv")
    ? XLSX.read(await file.text(), { type: "string", cellFormula: false, cellHTML: false })
    : XLSX.read(await file.arrayBuffer(), {
      type: "array",
      codepage: 65001,
      cellFormula: false,
      cellHTML: false,
      bookVBA: false,
    });
  return workbook.SheetNames.map((name) => {
    const sheet = workbook.Sheets[name];
    const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "" });
    return { name, matrix };
  });
}
