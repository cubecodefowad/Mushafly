import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_HADITH_LANGUAGE,
  HADITHLY_GROUPS,
  HADITHLY_LANGUAGES,
  HADITHLY_SOURCE,
  HADITHLY_TOTALS,
  HADITH_COLLECTIONS,
  adjacentSections,
  formatCount,
  gradeTone,
  hadithCollection,
  hadithDataUrl,
  hadithRangeLabel,
  hadithSection,
  hadithSectionUrl,
  hadithTranslationUrl,
  isHadithLanguage,
} from "@/data/hadith";
import { HADITHLY_STORAGE_KEYS, parseHadithProgress } from "@/lib/storage";

const DATA_ROOT = path.join(process.cwd(), "public", "hadith");

describe("Hadithly catalogue", () => {
  it("lists ten unique collections in two groups", () => {
    expect(HADITH_COLLECTIONS).toHaveLength(10);
    expect(new Set(HADITH_COLLECTIONS.map((collection) => collection.id)).size).toBe(10);

    const six = HADITH_COLLECTIONS.filter((collection) => collection.group === "six");
    const more = HADITH_COLLECTIONS.filter((collection) => collection.group === "more");
    expect(six.map((collection) => collection.id)).toEqual([
      "bukhari",
      "muslim",
      "abudawud",
      "tirmidhi",
      "nasai",
      "ibnmajah",
    ]);
    expect(more.map((collection) => collection.id)).toEqual([
      "malik",
      "nawawi",
      "qudsi",
      "dehlawi",
    ]);
    expect(HADITHLY_GROUPS.map((group) => group.id)).toEqual(["six", "more"]);
  });

  it("introduces every collection in English and Arabic", () => {
    for (const collection of HADITH_COLLECTIONS) {
      expect(collection.name.length, collection.id).toBeGreaterThan(2);
      expect(collection.arabicName, collection.id).toMatch(/[\u0600-\u06FF]/);
      expect(collection.author.length, collection.id).toBeGreaterThan(2);
      expect(collection.blurb.length, collection.id).toBeGreaterThan(20);
      expect(collection.sections.length, collection.id).toBeGreaterThan(0);
    }
  });

  it("matches the generated totals", () => {
    const hadiths = HADITH_COLLECTIONS.reduce((sum, collection) => sum + collection.hadiths, 0);
    const sections = HADITH_COLLECTIONS.reduce(
      (sum, collection) => sum + collection.sections.length,
      0,
    );
    expect(hadiths).toBe(HADITHLY_TOTALS.hadiths);
    expect(sections).toBe(HADITHLY_TOTALS.sections);
    expect(HADITHLY_TOTALS.collections).toBe(10);
    expect(HADITHLY_SOURCE.revision).toMatch(/^[0-9a-f]{40}$/);
    expect(HADITHLY_SOURCE.license).toContain("public domain");
  });

  it("offers every published translation, English first", () => {
    expect(HADITHLY_LANGUAGES.map((language) => language.code)).toEqual([
      "en",
      "bn",
      "fr",
      "id",
      "ru",
      "ta",
      "tr",
      "ur",
    ]);
    expect(HADITHLY_TOTALS.languages).toBe(HADITHLY_LANGUAGES.length);

    for (const collection of HADITH_COLLECTIONS) {
      expect(collection.languages[0].code, collection.id).toBe("en");
      expect(
        new Set(collection.languages.map((language) => language.code)).size,
        collection.id,
      ).toBe(collection.languages.length);

      for (const language of collection.languages) {
        expect(language.name.length, `${collection.id}/${language.code}`).toBeGreaterThan(2);
        expect(language.native.length, `${collection.id}/${language.code}`).toBeGreaterThan(0);
        expect(language.hadiths, `${collection.id}/${language.code}`).toBeGreaterThan(0);
        expect(language.hadiths, `${collection.id}/${language.code}`).toBeLessThanOrEqual(
          collection.hadiths,
        );
        expect(["ltr", "rtl"], `${collection.id}/${language.code}`).toContain(language.direction);
      }
    }

    // The two short collections were only ever translated into French.
    expect(hadithCollection("qudsi")?.languages.map((language) => language.code)).toEqual([
      "en",
      "fr",
    ]);
    expect(hadithCollection("dehlawi")?.languages.map((language) => language.code)).toEqual([
      "en",
      "fr",
    ]);
    // The picker puts Urdu and Indonesian before the alphabetical tail.
    expect(hadithCollection("bukhari")?.languages.slice(0, 4).map((language) => language.code)).toEqual(
      ["en", "ur", "id", "tr"],
    );
    expect(
      hadithCollection("bukhari")
        ?.languages.map((language) => language.code)
        .sort(),
    ).toEqual(["bn", "en", "fr", "id", "ru", "ta", "tr", "ur"]);
  });

  it("links a single-book collection straight to its book", () => {
    for (const collection of HADITH_COLLECTIONS) {
      if (collection.sections.length === 1) {
        expect(collection.href).toBe(
          `/hadithly/${collection.id}/${collection.sections[0].number}/`,
        );
      } else {
        expect(collection.href).toBe(`/hadithly/${collection.id}/`);
      }
    }
    expect(hadithCollection("nawawi")?.href).toBe("/hadithly/nawawi/1/");
    expect(hadithCollection("bukhari")?.href).toBe("/hadithly/bukhari/");
    expect(hadithCollection("nope")).toBeUndefined();
  });
});

