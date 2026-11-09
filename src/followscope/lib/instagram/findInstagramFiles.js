/**
 * @param {string} path
 */
function foldPath(path) {
  return String(path || "")
    .replace(/\\/g, "/")
    .toLocaleLowerCase("en-US");
}

/**
 * @param {string} path
 */
export function classifyRelationshipFile(path) {
  const name = foldPath(path).split("/").pop() || "";
  if (!name.endsWith(".json")) return null;
  if (name.startsWith("followers") || name.includes("relationships_followers")) return "followers";
  if (name.startsWith("following") || name.includes("relationships_following")) return "following";
  return null;
}

/**
 * Prefer connections/followers_and_following paths, then any matching basename.
 * @param {string[]} paths
 */
export function findInstagramFiles(paths) {
  const followers = [];
  const following = [];

  for (const path of paths) {
    const folded = foldPath(path);
    if (folded.includes("__macosx/") || folded.endsWith("/")) continue;
    const kind = classifyRelationshipFile(path);
    if (!kind) continue;
    const preferred = folded.includes("followers_and_following") || folded.includes("connections/");
    const entry = { path, preferred };
    if (kind === "followers") followers.push(entry);
    else following.push(entry);
  }

  const rank = (list) =>
    list
      .slice()
      .sort((a, b) => Number(b.preferred) - Number(a.preferred) || a.path.localeCompare(b.path));

  return {
    followers: rank(followers).map((item) => item.path),
    following: rank(following).map((item) => item.path),
  };
}
