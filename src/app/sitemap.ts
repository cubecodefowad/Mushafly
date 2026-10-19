import type { MetadataRoute } from "next";
import surahMeta from "@/data/generated/surah-meta.json";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

type SurahMeta = { number: number };

const SURAHS = surahMeta as SurahMeta[];

const PUBLIC_PAGES: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/search/", changeFrequency: "monthly", priority: 0.5 },
  { path: "/about/", changeFrequency: "monthly", priority: 0.6 },
  { path: "/accuracy/", changeFrequency: "monthly", priority: 0.6 },
  { path: "/tajweed/", changeFrequency: "monthly", priority: 0.7 },
  { path: "/terms/", changeFrequency: "yearly", priority: 0.3 },
  { path: "/privacy/", changeFrequency: "yearly", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = PUBLIC_PAGES.map((page) => ({
    url: absoluteUrl(page.path),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  const surahs: MetadataRoute.Sitemap = SURAHS.map((surah) => ({
    url: absoluteUrl(`/surah/${surah.number}/`),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  // Home first, then the reading surface, then the supporting pages. Search
  // result URLs (?q=) and the local-only bookmarks/settings pages are omitted.
  return [pages[0], ...surahs, ...pages.slice(1)];
}
