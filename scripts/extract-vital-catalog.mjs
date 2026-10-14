import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";

const source = "C:/Users/Dtf Casper/Downloads/Teklif_Urun_Secimli_SÜPER.xlsm";
const workbook = XLSX.readFile(source, { cellFormula: false, bookVBA: false });
const rows = XLSX.utils.sheet_to_json(workbook.Sheets.EUR, { header: 1, raw: false, defval: "" });

function euroToKurus(raw) {
  const text = String(raw || "").replace(/€/g, "").replace(/\s/g, "").trim();
  if (!text) return 0;
  const normalized = text.includes(",") && text.includes(".")
    ? text.replace(/,/g, "")
    : text.replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(normalized)) return 0;
  const [whole, frac = ""] = normalized.split(".");
  const padded = `${frac}000`.slice(0, 3);
  let kurus = Number(whole) * 100 + Number(padded.slice(0, 2));
  if (Number(padded[2]) >= 5) kurus += 1;
  return kurus;
}

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

let category = "";
let series = "";
const seen = new Set();
const products = [];
const categories = [];

for (let index = 9; index < rows.length; index += 1) {
  const row = rows[index];
  const nextCategory = clean(row[2]);
  const nextSeries = clean(row[3]);
  if (nextCategory) category = nextCategory;
  if (nextSeries) series = nextSeries;
  const code = clean(row[9]);
  if (!code) continue;
  const key = code.toLocaleLowerCase("tr-TR");
  if (seen.has(key)) continue;
  seen.add(key);
  if (category && !categories.includes(category)) categories.push(category);
  const keyword = clean(row[4]);
  const turkish = keyword.split(",")[0].trim();
  const nameEn = clean(row[5]);
  const name = turkish && turkish.toLocaleLowerCase("tr-TR") !== key ? turkish : (nameEn || code);
  const specs = String(row[19] || "").replace(/\r/g, "").trim().slice(0, 420);
  products.push({
    code,
    name: name.slice(0, 140),
    nameEn: nameEn.slice(0, 140),
    category,
    series,
    brand: clean(row[8]) || "VİTAL",
    measure: clean(row[7]),
    saleKurus: euroToKurus(row[11]),
    listKurus: euroToKurus(row[14]),
    packageSize: clean(row[17]),
    packageKg: clean(row[18]),
    specs,
  });
}

const payload = {
  sourceFile: "Teklif_Urun_Secimli_SÜPER.xlsm",
  sheet: "EUR",
  discountPercent: 64,
  rates: { USD: 48, EUR: 56 },
  marginNote: "Dosyada KAR PAYI 1,25 yazıyor. Hangi fiyat yöntemine karşılık geldiği doğrulanmadığı için otomatik uygulanmaz.",
  categories,
  products,
};

const out = join(dirname(fileURLToPath(import.meta.url)), "../src/teklifos/data/eurCatalog.json");
await writeFile(out, JSON.stringify(payload));
console.log(`products ${products.length} categories ${categories.length}`);
