/**
 * Canonical site identity.
 *
 * `NEXT_PUBLIC_SITE_URL` lets a preview deployment advertise its own origin,
 * while production falls back to the public domain. The URL is normalised to
 * an origin so callers can safely append paths.
 */
function resolveSiteUrl(): string {
  const candidate = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://mushafly.com";
  try {
    return new URL(candidate).origin;
  } catch {
    return "https://mushafly.com";
  }
}

export const SITE_URL = resolveSiteUrl();
export const SITE_NAME = "Mushafly";
export const SITE_TITLE = "Mushafly — A quiet place to read the Quran";
export const SITE_DESCRIPTION =
  "Read all 114 surahs with Arabic text, English and Indonesian translations, an Arabic commentary, source-derived Tajweed highlighting, recitation and local bookmarks.";
export const SITE_OG_DESCRIPTION =
  "An elegant, source-faithful Quran reader with Arabic, English and Indonesian translations, Arabic commentary, Tajweed and audio.";
export const SOCIAL_IMAGE_ALT =
  "Mushafly — a quiet place to read the Quran, with Arabic text, translations and Tajweed";
export const SOCIAL_IMAGE_WIDTH = 1200;
export const SOCIAL_IMAGE_HEIGHT = 630;
export const SITE_KEYWORDS = [
  "Quran",
  "read Quran online",
  "Quran with Tajweed",
  "Quran translation",
  "Indonesian Quran translation",
  "Arabic tafsir",
  "Mushafly",
];

/** Keep internal links and canonicals in the same trailing-slash shape. */
export function canonicalPath(path = "/"): string {
  const withLeading = path.startsWith("/") ? path : `/${path}`;
  return withLeading.endsWith("/") ? withLeading : `${withLeading}/`;
}

export function absoluteUrl(path = "/"): string {
  return new URL(canonicalPath(path), `${SITE_URL}/`).toString();
}

/** Absolute URL for a file, preserving its extension (no trailing slash). */
export function assetUrl(path: string): string {
  const withLeading = path.startsWith("/") ? path : `/${path}`;
  return new URL(withLeading, `${SITE_URL}/`).toString();
}
