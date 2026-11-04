/**
 * .env içindeki OPENAI_* değerlerini Vercel’e yazar.
 * Önce: npx vercel login && npx vercel link
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, ".env");

if (!existsSync(envPath)) {
  console.error(".env bulunamadı");
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    })
);

const pairs = [
  ["OPENAI_API_KEY", env.OPENAI_API_KEY],
  ["OPENAI_MODEL", env.OPENAI_MODEL || "gpt-4o-mini"],
];

for (const [name, value] of pairs) {
  if (!value) {
    console.error(`${name} .env içinde yok`);
    process.exit(1);
  }
  for (const target of ["production", "preview", "development"]) {
    console.log(`→ ${name} (${target})`);
    const result = spawnSync(
      "npx",
      ["vercel", "env", "add", name, target, "--force"],
      {
        cwd: root,
        input: `${value}\n`,
        encoding: "utf8",
        shell: true,
      }
    );
    if (result.status !== 0) {
      console.error(result.stdout || "");
      console.error(result.stderr || "");
      console.error(`Başarısız: ${name} / ${target}. Önce: npx vercel login`);
      process.exit(result.status || 1);
    }
  }
}

console.log("Tamam. Redeploy et: npx vercel --prod");