describe("Hadithly files", () => {
  it("has a file for every indexed book, with the indexed count", () => {
    for (const collection of HADITH_COLLECTIONS) {
      const dir = path.join(DATA_ROOT, collection.id);
      expect(fs.existsSync(dir), collection.id).toBe(true);

      const files = fs
        .readdirSync(dir)
        .filter((file) => file.endsWith(".json"))
        .map((file) => Number(file.replace(".json", "")))
        .sort((a, b) => a - b);
      expect(files, collection.id).toEqual(collection.sections.map((section) => section.number));

      let total = 0;
      for (const section of collection.sections) {
        const payload = JSON.parse(
          fs.readFileSync(path.join(dir, `${section.number}.json`), "utf8"),
        ) as { collection: string; section: number; hadiths: Array<{ number: number }> };
        expect(payload.collection, collection.id).toBe(collection.id);
        expect(payload.section, collection.id).toBe(section.number);
        expect(payload.hadiths.length, `${collection.id}/${section.number}`).toBe(section.count);
        total += payload.hadiths.length;
      }
      expect(total, collection.id).toBe(collection.hadiths);
    }
  });

  it("holds a file per book for every translation it advertises", () => {
    for (const collection of HADITH_COLLECTIONS) {
      const books = new Map(collection.sections.map((section) => [section.number, section.count]));

      for (const language of collection.languages) {
        if (language.code === "en") continue;
        const dir = path.join(DATA_ROOT, collection.id, language.code);
        expect(fs.existsSync(dir), `${collection.id}/${language.code}`).toBe(true);

        let total = 0;
        for (const file of fs.readdirSync(dir).filter((name) => name.endsWith(".json"))) {
          const payload = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8")) as {
            collection: string;
            section: number;
            language: string;
            direction: string;
            hadiths: Array<{ number: number; text: string }>;
          };

          expect(payload.collection, `${collection.id}/${language.code}/${file}`).toBe(
            collection.id,
          );
          expect(payload.language, `${collection.id}/${language.code}/${file}`).toBe(
            language.code,
          );
          expect(payload.direction, `${collection.id}/${language.code}/${file}`).toBe(
            language.direction,
          );
          expect(
            books.has(payload.section),
            `${collection.id}/${language.code}/${file}`,
          ).toBe(true);
          expect(payload.hadiths.length, `${collection.id}/${language.code}/${file}`).toBeLessThanOrEqual(
            books.get(payload.section)!,
          );

          for (const hadith of payload.hadiths) {
            expect(hadith.text.trim().length, `${collection.id}/${language.code}`).toBeGreaterThan(
              0,
            );
          }
          total += payload.hadiths.length;
        }

        expect(total, `${collection.id}/${language.code}`).toBe(language.hadiths);
      }
    }
  });

  it("attaches every translated narration to a real hadith", () => {
    const book = JSON.parse(
      fs.readFileSync(path.join(DATA_ROOT, "bukhari", "1.json"), "utf8"),
    ) as { hadiths: Array<{ number: number }> };
    const numbers = new Set(book.hadiths.map((hadith) => hadith.number));
    const payload = JSON.parse(
      fs.readFileSync(path.join(DATA_ROOT, "bukhari", "ur", "1.json"), "utf8"),
    ) as { direction: string; hadiths: Array<{ number: number; text: string }> };

    expect(payload.hadiths.length).toBeGreaterThan(0);
    expect(payload.direction).toBe("rtl");
    expect(payload.hadiths[0].text).toMatch(/[\u0600-\u06FF]/);
    for (const hadith of payload.hadiths) {
      expect(numbers.has(hadith.number), String(hadith.number)).toBe(true);
    }
  });

  it("keeps the first book of every collection readable", () => {
    for (const collection of HADITH_COLLECTIONS) {
      const first = collection.sections[0];
      const payload = JSON.parse(
        fs.readFileSync(path.join(DATA_ROOT, collection.id, `${first.number}.json`), "utf8"),
      ) as {
        name: string;
        hadiths: Array<{
          number: number;
          arabic: string | null;
          english: string | null;
          grades?: Array<{ scholar: string; grade: string }>;
        }>;
      };

      expect(payload.name.length, collection.id).toBeGreaterThan(0);
      expect(payload.hadiths.length, collection.id).toBeGreaterThan(0);

      const seen = new Set<number>();
      let previous = -Infinity;
      for (const hadith of payload.hadiths) {
        expect(Number.isFinite(hadith.number), collection.id).toBe(true);
        expect(hadith.number, collection.id).toBeGreaterThan(0);
        expect(hadith.number, collection.id).toBeGreaterThan(previous);
        expect(seen.has(hadith.number), collection.id).toBe(false);
        seen.add(hadith.number);
        previous = hadith.number;
        expect(Boolean(hadith.arabic?.trim() || hadith.english?.trim()), collection.id).toBe(true);
      }

      expect(payload.hadiths[0].arabic ?? "", collection.id).toMatch(/[\u0600-\u06FF]/);
    }
  });
});

