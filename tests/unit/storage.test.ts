// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  LEGACY_STORAGE_KEYS,
  STORAGE_KEYS,
  parseBookmarks,
  parseLastRead,
  parseSettings,
  readStorage,
} from "@/lib/storage";

describe("local storage validation", () => {
  it("accepts a valid bookmark and drops malformed records", () => {
    const valid = {
      id: "one",
      reference: { surahNumber: 2, verseNumber: 255 },
      label: "  Ayat al-Kursi  ",
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    const parsed = parseBookmarks([
      valid,
      { ...valid, id: "duplicate" },
      { id: "bad-surah", reference: { surahNumber: 115, verseNumber: 1 }, createdAt: valid.createdAt },
      { id: "bad-verse", reference: { surahNumber: 1, verseNumber: 8 }, createdAt: valid.createdAt },
      { id: "bad-date", reference: { surahNumber: 1, verseNumber: 1 }, createdAt: "not-a-date" },
      null,
      "nope",
    ]);

    expect(parsed).toHaveLength(1);
    expect(parsed[0].label).toBe("Ayat al-Kursi");
    expect(parsed[0].reference).toEqual({ surahNumber: 2, verseNumber: 255 });
  });

  it("returns an empty list for malformed top-level state", () => {
    expect(parseBookmarks(null)).toEqual([]);
    expect(parseBookmarks({})).toEqual([]);
    expect(parseBookmarks("[]")).toEqual([]);
  });

  it("accepts only references inside real surahs", () => {
    expect(
      parseLastRead({
        reference: { surahNumber: 114, verseNumber: 6 },
        updatedAt: "2026-01-01T00:00:00.000Z",
      }),
    ).not.toBeNull();
    expect(
      parseLastRead({
        reference: { surahNumber: 114, verseNumber: 7 },
        updatedAt: "2026-01-01T00:00:00.000Z",
      }),
    ).toBeNull();
    expect(parseLastRead({ reference: { surahNumber: 0, verseNumber: 1 } })).toBeNull();
  });

  it("clamps settings and falls back for invalid values", () => {
    const parsed = parseSettings({
      arabicSize: 999,
      translationSize: 1,
      showTranslation: "yes",
      tajweed: false,
      autoScroll: true,
      theme: "sepia",
    });
    expect(parsed.arabicSize).toBe(56);
    expect(parsed.translationSize).toBe(14);
    expect(parsed.showTranslation).toBe(DEFAULT_SETTINGS.showTranslation);
    expect(parsed.tajweed).toBe(false);
    expect(parsed.autoScroll).toBe(true);
    expect(parsed.theme).toBe("system");
    expect(parsed.translation).toBe("en");

    expect(parseSettings({ translation: "id" }).translation).toBe("id");
    expect(parseSettings({ translation: "ar" }).translation).toBe("ar");
    expect(parseSettings({ translation: "ur.junagarhi" }).translation).toBe(
      "ur.junagarhi",
    );
    expect(parseSettings({ translation: "fr" }).translation).toBe("en");
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
  });
});

describe("storage namespace", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("uses the Mushafly namespace for new writes", () => {
    expect(STORAGE_KEYS).toEqual({
      settings: "mushafly.settings.v1",
      bookmarks: "mushafly.bookmarks.v1",
      lastRead: "mushafly.lastRead.v1",
    });
    expect(Object.values(LEGACY_STORAGE_KEYS)).toEqual([
      "ayah.settings.v1",
      "ayah.bookmarks.v1",
      "ayah.lastRead.v1",
    ]);
  });

  it("keeps data written before the rename and copies it forward", () => {
    const legacy = [{ id: "one", reference: { surahNumber: 2, verseNumber: 255 }, createdAt: "2026-01-01T00:00:00.000Z" }];
    window.localStorage.setItem(LEGACY_STORAGE_KEYS.bookmarks, JSON.stringify(legacy));

    const restored = readStorage(
      STORAGE_KEYS.bookmarks,
      parseBookmarks,
      LEGACY_STORAGE_KEYS.bookmarks,
    );

    expect(restored).toHaveLength(1);
    expect(restored?.[0].reference).toEqual({ surahNumber: 2, verseNumber: 255 });
    // The value is migrated so the next read no longer depends on the old key.
    expect(window.localStorage.getItem(STORAGE_KEYS.bookmarks)).toBe(JSON.stringify(legacy));
  });

  it("prefers current data when both namespaces exist", () => {
    window.localStorage.setItem(LEGACY_STORAGE_KEYS.settings, JSON.stringify({ theme: "dark" }));
    window.localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify({ theme: "light" }));

    const settings = readStorage(
      STORAGE_KEYS.settings,
      (value) => parseSettings(value),
      LEGACY_STORAGE_KEYS.settings,
    );

    expect(settings?.theme).toBe("light");
  });

  it("does not migrate unreadable legacy data", () => {
    window.localStorage.setItem(LEGACY_STORAGE_KEYS.bookmarks, "not json");

    expect(
      readStorage(STORAGE_KEYS.bookmarks, parseBookmarks, LEGACY_STORAGE_KEYS.bookmarks),
    ).toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEYS.bookmarks)).toBeNull();
  });
});
