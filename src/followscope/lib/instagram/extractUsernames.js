import { normalizeUsername, uniqueUsernames } from "./normalizeUsername.js";

/**
 * Pull a username from one Instagram export entry (multiple format generations).
 * @param {unknown} entry
 * @returns {string}
 */
export function usernameFromEntry(entry) {
  if (typeof entry === "string") return normalizeUsername(entry);
  if (!entry || typeof entry !== "object") return "";

  const object = /** @type {Record<string, unknown>} */ (entry);

  if (typeof object.value === "string") return normalizeUsername(object.value);
  if (typeof object.username === "string") return normalizeUsername(object.username);
  if (typeof object.title === "string" && object.title.trim()) {
    return normalizeUsername(object.title);
  }
  if (typeof object.href === "string") return normalizeUsername(object.href);

  const list = object.string_list_data;
  if (Array.isArray(list)) {
    for (const item of list) {
      const found = usernameFromEntry(item);
      if (found) return found;
    }
  }

  const labels = object.label_values;
  if (Array.isArray(labels)) {
    for (const item of labels) {
      if (!item || typeof item !== "object") continue;
      const row = /** @type {Record<string, unknown>} */ (item);
      const label = String(row.label || row.key || "").toLocaleLowerCase("en-US");
      if (label.includes("username") || label.includes("kullanıcı") || label.includes("user name")) {
        const found = usernameFromEntry(row.value ?? row);
        if (found) return found;
      }
      if (typeof row.value === "string" && row.value.includes("instagram.com")) {
        const found = normalizeUsername(row.value);
        if (found) return found;
      }
    }
  }

  return "";
}

/**
 * @param {unknown} json
 * @returns {{ usernames: string[], duplicates: string[], invalid: string[], entriesSeen: number }}
 */
export function extractUsernamesFromJson(json) {
  const collected = [];
  let entriesSeen = 0;

  const walkList = (list) => {
    if (!Array.isArray(list)) return;
    for (const entry of list) {
      entriesSeen += 1;
      const username = usernameFromEntry(entry);
      if (username) collected.push(username);
    }
  };

  if (Array.isArray(json)) {
    walkList(json);
  } else if (json && typeof json === "object") {
    const object = /** @type {Record<string, unknown>} */ (json);
    const preferredKeys = [
      "relationships_followers",
      "relationships_following",
      "followers",
      "following",
      "string_list_data",
    ];
    let matched = false;
    for (const key of preferredKeys) {
      if (Array.isArray(object[key])) {
        walkList(object[key]);
        matched = true;
      }
    }
    if (!matched) {
      for (const value of Object.values(object)) {
        if (Array.isArray(value) && value.length && typeof value[0] === "object") {
          walkList(value);
        }
      }
    }
  }

  const unique = uniqueUsernames(collected);
  return { ...unique, entriesSeen };
}
