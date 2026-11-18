import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://glideway-web.techguidebro.workers.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/app", "/privacy"].map((p) => ({ url: `${SITE}${p}`, changeFrequency: "monthly" as const, priority: p === "" ? 1 : 0.6 }));
}
