import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

const children = [];

const start = (command, args, label) => {
  const child = spawn(command, args, {
    cwd: rootDir,
    stdio: "inherit",
    shell: true,
    env: process.env,
  });

  child.on("error", (error) => {
    console.error(`[${label}] ${error.message}`);
  });

  children.push(child);
  return child;
};

const vite = start("npx", ["vite", ...process.argv.slice(2)], "vite");

// Only missing previews — existing files are skipped
start("node", ["scripts/capture-previews.mjs"], "previews");

const shutdown = (code = 0) => {
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  process.exit(code);
};

vite.on("exit", (code) => shutdown(code ?? 0));

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
