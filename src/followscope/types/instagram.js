/**
 * FollowScope domain types (PROJECT_SPEC.md §7).
 * Stage 1: type contracts only — no archive parsing yet.
 */

/**
 * @typedef {Object} InstagramAccount
 * @property {string} username
 * @property {string} profileUrl
 */

/**
 * @typedef {Object} InstagramSnapshot
 * @property {string} id
 * @property {string} createdAt ISO timestamp
 * @property {string[]} followers
 * @property {string[]} following
 * @property {string} [sourceFileName]
 */

/**
 * @typedef {Object} InstagramAnalysis
 * @property {number} followersCount
 * @property {number} followingCount
 * @property {string[]} notFollowingBack
 * @property {string[]} notFollowedBack
 * @property {string[]} mutuals
 */

/**
 * @typedef {Object} SnapshotChanges
 * @property {string[]} newFollowers
 * @property {string[]} lostFollowers
 * @property {string[]} newlyFollowed
 * @property {string[]} unfollowedByUser
 */

/**
 * @typedef {"idle"|"ready"|"empty"} FollowScopeDataState
 */

/**
 * Empty analysis placeholder — never presented as real Instagram results.
 * @returns {InstagramAnalysis}
 */
export function emptyAnalysis() {
  return {
    followersCount: 0,
    followingCount: 0,
    notFollowingBack: [],
    notFollowedBack: [],
    mutuals: [],
  };
}

/**
 * @param {string} username
 * @returns {string}
 */
export function profileUrlFor(username) {
  const clean = String(username || "").trim().replace(/^@/, "");
  if (!/^[a-zA-Z0-9._]{1,30}$/.test(clean)) return "";
  return `https://www.instagram.com/${clean}/`;
}
