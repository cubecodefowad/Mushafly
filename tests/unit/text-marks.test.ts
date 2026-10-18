import { describe, expect, it } from "vitest";
import { allSurahMeta, loadSurah } from "@/data/quran-source";
import { ORTHOGRAPHIC_MARKS, SAJDAH_VERSES, TEXT_MARKS } from "@/data/text-marks";

const SAJDAH = "\u06E9";

/**
 * Walks the runtime data once: the reference page must describe the text this
 * app actually ships, not a generic list copied from elsewhere.
 */
function scanVerses() {
  const present = new Map<string, number>();
  const sajdah: string[] = [];

  for (const meta of allSurahMeta) {
    const surah = loadSurah(meta.number);
    for (const verse of surah.verses) {
      for (const character of verse.arabic) {
        present.set(character, (present.get(character) ?? 0) + 1);
      }
      if (verse.arabic.includes(SAJDAH)) {
        sajdah.push(`${meta.number}:${verse.number}`);
      }
    }
  }

  return { present, sajdah };
}

describe("text mark reference", () => {
  const { present, sajdah } = scanVerses();

  it("documents only signs that are printed in the pinned text", () => {
    for (const mark of TEXT_MARKS) {
      expect(present.get(mark.glyph), `${mark.name} (${mark.glyph})`).toBeGreaterThan(0);
    }
    for (const mark of ORTHOGRAPHIC_MARKS) {
      for (const glyph of mark.glyph.split(" ")) {
        expect(present.get(glyph), `${mark.name} (${glyph})`).toBeGreaterThan(0);
      }
    }
  });

  it("lists the prostration sign in exactly the documented verses", () => {
    const expected = SAJDAH_VERSES.map((entry) => `${entry.surah}:${entry.verse}`);
    expect(sajdah.sort()).toEqual(expected.sort());
    expect(sajdah).toHaveLength(15);
  });

  it("gives every documented sign a name and an explanation", () => {
    for (const mark of TEXT_MARKS) {
      expect(mark.name.length).toBeGreaterThan(2);
      expect(mark.short.length).toBeGreaterThan(2);
      expect(mark.detail.length).toBeGreaterThan(20);
      expect(mark.arabic.length).toBeGreaterThan(1);
    }
  });
});
