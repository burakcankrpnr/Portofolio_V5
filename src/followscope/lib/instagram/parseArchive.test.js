import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { parseInstagramArchive, validateArchiveFile } from "./parseArchive.js";

function makeFile(name, bytes, type = "application/zip") {
  return new File([bytes], name, { type });
}

describe("parseArchive", () => {
  it("desteklenmeyen dosyayı reddeder", () => {
    expect(validateArchiveFile(makeFile("notes.pdf", new Uint8Array([1]), "application/pdf"))).toMatch(/ZIP/);
  });

  it("örnek ZIP arşivini ayrıştırır", async () => {
    const zip = new JSZip();
    zip.file(
      "connections/followers_and_following/followers_1.json",
      JSON.stringify([
        { string_list_data: [{ value: "ayse" }] },
        { string_list_data: [{ value: "mehmet" }] },
        { string_list_data: [{ value: "zeynep" }] },
      ])
    );
    zip.file(
      "connections/followers_and_following/following.json",
      JSON.stringify({
        relationships_following: [
          { string_list_data: [{ value: "mehmet" }] },
          { string_list_data: [{ value: "zeynep" }] },
          { string_list_data: [{ value: "burak" }] },
          { string_list_data: [{ value: "can" }] },
        ],
      })
    );
    const blob = await zip.generateAsync({ type: "uint8array" });
    const file = makeFile("instagram-export.zip", blob);
    const result = await parseInstagramArchive(file);
    expect(result.ok).toBe(true);
    expect(result.analysis.notFollowingBack).toEqual(["burak", "can"]);
    expect(result.analysis.notFollowedBack).toEqual(["ayse"]);
    expect(result.analysis.mutuals).toEqual(["mehmet", "zeynep"]);
  });
});
