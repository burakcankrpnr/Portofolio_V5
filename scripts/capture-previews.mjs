import { access, mkdir, readFile, rename, unlink } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const outDir = join(rootDir, "public", "previews");
const portfolioPath = join(rootDir, "src", "data", "projects.js");

const forceAll = process.argv.includes("--all");
const onlyArg = process.argv.find((arg) => arg.startsWith("--only="));
const onlyHosts = onlyArg
  ? onlyArg
      .slice("--only=".length)
      .split(",")
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean)
  : [];
const delayMs = Number(process.env.PREVIEW_DELAY_MS || 2500);

const chromeCandidates = [
  process.env.CHROME_PATH,
  process.env.PLAYWRIGHT_CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/snap/bin/chromium",
].filter(Boolean);

const consentSelectors = [
  "#onetrust-accept-btn-handler",
  ".cc-accept",
  ".cc-allow",
  ".cc-dismiss",
  "button#cookie-accept",
  '[data-testid="cookie-accept"]',
  '[aria-label="Close"]',
  '[aria-label="Kapat"]',
  'button[aria-label*="close" i]',
  'button[aria-label*="kapat" i]',
  ".modal-close",
  ".popup-close",
  ".close-button",
  "button.close",
  'button:has-text("Tümünü kabul et")',
  'button:has-text("Tümünü Kabul Et")',
  'button:has-text("Sadece gerekli")',
  'button:has-text("Reddet")',
  'button:has-text("Tercihler")',
  'button:has-text("Accept Cookies")',
  'button:has-text("Reject")',
  'button:has-text("Decline")',
  'button:has-text("Kabul Et")',
  'button:has-text("Tümünü Kabul")',
  'button:has-text("Kabul")',
  'button:has-text("Anladım")',
  'button:has-text("Tamam")',
  'button:has-text("Kapat")',
  'button:has-text("Vazgeç")',
  'button:has-text("Accept all")',
  'button:has-text("Accept All")',
  'button:has-text("Accept")',
  'button:has-text("I agree")',
  'button:has-text("Allow all")',
  'button:has-text("Allow All")',
  'button:has-text("Got it")',
  'button:has-text("Agree")',
  'button:has-text("Continue")',
  'button:has-text("Devam")',
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

const resolveChrome = async () => {
  for (const candidate of chromeCandidates) {
    if (await fileExists(candidate)) return candidate;
  }
  return undefined;
};

const loadSitesFromPortfolio = async () => {
  const source = await readFile(portfolioPath, "utf8");
  const matches = [...source.matchAll(/Link:\s*"(https:\/\/[^"]+)"/g)];
  return [...new Set(matches.map((match) => match[1]))];
};

const dismissPopups = async (page) => {
  // Birkaç tur dene — geç açılan cookie / modal için
  for (let round = 0; round < 4; round += 1) {
    await sleep(round === 0 ? 1200 : 900);

    for (const selector of consentSelectors) {
      const button = page.locator(selector).first();
      try {
        if ((await button.count()) === 0) continue;
        if (!(await button.isVisible().catch(() => false))) continue;
        await button.click({ timeout: 1200 });
        await sleep(350);
      } catch {
        // sıradaki
      }
    }

    await page.keyboard.press("Escape").catch(() => {});

    await page
      .evaluate(() => {
        const hide = (el) => {
          if (!el) return;
          el.style.setProperty("display", "none", "important");
          el.style.setProperty("visibility", "hidden", "important");
          el.style.setProperty("pointer-events", "none", "important");
          el.setAttribute("aria-hidden", "true");
        };

        const selectors = [
          "#onetrust-banner-sdk",
          "#onetrust-consent-sdk",
          ".cc-window",
          ".cookie-banner",
          "#cookie-notice",
          ".osano-cm-window",
          "[id*='cookie' i]",
          "[class*='cookie' i]",
          "[class*='consent' i]",
          "[class*='popup' i]",
          "[class*='modal' i]",
          "[role='dialog']",
          ".Fancybox",
          ".fancybox-container",
        ];

        selectors.forEach((sel) => {
          document.querySelectorAll(sel).forEach(hide);
        });

        // Tam ekran overlay / backdrop
        document.querySelectorAll("div, section, aside").forEach((el) => {
          const style = window.getComputedStyle(el);
          if (style.position !== "fixed" && style.position !== "sticky") return;
          const z = Number.parseInt(style.zIndex || "0", 10);
          if (Number.isNaN(z) || z < 20) return;
          const rect = el.getBoundingClientRect();
          if (rect.width < window.innerWidth * 0.4) return;
          if (rect.height < 80) return;
          const text = (el.innerText || "").toLowerCase();
          if (
            text.includes("cookie") ||
            text.includes("çerez") ||
            text.includes("kabul") ||
            text.includes("newsletter") ||
            text.includes("abone") ||
            text.includes("popup") ||
            text.includes("izin")
          ) {
            hide(el);
          }
        });
      })
      .catch(() => {});
  }
};

const isChallengePage = async (page) => {
  const info = await page.evaluate(() => {
    const title = (document.title || "").toLowerCase();
    const body = (document.body?.innerText || "").toLowerCase().slice(0, 2500);
    const html = document.documentElement?.innerHTML?.slice(0, 8000) || "";
    return { title, body, html };
  });

  const blob = `${info.title}\n${info.body}\n${info.html}`;
  return (
    blob.includes("just a moment") ||
    blob.includes("perform security verification") ||
    blob.includes("verify you are human") ||
    blob.includes("cf-browser-verification") ||
    blob.includes("cf-challenge") ||
    blob.includes("challenge-platform") ||
    blob.includes("attention required") ||
    blob.includes("checking your browser") ||
    blob.includes("enable javascript and cookies")
  );
};

const preparePage = async (page) => {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
        scroll-behavior: auto !important;
      }
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
      #onetrust-consent-sdk,
      .cc-window,
      .cookie-banner,
      #cookie-notice,
      .osano-cm-window,
      [role="dialog"],
      .fancybox-container {
        display: none !important;
        visibility: hidden !important;
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

    // Full-page screenshot'ta sticky/fixed header kaymasını engelle
    window.scrollTo(0, 0);
    await pause(600);

    document.querySelectorAll("body *").forEach((el) => {
      const style = window.getComputedStyle(el);
      if (style.position !== "fixed" && style.position !== "sticky") return;
      const rect = el.getBoundingClientRect();
      if (rect.height <= 0 || rect.width <= 0) return;
      if (rect.top > 140) return;
      if (rect.height > window.innerHeight * 0.45) return;
      el.style.setProperty("position", "relative", "important");
      el.style.setProperty("top", "0", "important");
      el.style.setProperty("bottom", "auto", "important");
      el.style.setProperty("transform", "none", "important");
      el.style.setProperty("inset", "auto", "important");
    });

    await pause(900);
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

  const file = join(outDir, `${hostnameFrom(url)}.jpg`);
  const tempFile = `${file}.tmp.jpg`;

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
    await sleep(2000);

    // Challenge varsa biraz bekle (bazen geçer)
    if (await isChallengePage(page)) {
      await sleep(8000);
      await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    }

    if (await isChallengePage(page)) {
      throw new Error("Cloudflare/security challenge — eski önizleme korunuyor");
    }

    await dismissPopups(page);
    await sleep(1500);
    await dismissPopups(page);
    await preparePage(page);

    if (await isChallengePage(page)) {
      throw new Error("Challenge sonrası içerik yok — kayıt atlandı");
    }

    await page.screenshot({
      path: tempFile,
      fullPage: true,
      type: "jpeg",
      quality: 82,
    });

    await rename(tempFile, file);
    return file;
  } catch (error) {
    await unlink(tempFile).catch(() => {});
    throw error;
  } finally {
    await page.close();
  }
};

