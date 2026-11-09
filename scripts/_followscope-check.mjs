import { chromium } from "playwright-core";
import JSZip from "jszip";

const zip = new JSZip();
zip.file(
  "connections/followers_and_following/followers_1.json",
  JSON.stringify([
    { string_list_data: [{ value: "ayse" }] },
    { string_list_data: [{ value: "mehmet" }] },
    { string_list_data: [{ value: "zeynep" }] },
  ]),
);
zip.file(
  "connections/followers_and_following/following.json",
  JSON.stringify({
    relationships_following: [
      { string_list_data: [{ value: "mehmet" }] },
      { string_list_data: [{ value: "zeynep" }] },
      { string_list_data: [{ value: "burak" }] },
      { string_list_data: [{ value: "can" }] },
    ],
  }),
);
const bytes = await zip.generateAsync({ type: "nodebuffer" });

const browser = await chromium.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on("pageerror", (error) => errors.push(String(error)));

const fail = async (label) => {
  console.log("FAIL", label);
  console.log((await page.locator("body").innerText()).slice(0, 1500));
  console.log("ERRORS", errors);
  await browser.close();
  process.exit(1);
};

await page.goto("http://localhost:5173/followscope", { waitUntil: "networkidle" });
await page.locator('input[type="file"]').setInputFiles({
  name: "instagram-export.zip",
  mimeType: "application/zip",
  buffer: bytes,
});
await page.waitForTimeout(1500);

const kpi = await page.locator(".fs-kpis").innerText();
if (!kpi.includes("3") || !kpi.includes("4")) await fail("kpi counts");

const nav = page.getByRole("navigation", { name: "FollowScope" });
await nav.getByRole("link", { name: "Geri Takip Etmeyenler", exact: true }).click();
await page.waitForTimeout(400);
if (!(await page.getByText("@burak").count())) await fail("burak");
if (!(await page.getByText("@can").count())) await fail("can");

await nav.getByRole("link", { name: "Takip Etmediklerim", exact: true }).click();
await page.waitForTimeout(300);
if (!(await page.getByText("@ayse").count())) await fail("ayse");

await nav.getByRole("link", { name: "Karşılıklı Takip", exact: true }).click();
await page.waitForTimeout(300);
if (!(await page.getByText("@mehmet").count())) await fail("mehmet");
if (!(await page.getByText("@zeynep").count())) await fail("zeynep");

await nav.getByRole("link", { name: "Değişim Geçmişi", exact: true }).click();
await page.waitForTimeout(300);
const hist = await page.locator("body").innerText();
if (!hist.includes("karşılaştırma") && !hist.includes("Karşılaştırma") && !hist.includes("snapshot")) {
  await fail("history empty-state");
}

await nav.getByRole("link", { name: "Ayarlar", exact: true }).click();
await page.waitForTimeout(200);
if (!(await page.getByText("Gizlilik").count())) await fail("settings");

await page.setViewportSize({ width: 390, height: 800 });
await page.waitForTimeout(200);
if (!(await page.getByRole("button", { name: "Menü" }).isVisible())) await fail("mobile");

console.log("OK");
console.log("ERRORS", errors);
await browser.close();
