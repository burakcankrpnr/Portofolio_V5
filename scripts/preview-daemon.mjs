/**
 * Saatlik önizleme daemon'u.
 * Siteleri sırayla yakalar, popup kapatır, challenge sayfalarını kaydetmez.
 * Kullanım: node scripts/preview-daemon.mjs
 * Aralık: PREVIEW_INTERVAL_MS (varsayılan 1 saat)
 */
import { capturePortfolioPreviews } from "./capture-previews.mjs";

const HOUR_MS = 60 * 60 * 1000;
const intervalMs = Number(process.env.PREVIEW_INTERVAL_MS || HOUR_MS);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const runOnce = async () => {
  const started = new Date().toISOString();
  console.log(`[preview-daemon] ${started} — yenileme başlıyor`);

  try {
    await capturePortfolioPreviews({ all: true });
  } catch (error) {
    console.error(`[preview-daemon] hata: ${error.message}`);
  }
};

console.log(
  `[preview-daemon] çalışıyor. Aralık: ${Math.round(intervalMs / 60000)} dk`
);

await runOnce();

for (;;) {
  console.log(
    `[preview-daemon] sonraki kontrol ${Math.round(intervalMs / 60000)} dk sonra`
  );
  await sleep(intervalMs);
  await runOnce();
}