describe("Hadithly helpers", () => {
  it("builds the same-origin data and page addresses", () => {
    expect(hadithDataUrl("bukhari", 2)).toBe("/hadith/bukhari/2.json");
    expect(hadithSectionUrl("bukhari", 2)).toBe("/hadithly/bukhari/2/");
    expect(hadithTranslationUrl("bukhari", "ur", 2)).toBe("/hadith/bukhari/ur/2.json");
  });

  it("accepts only the languages the datasets publish", () => {
    expect(DEFAULT_HADITH_LANGUAGE).toBe("en");
    expect(isHadithLanguage("ur")).toBe(true);
    expect(isHadithLanguage("ta")).toBe(true);
    expect(isHadithLanguage("de")).toBe(false);
    expect(isHadithLanguage("English")).toBe(false);
    expect(isHadithLanguage(null)).toBe(false);
  });

  it("walks to the neighbouring books", () => {
    const collection = hadithCollection("bukhari")!;
    const first = collection.sections[0];
    const last = collection.sections[collection.sections.length - 1];

    expect(adjacentSections(collection, first.number).prev).toBeNull();
    expect(adjacentSections(collection, first.number).next?.number).toBe(
      collection.sections[1].number,
    );
    expect(adjacentSections(collection, last.number).next).toBeNull();
    expect(adjacentSections(collection, 9999)).toEqual({ prev: null, next: null });
  });

  it("finds books by number and formats their range", () => {
    const collection = hadithCollection("bukhari")!;
    expect(hadithSection(collection, "1")?.name).toBe("Revelation");
    expect(hadithSection(collection, "9999")).toBeUndefined();
    expect(hadithRangeLabel(collection.sections[0])).toBe("Hadith 1–7");
    expect(hadithRangeLabel({ number: 3, name: "x", count: 1, first: 9, last: 9 })).toBe(
      "Hadith 9",
    );
    expect(hadithRangeLabel({ number: 3, name: "x", count: 4, first: null, last: null })).toBe("4");
    expect(formatCount(36115)).toBe("36,115");
  });

  it("groups a published grade into a tone", () => {
    expect(gradeTone("Sahih")).toBe("sahih");
    expect(gradeTone("Sahih - Bukhari And Muslim")).toBe("sahih");
    expect(gradeTone("Hasan Sahih")).toBe("hasan");
    expect(gradeTone("Hasan")).toBe("hasan");
    expect(gradeTone("Daif")).toBe("weak");
    expect(gradeTone("Da'if Isnaad")).toBe("weak");
    expect(gradeTone("Mawdu")).toBe("weak");
    expect(gradeTone("Munkar")).toBe("weak");
    expect(gradeTone("Unknown")).toBe("other");
  });
});

describe("Hadithly reading position", () => {
  const valid = {
    collection: "bukhari",
    section: 2,
    number: 32,
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  it("stores its own namespaced key", () => {
    expect(HADITHLY_STORAGE_KEYS.progress).toBe("mushafly.hadithly.v1");
  });

  it("accepts a plausible position, including fractional numbering", () => {
    expect(parseHadithProgress(valid)).toEqual(valid);
    expect(parseHadithProgress({ ...valid, number: 402.2 })?.number).toBe(402.2);
  });

  it("rejects anything malformed", () => {
    expect(parseHadithProgress(null)).toBeNull();
    expect(parseHadithProgress("bukhari")).toBeNull();
    expect(parseHadithProgress({ ...valid, collection: "Bukhari!" })).toBeNull();
    expect(parseHadithProgress({ ...valid, section: -1 })).toBeNull();
    expect(parseHadithProgress({ ...valid, section: "2" })).toBeNull();
    expect(parseHadithProgress({ ...valid, number: 0 })).toBeNull();
    expect(parseHadithProgress({ ...valid, number: Number.NaN })).toBeNull();
    expect(parseHadithProgress({ ...valid, updatedAt: "yesterday" })).toBeNull();
  });
});
