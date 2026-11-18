import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://glideway-web.techguidebro.workers.dev";

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: ["/", "/privacy"], disallow: ["/api/"] }, sitemap: `${SITE}/sitemap.xml` };
}
