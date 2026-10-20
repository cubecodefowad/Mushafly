import { sourceInfo } from "@/data/attribution";
import tanzilExcluded from "@/data/generated/tanzil-excluded.json";
import tanzilTranslations from "@/data/generated/tanzil-translations.json";
import type { TranslationInfo, TranslationLanguage } from "@/types/quran";

/**
 * Tanzil datasets converted by `scripts/lib/tanzil.mjs`. Their language codes
 * are the Tanzil IDs (for example `en.sahih`) so several translations can
 * share one language while remaining distinct selections.
 */
export const TANZIL_TRANSLATIONS = tanzilTranslations as unknown as TranslationInfo[];

export type ExcludedTranslation = {
  id: string;
  name: string;
  translator: string;
  language: string;
  reason: string;
  emptyVerses: string[];
};

/** Tanzil datasets held back because the source has empty verse records. */
export const TANZIL_EXCLUDED = tanzilExcluded as unknown as ExcludedTranslation[];

/**
 * Every translation copied into `public/quran/translation/`. The quranjson
 * datasets come first, then the converted Tanzil datasets.
 */
export const TRANSLATIONS: TranslationInfo[] = [
  ...sourceInfo.translations,
  ...TANZIL_TRANSLATIONS,
];

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

export function translationLabel(translation: TranslationInfo): string {
  return translation.shortName ?? translation.name;
}

export type TranslationGroup = {
  label: string;
  translations: TranslationInfo[];
};

/** Groups translations by language, preserving registry order. */
export function groupedTranslations(): TranslationGroup[] {
  const groups: TranslationGroup[] = [];
  for (const translation of TRANSLATIONS) {
    const label = translation.group ?? translation.language ?? translation.label;
    let group = groups.find((candidate) => candidate.label === label);
    if (!group) {
      group = { label, translations: [] };
      groups.push(group);
    }
    group.translations.push(translation);
  }
  return groups;
}

const pad3 = (n: number) => String(n).padStart(3, "0");

/** Same-origin runtime copy written by `scripts/prepare-data.mjs`. */
export function translationUrl(languageCode: TranslationLanguage, surahNumber: number): string {
  return `/quran/translation/${languageCode}/${pad3(surahNumber)}.json`;
}
