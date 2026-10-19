import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Bookmarks and settings are local to the reader, not reading content.
        // The social preview exists for review and is intentionally noindex.
        disallow: ["/bookmarks/", "/settings/", "/social-preview/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: new URL(SITE_URL).host,
  };
}
