import { sourceInfo } from "@/data/attribution";
import type { TranslationInfo, TranslationLanguage } from "@/types/quran";

/**
 * The translation datasets copied into `public/quran/translation/`. The list
 * and its attribution are generated from `scripts/lib/source.mjs`, so the
 * reader, settings and legal pages cannot drift from the copied data.
 */
export const TRANSLATIONS: TranslationInfo[] = sourceInfo.translations;

export const DEFAULT_TRANSLATION: TranslationLanguage =
  TRANSLATIONS[0]?.languageCode ?? "en";

export function isTranslationLanguage(value: unknown): value is TranslationLanguage {
  return TRANSLATIONS.some((translation) => translation.languageCode === value);
}

export function translationInfo(languageCode: TranslationLanguage): TranslationInfo {
  return (
    TRANSLATIONS.find((translation) => translation.languageCode === languageCode) ??
    TRANSLATIONS[0]
  );
}

const pad3 = (n: number) => String(n).padStart(3, "0");

/** Same-origin runtime copy written by `scripts/prepare-data.mjs`. */
export function translationUrl(languageCode: TranslationLanguage, surahNumber: number): string {
  return `/quran/translation/${languageCode}/${pad3(surahNumber)}.json`;
}
