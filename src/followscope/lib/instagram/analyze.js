import { profileUrlFor } from "../../types/instagram.js";

/**
 * @param {string[]} followers
 * @param {string[]} following
 */
export function analyzeLists(followers, following) {
  const followerSet = new Set(followers);
  const followingSet = new Set(following);

  const notFollowingBack = following.filter((username) => !followerSet.has(username));
  const notFollowedBack = followers.filter((username) => !followingSet.has(username));
  const mutuals = following.filter((username) => followerSet.has(username));

  return {
    followersCount: followers.length,
    followingCount: following.length,
    notFollowingBack,
    notFollowedBack,
    mutuals,
    notFollowingBackRate:
      following.length === 0 ? 0 : notFollowingBack.length / following.length,
  };
}

/**
 * @param {string[]} usernames
 */
export function toAccounts(usernames) {
  return usernames.map((username) => ({
    username,
    profileUrl: profileUrlFor(username),
  }));
}