export const capturePortfolioPreviews = async (options = {}) => {
  const forceAll =
    options.all === true ||
    process.argv.includes("--all") ||
    onlyHosts.length > 0;
  const missingOnly = !forceAll;

  await mkdir(outDir, { recursive: true });

  const sites = await loadSitesFromPortfolio();
  const queue = [];

  for (const url of sites) {
    const host = hostnameFrom(url).toLowerCase();
    if (onlyHosts.length > 0 && !onlyHosts.includes(host)) {
      continue;
    }
    const file = join(outDir, `${host}.jpg`);
    if (missingOnly && (await fileExists(file))) {
      console.log(`skip ${host}.jpg (exists)`);
      continue;
    }
    queue.push(url);
  }

  if (queue.length === 0) {
    console.log("All preview images are present. Nothing to capture.");
    return { captured: 0, failed: 0, skipped: sites.length };
  }

  console.log(`Capturing ${queue.length} preview(s) sequentially...`);

  const executablePath = await resolveChrome();
  const browser = await chromium.launch({
    executablePath,
    headless: true,
    args: ["--disable-dev-shm-usage", "--no-sandbox"],
  });

  let captured = 0;
  let failed = 0;

  try {
    for (const url of queue) {
      process.stdout.write(`Capturing ${url} ... `);
      try {
        await capture(browser, url);
        captured += 1;
        console.log(`ok (${hostnameFrom(url)}.jpg)`);
      } catch (error) {
        failed += 1;
        console.log(`FAIL: ${error.message}`);
      }
      await sleep(delayMs);
    }
  } finally {
    await browser.close();
  }

  console.log(`Preview capture finished. ok=${captured} fail=${failed}`);
  return { captured, failed, skipped: sites.length - queue.length };
};

const isDirectRun = (() => {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return fileURLToPath(import.meta.url).replace(/\\/g, "/") ===
      entry.replace(/\\/g, "/");
  } catch {
    return entry.includes("capture-previews");
  }
})();

if (isDirectRun) {
  capturePortfolioPreviews().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
