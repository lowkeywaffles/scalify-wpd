import { describe, expect, it } from "vitest";
import { mediaProblem } from "./rules";

const jpg = { kind: "image" as const, mime: "image/jpeg" };
const png = { kind: "image" as const, mime: "image/png" };
const mp4 = { kind: "video" as const, mime: "video/mp4" };

describe("mediaProblem", () => {
  it("accepts valid Instagram posts", () => {
    expect(mediaProblem("instagram", "image", [jpg])).toBeNull();
    expect(mediaProblem("instagram", "reel", [mp4])).toBeNull();
    expect(mediaProblem("instagram", "carousel", [jpg, mp4, jpg])).toBeNull();
  });
  it("rejects PNG on Instagram but allows it on TikTok", () => {
    expect(mediaProblem("instagram", "image", [png])).toMatch(/JPEG/);
    expect(mediaProblem("tiktok", "photos", [png, jpg])).toBeNull();
  });
  it("rejects wrong counts and formats", () => {
    expect(mediaProblem("instagram", "carousel", [jpg])).toMatch(/2 to 10/);
    expect(mediaProblem("instagram", "reel", [jpg])).toMatch(/video/);
    expect(mediaProblem("tiktok", "reel", [mp4])).toMatch(/format/);
    expect(mediaProblem("tiktok", "photos", [jpg, mp4])).toMatch(/no videos/);
  });
});
