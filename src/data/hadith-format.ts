import type { HadithSectionMeta } from "@/data/hadith";
import type { HadithLanguageCode } from "@/types/hadith";

/**
 * Formatting helpers shared by server and client components.
 *
 * They live apart from `@/data/hadith` so a client component can format a
 * count without bundling the 67 KB index of every collection and book.
 */

const NUMBER_FORMAT = new Intl.NumberFormat("en-US");

/**
 * The translations a reader can pick, in the order the picker offers them.
 * English is inline with the Arabic; every other language is a separate file.
 * This is the smallest list a settings parser needs, so it is safe to import
 * from a client component.
 */
export const HADITH_LANGUAGE_CODES: HadithLanguageCode[] = [
  "en",
  "ur",
  "id",
  "tr",
  "bn",
  "fr",
  "ru",
  "ta",
];

export const DEFAULT_HADITH_LANGUAGE: HadithLanguageCode = "en";

export function isHadithLanguage(value: unknown): value is HadithLanguageCode {
  return HADITH_LANGUAGE_CODES.includes(value as HadithLanguageCode);
}

export function formatCount(value: number): string {
  return NUMBER_FORMAT.format(value);
}

export function hadithSectionUrl(collectionId: string, section: number): string {
  return `/hadithly/${collectionId}/${section}/`;
}

/** Same-origin file the reader fetches, one book at a time, Arabic + English. */
export function hadithDataUrl(collectionId: string, section: number): string {
  return `/hadith/${collectionId}/${section}.json`;
}

/**
 * Same-origin file holding one book in one translation. English is not among
 * them: it is stored beside the Arabic in `hadithDataUrl`, so the first paint
 * of every book already has a translation in it.
 */
export function hadithTranslationUrl(
  collectionId: string,
  language: HadithLanguageCode,
  section: number,
): string {
  return `/hadith/${collectionId}/${language}/${section}.json`;
}

/**
 * Groups a published grade into the three tones the chips paint. The datasets
 * use phrases such as "Sahih - Bukhari And Muslim" and "Daif Isnaad", so the
 * test is on the words rather than an exact match.
 */
export function gradeTone(grade: string): "sahih" | "hasan" | "weak" | "other" {
  const normalised = grade.toLowerCase();
  if (/(da'?if|daif|mawdu|munkar|batil|shadh|matruk)/.test(normalised)) return "weak";
  if (normalised.includes("hasan")) return "hasan";
  if (normalised.includes("sahih")) return "sahih";
  return "other";
}

/** The way a collection's range is described under a book title. */
export function hadithRangeLabel(section: HadithSectionMeta): string {
  if (section.first === null || section.last === null) return formatCount(section.count);
  if (section.first === section.last) return `Hadith ${formatCount(section.first)}`;
  return `Hadith ${formatCount(section.first)}–${formatCount(section.last)}`;
}
