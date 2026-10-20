import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  TANZIL_TRANSLATIONS,
  TRANSLATIONS,
  groupedTranslations,
  translationInfo,
  translationLabel,
  translationUrl,
} from "@/data/translations";
import { ORTHOGRAPHIC_MARKS, TEXT_MARKS } from "@/data/text-marks";

const pad3 = (n: number) => String(n).padStart(3, "0");

function readJson(...parts: string[]) {
  const file = path.join(process.cwd(), "public", "quran", ...parts);
  return JSON.parse(fs.readFileSync(file, "utf8")) as {
    verse: Record<string, string>;
    count: number;
    index: string | number;
  };
}

describe("translation datasets", () => {
  it("keeps the three pinned datasets first and adds the Tanzil corpus", () => {
    expect(TRANSLATIONS.slice(0, 3).map((entry) => entry.languageCode)).toEqual([
      "en",
      "id",
      "ar",
    ]);
    expect(TRANSLATIONS.slice(0, 3).map((entry) => entry.id)).toEqual([
      "en.itani",
      "id.indonesian",
      "ar.muyassar",
    ]);
    expect(TANZIL_TRANSLATIONS).toHaveLength(65);
    expect(TRANSLATIONS).toHaveLength(68);
    expect(translationInfo("ar").direction).toBe("rtl");
    expect(translationInfo("id").direction).toBe("ltr");
    expect(translationInfo("ur.junagarhi").direction).toBe("rtl");
    expect(translationInfo("ur.junagarhi").htmlLang).toBe("ur");
    expect(translationInfo("en.sahih").direction).toBe("ltr");
    expect(translationUrl("id", 2)).toBe("/quran/translation/id/002.json");
    expect(translationUrl("ur.junagarhi", 2)).toBe(
      "/quran/translation/ur.junagarhi/002.json",
    );
  });

  it("groups translations by language without losing datasets", () => {
    const groups = groupedTranslations();
    const urdu = groups.find((group) => group.label === "Urdu");
    expect(urdu?.translations).toHaveLength(6);
    expect(urdu?.translations.map((entry) => entry.languageCode)).toEqual([
      "ur.maududi",
      "ur.kanzuliman",
      "ur.ahmedali",
      "ur.jalandhry",
      "ur.qadri",
      "ur.junagarhi",
    ]);
    expect(groups.reduce((total, group) => total + group.translations.length, 0)).toBe(
      TRANSLATIONS.length,
    );
    expect(translationLabel(translationInfo("ur.junagarhi"))).toBe("Junagarhi");
  });

  it("covers every Arabic key in Indonesian and every numbered key in Arabic", () => {
    for (let surah = 1; surah <= 114; surah++) {
      const file = pad3(surah);
      const arabic = readJson("surah", `${file}.json`);
      const indonesian = readJson("translation", "id", `${file}.json`);
      const commentary = readJson("translation", "ar", `${file}.json`);

      const arabicKeys = Object.keys(arabic.verse).sort();
      expect(Object.keys(indonesian.verse).sort(), `id ${surah}`).toEqual(arabicKeys);
      expect(Object.keys(commentary.verse).sort(), `ar ${surah}`).toEqual(
        arabicKeys.filter((key) => key !== "verse_0"),
      );

      for (const [key, text] of Object.entries(indonesian.verse)) {
        expect(text.length, `id ${surah}:${key}`).toBeGreaterThan(0);
      }
      for (const [key, text] of Object.entries(commentary.verse)) {
        expect(text.length, `ar ${surah}:${key}`).toBeGreaterThan(0);
      }
    }
  });

  it("keeps the Arabic commentary out of the unnumbered Bismillah row", () => {
    const bismillahSurahs = [2, 3, 4, 114];
    for (const surah of bismillahSurahs) {
      const file = pad3(surah);
      expect(readJson("translation", "id", `${file}.json`).verse.verse_0).toBeDefined();
      expect(readJson("translation", "ar", `${file}.json`).verse.verse_0).toBeUndefined();
    }
    // Surahs 1 and 9 have no unnumbered Bismillah row at all.
    expect(readJson("surah", "001.json").verse.verse_0).toBeUndefined();
    expect(readJson("surah", "009.json").verse.verse_0).toBeUndefined();
  });
});

describe("Tajweed sign optical alignment", () => {
  const numeric = (value: unknown): value is number =>
    typeof value === "number" && Number.isFinite(value);

  it("gives every standalone sign a finite optical offset", () => {
    const orthographic = ORTHOGRAPHIC_MARKS.flatMap((mark) =>
      mark.glyphs.map((part) => ({ ...part, name: `${mark.name} (${part.glyph})` })),
    );
    for (const mark of [...TEXT_MARKS, ...orthographic]) {
      expect(numeric(mark.optical.x), `${mark.name} x`).toBe(true);
      expect(numeric(mark.optical.y), `${mark.name} y`).toBe(true);
      expect(Math.abs(mark.optical.x), `${mark.name} x range`).toBeLessThan(1);
      expect(Math.abs(mark.optical.y), `${mark.name} y range`).toBeLessThan(1.5);
    }
  });

  it("distinguishes the superscript pause signs from the baseline signs", () => {
    for (const mark of TEXT_MARKS) {
      const superscript = mark.kind === "pause";
      if (superscript) {
        expect(mark.optical.y, mark.name).toBeGreaterThan(0.5);
      } else {
        expect(mark.optical.y, mark.name).toBeLessThan(0);
      }
    }
  });
});
