import type { Platform } from "./captions";

export type Format = "image" | "carousel" | "reel" | "video" | "photos";
export type AssetLite = { kind: "image" | "video"; mime: string };

export const FORMATS: Record<Platform, { value: Format; label: string; hint: string }[]> = {
  instagram: [
    { value: "image", label: "Single photo", hint: "1 JPEG image" },
    { value: "carousel", label: "Carousel", hint: "2–10 JPEG images or videos" },
    { value: "reel", label: "Reel", hint: "1 MP4/MOV video, 3 s – 15 min" },
  ],
  tiktok: [
    { value: "video", label: "Video", hint: "1 video" },
    { value: "photos", label: "Photo post", hint: "1–10 images" },
  ],
};

/** Returns a problem description, or null when the media fits the chosen platform + format. */
export function mediaProblem(platform: Platform, format: Format, assets: AssetLite[]): string | null {
  if (!FORMATS[platform].some((f) => f.value === format)) return "That format isn't available on this platform.";
  const n = assets.length;
  const images = assets.filter((a) => a.kind === "image");
  const videos = assets.filter((a) => a.kind === "video");
  const nonJpeg = images.some((a) => a.mime !== "image/jpeg");
  if (platform === "instagram") {
    if (format === "image") {
      if (n !== 1 || images.length !== 1) return "A single-photo post needs exactly 1 image.";
      if (nonJpeg) return "Instagram's API only accepts JPEG images. Export the image as .jpg and upload it again.";
    }
    if (format === "reel" && (n !== 1 || videos.length !== 1)) return "A Reel needs exactly 1 video.";
    if (format === "carousel") {
      if (n < 2 || n > 10) return "A carousel needs 2 to 10 items.";
      if (nonJpeg) return "Instagram's API only accepts JPEG images. Export PNGs as .jpg first.";
    }
  } else {
    if (format === "video" && (n !== 1 || videos.length !== 1)) return "A TikTok video post needs exactly 1 video.";
    if (format === "photos" && (n < 1 || n > 10 || videos.length > 0)) return "A TikTok photo post needs 1 to 10 images and no videos.";
  }
  return null;
}
