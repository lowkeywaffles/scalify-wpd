import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/app", "/api", "/auth", "/q/"] }], sitemap: `${publicEnv.siteUrl}/sitemap.xml` };
}
