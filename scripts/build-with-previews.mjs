/**
 * Build öncesi eksik önizlemeleri yakalar, sonra Vite build.
 * Chrome yoksa yakalamayı atlar (build yine devam eder).
 */
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const run = (command, args) =>
  new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: root,
      stdio: "inherit",
      shell: true,
      env: process.env,
    });
    child.on("exit", (code) => resolve(code ?? 0));
    child.on("error", () => resolve(1));
  });

console.log("[build] capturing missing previews (if Chrome available)...");
const captureCode = await run("node", ["scripts/capture-previews.mjs"]);
if (captureCode !== 0) {
  console.warn(
    "[build] preview capture skipped/failed — continuing with existing files"
  );
}

console.log("[build] vite build...");
const buildCode = await run("npx", ["vite", "build"]);
process.exit(buildCode);
