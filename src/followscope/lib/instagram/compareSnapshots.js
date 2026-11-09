/**
 * @param {import("../../types/instagram.js").InstagramSnapshot | null | undefined} previous
 * @param {import("../../types/instagram.js").InstagramSnapshot} current
 */
export function compareSnapshots(previous, current) {
  if (!previous) {
    return {
      ok: false,
      reason: "Önceki analiz yok; geçmiş karşılaştırması yapılamıyor.",
      newFollowers: [],
      lostFollowers: [],
      newlyFollowed: [],
      unfollowedByUser: [],
    };
  }

  const oldFollowers = new Set(previous.followers);
  const newFollowersSet = new Set(current.followers);
  const oldFollowing = new Set(previous.following);
  const newFollowingSet = new Set(current.following);

  const newFollowers = current.followers.filter((username) => !oldFollowers.has(username));
  const lostFollowers = previous.followers.filter((username) => !newFollowersSet.has(username));
  const newlyFollowed = current.following.filter((username) => !oldFollowing.has(username));
  const unfollowedByUser = previous.following.filter((username) => !newFollowingSet.has(username));

  return {
    ok: true,
    reason: "",
    newFollowers,
    lostFollowers,
    newlyFollowed,
    unfollowedByUser,
  };
}
