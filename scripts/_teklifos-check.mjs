import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("pageerror", (error) => errors.push(String(error)));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});

const fail = async (label) => {
  const text = await page.locator("body").innerText().catch(() => "");
  console.log("FAIL", label);
  console.log(text.slice(0, 1800));
  console.log("ERRORS", errors);
  await browser.close();
  process.exit(1);
};

await page.goto("http://localhost:5173/buse", { waitUntil: "networkidle" });
await page.waitForTimeout(600);
if (!(await page.getByRole("heading", { name: "Genel Bakış" }).count())) await fail("dashboard");
if (!(await page.getByText("EUR sayfasından").count())) await fail("source banner");
if (!(await page.getByRole("link", { name: "Ürünler" }).count())) await fail("nav");

await page.getByRole("textbox", { name: "Ara", exact: true }).fill("GKO6010");
await page.waitForTimeout(300);
await page.getByRole("button", { name: /GKO6010/ }).click();
await page.waitForTimeout(400);
if (!(await page.getByText("2li gazlı ocak").count())) await fail("product");

await page.getByRole("link", { name: "Teklifler" }).click();
await page.getByRole("button", { name: "Yeni teklif" }).click();
await page.getByRole("button", { name: "Müşteri ekle" }).click();
await page.getByLabel("Ad").fill("Deneme Cari");
await page.getByRole("dialog", { name: "Yeni müşteri" }).getByRole("button", { name: "Kaydet" }).click();
await page.waitForTimeout(400);
if (await page.getByRole("dialog").count()) {
  console.log("DIALOG STILL OPEN");
  console.log(await page.getByRole("dialog").innerText());
  console.log("ERRORS", errors);
  await fail("customer modal");
}
await page.getByLabel("Ürün ara").fill("GKO6010");
await page.getByRole("button", { name: "Ekle", exact: true }).first().click();
await page.getByRole("button", { name: "Kaydet", exact: true }).first().click();
await page.waitForTimeout(500);
const saved = await page.locator("h1").innerText();
if (!saved.startsWith("TKF-")) await fail(`saved ${saved}`);
if (!(await page.getByText("335,00").count())) await fail("price");

await page.getByLabel("Teklif durumu").selectOption("preparing");
await page.waitForTimeout(200);
await page.getByRole("button", { name: "PDF önizle" }).click();
try {
  await page.getByRole("dialog", { name: "PDF önizleme" }).waitFor({ timeout: 20000 });
} catch {
  await fail("pdf dialog");
}
try {
  await page.locator("[aria-label='Teklif PDF önizleme'] canvas").waitFor({ timeout: 20000 });
} catch {
  await fail("pdf canvas");
}
await page.keyboard.press("Escape");

await page.getByRole("link", { name: "Excel Aktarımı" }).click();
await page.locator('input[type="file"]').setInputFiles({
  name: "katalog.csv",
  mimeType: "text/csv",
  buffer: Buffer.from("Ürün Kodu,Ürün Adı,Tür,Liste Fiyatı\nYENI-1,Deneme Ürün,Katalog,\"1.250,00\"\n", "utf8"),
});
await page.getByLabel("Sayfa").waitFor({ timeout: 10000 });
await page.getByRole("button", { name: "Önizle" }).click();
if (!(await page.getByText("YENI-1").count())) await fail("preview");
await page.getByRole("button", { name: "Devam" }).click();
await page.getByRole("button", { name: "Aktar", exact: true }).click();
await page.waitForTimeout(300);
if (!(await page.getByText("Eklenen: 1").count())) await fail("import");

await page.setViewportSize({ width: 390, height: 800 });
await page.waitForTimeout(200);
const menu = page.getByRole("button", { name: "Menü" });
if (!(await menu.isVisible())) await fail("mobile menu");
await menu.click();
if (!(await page.getByRole("link", { name: "Müşteriler" }).isVisible())) await fail("drawer");

await page.setViewportSize({ width: 1280, height: 800 });
await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(700);
const home = await page.locator("body").innerText();
if (home.includes("TeklifOS")) await fail("home leaked");

console.log("OK", saved);
console.log("CONSOLE", errors.filter((item) => !item.includes("favicon")));
await browser.close();
