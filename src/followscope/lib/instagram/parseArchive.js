import JSZip from "jszip";
import { extractUsernamesFromJson } from "./extractUsernames.js";
import { findInstagramFiles } from "./findInstagramFiles.js";
import { analyzeLists } from "./analyze.js";

export const MAX_ARCHIVE_BYTES = 120 * 1024 * 1024;

/**
 * @param {File} file
 */
export function validateArchiveFile(file) {
  if (!file) return "Dosya seçin";
  const name = String(file.name || "").toLowerCase();
  if (!(name.endsWith(".zip") || name.endsWith(".json"))) {
    return "Yalnızca ZIP arşivi veya JSON dosyası yükleyin";
  }
  if (file.size === 0) return "Dosya boş";
  if (file.size > MAX_ARCHIVE_BYTES) return "Dosya 120 MB sınırını aşıyor";
  return "";
}

/**
 * @param {JSZip} zip
 * @param {string} path
 */
async function readZipJson(zip, path) {
  const entry = zip.file(path);
  if (!entry) throw new Error(`Dosya bulunamadı: ${path}`);
  const text = await entry.async("string");
  try {
    return JSON.parse(text);
  } catch {
    const error = new Error(`JSON biçimi beklenen yapıda değil: ${path}`);
    error.code = "INVALID_JSON";
    throw error;
  }
}

/**
 * @param {string[]} paths
 * @param {JSZip} zip
 * @param {"followers"|"following"} kind
 */
async function mergePaths(paths, zip, kind) {
  if (!paths.length) {
    const error = new Error(
      kind === "followers"
        ? "Takipçi dosyası bulunamadı (ör. connections/followers_and_following/followers_1.json)"
        : "Takip edilen dosyası bulunamadı (ör. connections/followers_and_following/following.json)"
    );
    error.code = kind === "followers" ? "MISSING_FOLLOWERS" : "MISSING_FOLLOWING";
    throw error;
  }

  const all = [];
  const warnings = [];
  let entriesSeen = 0;

  for (const path of paths) {
    const json = await readZipJson(zip, path);
    const extracted = extractUsernamesFromJson(json);
    entriesSeen += extracted.entriesSeen;
    all.push(...extracted.usernames);
    if (extracted.duplicates.length) {
      warnings.push(`${path}: ${extracted.duplicates.length} yinelenen kullanıcı adı atlandı`);
    }
    if (extracted.invalid.length) {
      warnings.push(`${path}: ${extracted.invalid.length} geçersiz kullanıcı adı atlandı`);
    }
  }

  const unique = [...new Set(all)].sort((a, b) => a.localeCompare(b, "en"));
  if (!unique.length) {
    const error = new Error(
      kind === "followers" ? "Takipçi listesi boş veya okunamadı" : "Takip edilen listesi boş veya okunamadı"
    );
    error.code = "EMPTY_LIST";
    throw error;
  }

  return { usernames: unique, warnings, entriesSeen, sourcePaths: paths };
}

/**
 * @param {File} file
 */
export async function parseInstagramArchive(file) {
  const metaError = validateArchiveFile(file);
  if (metaError) {
    return { ok: false, error: metaError, code: "INVALID_FILE" };
  }

  try {
    if (String(file.name || "").toLowerCase().endsWith(".json")) {
      const text = await file.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        return { ok: false, error: "JSON biçimi beklenen yapıda değil", code: "INVALID_JSON" };
      }
      const extracted = extractUsernamesFromJson(json);
      if (!extracted.usernames.length) {
        return {
          ok: false,
          error: "Tek JSON dosyasında takipçi/takip listesi bulunamadı. Tam ZIP arşivi yükleyin.",
          code: "MISSING_FILES",
        };
      }
      return {
        ok: false,
        error: "Tek JSON yeterli değil. Takipçi ve takip edilen listelerini içeren ZIP arşivini yükleyin.",
        code: "NEED_ZIP",
        details: { foundUsernames: extracted.usernames.length },
      };
    }

    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const paths = Object.keys(zip.files).filter((path) => !zip.files[path].dir);
    const found = findInstagramFiles(paths);

    const followers = await mergePaths(found.followers, zip, "followers");
    const following = await mergePaths(found.following, zip, "following");
    const analysis = analyzeLists(followers.usernames, following.usernames);
    const createdAt = new Date().toISOString();
    const snapshot = {
      id: crypto.randomUUID(),
      createdAt,
      followers: followers.usernames,
      following: following.usernames,
      sourceFileName: file.name,
    };

    return {
      ok: true,
      snapshot,
      analysis,
      warnings: [...followers.warnings, ...following.warnings],
      meta: {
        followerFiles: followers.sourcePaths,
        followingFiles: following.sourcePaths,
        followerEntries: followers.entriesSeen,
        followingEntries: following.entriesSeen,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Arşiv okunamadı";
    if (/password|encrypted/i.test(message)) {
      return { ok: false, error: "ZIP şifreli görünüyor; şifresiz arşiv yükleyin", code: "ENCRYPTED" };
    }
    if (/Invalid|corrupt|end of central/i.test(message)) {
      return { ok: false, error: "ZIP dosyası bozuk", code: "CORRUPT_ZIP" };
    }
    return {
      ok: false,
      error: message,
      code: error?.code || "PARSE_FAILED",
    };
  }
}
