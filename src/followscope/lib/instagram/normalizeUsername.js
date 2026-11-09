/**
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeUsername(value) {
  if (value == null) return "";
  let text = String(value).trim();
  if (!text) return "";
  text = text.replace(/^@+/, "");
  text = text.replace(/^https?:\/\/(www\.)?instagram\.com\/_u\//i, "");
  text = text.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "");
  text = text.split(/[/?#]/)[0] || "";
  text = text.trim().replace(/\/+$/, "");
  return text.toLocaleLowerCase("en-US");
}

/**
 * @param {string} username
 * @returns {boolean}
 */
export function isValidUsername(username) {
  return /^[a-z0-9._]{1,30}$/.test(username);
}

/**
 * @param {Iterable<string>} values
 * @returns {{ usernames: string[], duplicates: string[], invalid: string[] }}
 */
export function uniqueUsernames(values) {
  const seen = new Set();
  const usernames = [];
  const duplicates = [];
  const invalid = [];
  for (const raw of values) {
    const username = normalizeUsername(raw);
    if (!username) continue;
    if (!isValidUsername(username)) {
      invalid.push(username);
      continue;
    }
    if (seen.has(username)) {
      duplicates.push(username);
      continue;
    }
    seen.add(username);
    usernames.push(username);
  }
  usernames.sort((a, b) => a.localeCompare(b, "en"));
  return { usernames, duplicates, invalid };
}
