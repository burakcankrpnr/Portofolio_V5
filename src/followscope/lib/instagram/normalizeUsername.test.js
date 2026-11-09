import { describe, expect, it } from "vitest";
import { normalizeUsername, uniqueUsernames } from "./normalizeUsername.js";
import { analyzeLists } from "./analyze.js";
import { compareSnapshots } from "./compareSnapshots.js";
import { extractUsernamesFromJson } from "./extractUsernames.js";
import { findInstagramFiles } from "./findInstagramFiles.js";

describe("normalizeUsername", () => {
  it("@, boşluk ve URL öneklerini temizler", () => {
    expect(normalizeUsername(" @Ayse ")).toBe("ayse");
    expect(normalizeUsername("https://www.instagram.com/_u/Mehmet/")).toBe("mehmet");
  });
});

describe("uniqueUsernames", () => {
  it("tekrarları ayırır", () => {
    const result = uniqueUsernames(["ayse", "@Ayse", "mehmet"]);
    expect(result.usernames).toEqual(["ayse", "mehmet"]);
    expect(result.duplicates).toContain("ayse");
  });
});

describe("analyzeLists", () => {
  it("spec örneğini doğru hesaplar", () => {
    const followers = ["ayse", "mehmet", "zeynep"];
    const following = ["mehmet", "zeynep", "burak", "can"];
    const result = analyzeLists(followers, following);
    expect(result.notFollowingBack).toEqual(["burak", "can"]);
    expect(result.notFollowedBack).toEqual(["ayse"]);
    expect(result.mutuals).toEqual(["mehmet", "zeynep"]);
  });
});

describe("compareSnapshots", () => {
  it("önceki yoksa karşılaştırma yapmaz", () => {
    const result = compareSnapshots(null, {
      id: "1",
      createdAt: "2026-01-01",
      followers: ["a"],
      following: ["b"],
    });
    expect(result.ok).toBe(false);
  });

  it("farkları hesaplar", () => {
    const previous = {
      id: "1",
      createdAt: "2026-01-01",
      followers: ["ayse", "mehmet"],
      following: ["burak"],
    };
    const current = {
      id: "2",
      createdAt: "2026-02-01",
      followers: ["mehmet", "zeynep"],
      following: ["burak", "can"],
    };
    const result = compareSnapshots(previous, current);
    expect(result.newFollowers).toEqual(["zeynep"]);
    expect(result.lostFollowers).toEqual(["ayse"]);
    expect(result.newlyFollowed).toEqual(["can"]);
    expect(result.unfollowedByUser).toEqual([]);
  });
});

describe("extract + find files", () => {
  it("followers dizisini okur", () => {
    const json = [
      { title: "", string_list_data: [{ value: "sample_follower", href: "https://instagram.com/sample_follower" }] },
      { title: "OnlyTitle" },
    ];
    const result = extractUsernamesFromJson(json);
    expect(result.usernames).toEqual(["onlytitle", "sample_follower"]);
  });

  it("following sarmalayıcısını okur", () => {
    const json = {
      relationships_following: [
        { title: "alpha", string_list_data: [{ value: "alpha" }] },
      ],
    };
    expect(extractUsernamesFromJson(json).usernames).toEqual(["alpha"]);
  });

  it("dosya yollarını sınıflandırır", () => {
    const found = findInstagramFiles([
      "instagram-x/connections/followers_and_following/followers_1.json",
      "instagram-x/connections/followers_and_following/followers_2.json",
      "instagram-x/connections/followers_and_following/following.json",
      "other/notes.txt",
    ]);
    expect(found.followers).toHaveLength(2);
    expect(found.following).toHaveLength(1);
  });
});
