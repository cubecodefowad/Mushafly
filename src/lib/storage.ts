import surahMeta from "@/data/generated/surah-meta.json";
import {
  DEFAULT_MUSHAF_THEME,
  isMushafTheme,
} from "@/data/mushaf-themes";
import {
  DEFAULT_RECITER,
  isReciterId,
} from "@/data/reciters";
import {
  DEFAULT_TRANSLATION,
  isTranslationLanguage,
} from "@/data/translations";
import type { BookmarkRecord, LastRead, ReaderSettings, ThemePreference } from "@/types/quran";

export const STORAGE_KEYS = {
  settings: "mushafly.settings.v1",
  bookmarks: "mushafly.bookmarks.v1",
  lastRead: "mushafly.lastRead.v1",
} as const;

/** Keys used before the app was renamed to Mushafly. Read once, then migrated. */
export const LEGACY_STORAGE_KEYS: Record<keyof typeof STORAGE_KEYS, string> = {
  settings: "ayah.settings.v1",
  bookmarks: "ayah.bookmarks.v1",
  lastRead: "ayah.lastRead.v1",
};

export const DEFAULT_SETTINGS: ReaderSettings = {
  arabicSize: 34,
  translationSize: 17,
  translation: DEFAULT_TRANSLATION,
  reciter: DEFAULT_RECITER,
  showTranslation: true,
  tajweed: true,
  autoScroll: true,
  theme: "system",
  mushaf: DEFAULT_MUSHAF_THEME,
};

const THEMES: ThemePreference[] = ["system", "light", "dark"];

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.round(value)));

export function verseCountFor(surahNumber: number): number {
  const meta = (surahMeta as Array<{ number: number; verseCount: number }>)[surahNumber - 1];
  return meta?.number === surahNumber ? meta.verseCount : 0;
}

export function parseSettings(value: unknown): ReaderSettings {
  const input = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const number = (key: keyof ReaderSettings, fallback: number, min: number, max: number) => {
    const candidate = input[key];
    return typeof candidate === "number" && Number.isFinite(candidate)
      ? clamp(candidate, min, max)
      : fallback;
  };
  const bool = (key: keyof ReaderSettings, fallback: boolean) =>
    typeof input[key] === "boolean" ? (input[key] as boolean) : fallback;

  const theme = THEMES.includes(input.theme as ThemePreference)
    ? (input.theme as ThemePreference)
    : DEFAULT_SETTINGS.theme;

  const translation = isTranslationLanguage(input.translation)
    ? input.translation
    : DEFAULT_SETTINGS.translation;

  const reciter = isReciterId(input.reciter) ? input.reciter : DEFAULT_SETTINGS.reciter;

  const mushaf = isMushafTheme(input.mushaf) ? input.mushaf : DEFAULT_SETTINGS.mushaf;

  return {
    arabicSize: number("arabicSize", DEFAULT_SETTINGS.arabicSize, 24, 56),
    translationSize: number("translationSize", DEFAULT_SETTINGS.translationSize, 14, 26),
    translation,
    reciter,
    showTranslation: bool("showTranslation", DEFAULT_SETTINGS.showTranslation),
    tajweed: bool("tajweed", DEFAULT_SETTINGS.tajweed),
    autoScroll: bool("autoScroll", DEFAULT_SETTINGS.autoScroll),
    theme,
    mushaf,
  };
}

export function isVerseReference(value: unknown): value is { surahNumber: number; verseNumber: number } {
  if (!value || typeof value !== "object") return false;
  const ref = value as { surahNumber?: unknown; verseNumber?: unknown };
  if (!Number.isInteger(ref.surahNumber) || !Number.isInteger(ref.verseNumber)) return false;
  const surah = ref.surahNumber as number;
  const verse = ref.verseNumber as number;
  if (surah < 1 || surah > 114 || verse < 1) return false;
  return verse <= verseCountFor(surah);
}

export function parseBookmarks(value: unknown): BookmarkRecord[] {
  if (!Array.isArray(value)) return [];
  const output: BookmarkRecord[] = [];
  const seen = new Set<string>();

  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const record = item as Partial<BookmarkRecord>;
    if (typeof record.id !== "string" || !record.id) continue;
    if (!isVerseReference(record.reference)) continue;
    if (typeof record.createdAt !== "string" || Number.isNaN(Date.parse(record.createdAt))) continue;

    const refKey = `${record.reference.surahNumber}:${record.reference.verseNumber}`;
    if (seen.has(refKey)) continue;
    seen.add(refKey);

    const label =
      typeof record.label === "string" ? record.label.trim().slice(0, 120) : undefined;

    output.push({
      id: record.id,
      reference: {
        surahNumber: record.reference.surahNumber,
        verseNumber: record.reference.verseNumber,
      },
      createdAt: record.createdAt,
      ...(label ? { label } : {}),
    });
    if (output.length >= 500) break;
  }

  return output.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function parseLastRead(value: unknown): LastRead | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<LastRead>;
  if (!isVerseReference(candidate.reference)) return null;
  if (typeof candidate.updatedAt !== "string" || Number.isNaN(Date.parse(candidate.updatedAt))) {
    return null;
  }
  return { reference: candidate.reference, updatedAt: candidate.updatedAt };
}

/**
 * Reads a namespaced key, falling back to the pre-rename key and copying it
 * forward so a reader who bookmarked verses as "Ayah" keeps them.
 */
export function readStorage<T>(
  key: string,
  parse: (value: unknown) => T | null,
  legacyKey?: string,
): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw) return parse(JSON.parse(raw));
    if (!legacyKey) return null;
    const legacy = window.localStorage.getItem(legacyKey);
    if (!legacy) return null;
    const parsed = parse(JSON.parse(legacy));
    if (parsed !== null) window.localStorage.setItem(key, legacy);
    return parsed;
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: unknown): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeStorage(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Storage may be unavailable (private mode, quota). Reading is unaffected.
  }
}

export function createBookmarkId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
