import { describe, expect, it } from "vitest";
import { applyImport, suggestMapping, validateFileMeta, validateRows } from "./excelImport.js";

const headers = ["Ürün Kodu", "Ürün Adı", "Tür", "Liste Fiyatı", "Maliyet"];
const mapping = suggestMapping(headers, "catalog");

describe("excel aktarımı", () => {
  it("başlıkları önerir ve kullanıcı eşlemesini bekler", () => {
    expect(mapping.code).toBe(0);
    expect(mapping.name).toBe(1);
    expect(mapping.costPrice).toBe(4);
  });

  it("desteklenmeyen dosyayı reddeder", () => {
    expect(validateFileMeta({ name: "makro.xlsm", size: 100 })).toMatch(/Makro/);
    expect(validateFileMeta({ name: "notlar.pdf", size: 100 })).toMatch(/XLSX veya CSV/);
  });

  it("eksik kodu satır numarasıyla raporlar", () => {
    const result = validateRows({
      data: [
        { rowNumber: 2, cells: ["", "Lamba", "Katalog", "100", ""] },
        { rowNumber: 3, cells: ["A-1", "Lamba", "Bilinmeyen", "abc", ""] },
      ],
      mapping,
      profile: "catalog",
      products: [],
      role: "admin",
    });
    expect(result.errors.some((error) => error.row === 2 && error.field === "code")).toBe(true);
    expect(result.errors.some((error) => error.row === 3 && error.field === "type")).toBe(true);
    expect(result.errors.some((error) => error.row === 3 && error.field === "listPrice")).toBe(true);
  });

  it("dosyadaki yinelenen kodu sessizce çoğaltmaz", () => {
    const result = validateRows({
      data: [
        { rowNumber: 2, cells: ["A-1", "Bir", "Katalog", "10", ""] },
        { rowNumber: 3, cells: ["A-1", "İki", "Katalog", "12", ""] },
      ],
      mapping,
      profile: "catalog",
      products: [],
      role: "admin",
    });
    expect(result.rows).toHaveLength(1);
    expect(result.errors.some((error) => error.row === 3)).toBe(true);
  });

  it("mevcut kodu yalnızca yeni modunda atlar", () => {
    const preview = validateRows({
      data: [{ rowNumber: 2, cells: ["A-1", "Yeni ad", "Katalog", "20", ""] }],
      mapping,
      profile: "catalog",
      products: [{ id: "p1", code: "A-1" }],
      role: "admin",
    });
    const applied = applyImport({
      rows: preview.rows,
      state: {
        products: [{ id: "p1", code: "A-1", name: "Eski", listPriceKurus: 100, brandId: "", categoryId: "", supplierId: "", type: "catalog" }],
        brands: [],
        categories: [],
        suppliers: [],
      },
      mode: "only-new",
      profile: "catalog",
      role: "admin",
    });
    expect(applied.added).toBe(0);
    expect(applied.skipped).toBe(1);
    expect(applied.products).toHaveLength(1);
    expect(applied.products[0].name).toBe("Eski");
  });

  it("satış rolünün maliyet sütununu engeller", () => {
    const result = validateRows({
      data: [{ rowNumber: 2, cells: ["A-1", "Ad", "Katalog", "10", "5"] }],
      mapping,
      profile: "catalog",
      products: [],
      role: "sales",
    });
    expect(result.blocked).toBe(true);
    expect(result.rows).toHaveLength(0);
  });
});
