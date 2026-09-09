import { access, mkdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const outDir = join(rootDir, "public", "previews");
const portfolioPath = join(rootDir, "src", "Pages", "Portofolio.jsx");

const forceAll = process.argv.includes("--all");
const missingOnly = !forceAll;

const chromePath =
  process.env.CHROME_PATH ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const consentSelectors = [
  "#onetrust-accept-btn-handler",
  ".cc-accept",
  ".cc-allow",
  "button#cookie-accept",
  '[data-testid="cookie-accept"]',
  'button:has-text("Kabul Et")',
  'button:has-text("Tümünü Kabul")',
  'button:has-text("Kabul")',
  'button:has-text("Anladım")',
  'button:has-text("Tamam")',
  'button:has-text("Accept all")',
  'button:has-text("Accept All")',
  'button:has-text("I agree")',
  'button:has-text("Allow all")',
  'button:has-text("Allow All")',
  'button:has-text("Got it")',
];

const hostnameFrom = (url) => new URL(url).hostname.replace(/^www\./, "");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fileExists = async (path) => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

const loadSitesFromPortfolio = async () => {
  const source = await readFile(portfolioPath, "utf8");
  const matches = [...source.matchAll(/Link:\s*"(https:\/\/[^"]+)"/g)];
  return [...new Set(matches.map((match) => match[1]))];
};

const dismissConsent = async (page) => {
  for (const selector of consentSelectors) {
    const button = page.locator(selector).first();
    if (await button.count()) {
      try {
        await button.click({ timeout: 1500 });
        await sleep(400);
        return;
      } catch {
        // try next selector
      }
    }
  }
};

const preparePage = async (page) => {
  await page.addStyleTag({
    content: `
      [data-aos],
      [data-aos].aos-init,
      [data-aos].aos-animate,
      .aos-init,
      [data-scroll],
      .swiper-slide,
      img {
        opacity: 1 !important;
        visibility: visible !important;
        transform: none !important;
        filter: none !important;
      }
      #onetrust-banner-sdk,
      .cc-window,
      .cookie-banner,
      #cookie-notice,
      .osano-cm-window {
        display: none !important;
      }
    `,
  });

  await page.evaluate(async () => {
    const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    document.querySelectorAll("img").forEach((img) => {
      img.loading = "eager";
      img.decoding = "sync";
      const lazySrc =
        img.dataset.src ||
        img.dataset.lazySrc ||
        img.dataset.original ||
        img.getAttribute("data-lazy");
      if (lazySrc && !img.src.includes(lazySrc)) {
        img.src = lazySrc;
      }
    });

    const maxY = () =>
      Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      );

    let previous = 0;
    for (let i = 0; i < 40; i += 1) {
      const height = maxY();
      window.scrollBy(0, Math.round(window.innerHeight * 0.7));
      await pause(350);
      if (window.scrollY + window.innerHeight >= height - 8) {
        await pause(700);
        if (maxY() <= height && height <= previous) break;
      }
      previous = height;
    }

    await Promise.all(
      [...document.images].map(
        (img) =>
          img.complete ||
          new Promise((resolve) => {
            img.addEventListener("load", resolve, { once: true });
            img.addEventListener("error", resolve, { once: true });
            setTimeout(resolve, 8000);
          })
      )
    );

    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    window.scrollTo(0, 0);
    await pause(800);
  });
};

const capture = async (browser, url) => {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  });

  page.setDefaultTimeout(45000);

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await sleep(1500);
    await dismissConsent(page);
    await preparePage(page);

    const file = join(outDir, `${hostnameFrom(url)}.jpg`);
    await page.screenshot({
      path: file,
      fullPage: true,
      type: "jpeg",
      quality: 82,
    });
    return file;
  } finally {
    await page.close();
  }
};

await mkdir(outDir, { recursive: true });

const sites = await loadSitesFromPortfolio();
const queue = [];

for (const url of sites) {
  const file = join(outDir, `${hostnameFrom(url)}.jpg`);
  if (missingOnly && (await fileExists(file))) {
    console.log(`skip ${hostnameFrom(url)}.jpg (exists)`);
    continue;
  }
  queue.push(url);
}

if (queue.length === 0) {
  console.log("All preview images are present. Nothing to capture.");
  process.exit(0);
}

console.log(`Capturing ${queue.length} missing preview(s)...`);

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
  args: ["--disable-dev-shm-usage", "--no-sandbox"],
});

for (const url of queue) {
  process.stdout.write(`Capturing ${url} ... `);
  try {
    await capture(browser, url);
    console.log(`ok (${hostnameFrom(url)}.jpg)`);
  } catch (error) {
    console.log(`FAIL: ${error.message}`);
  }
}

await browser.close();
console.log("Preview capture finished.");
