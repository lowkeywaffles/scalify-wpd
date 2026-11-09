import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/demo", "/contact", "/legal/privacy", "/legal/terms", "/legal/cookies", "/legal/refund", "/signup"].map((p) => ({ url: `${publicEnv.siteUrl}${p}` }));
}
