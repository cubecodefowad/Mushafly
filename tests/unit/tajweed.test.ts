import { describe, expect, it } from "vitest";
import { loadSurah } from "@/data/quran-source";
import { renderTajweed } from "@/data/tajweed";
import { TAJWEED_RULES } from "@/data/tajweed-rules";

describe("Tajweed adapter", () => {
  it("renders every source string exactly, flagging unpinnable annotations", () => {
    let rows = 0;
    let unavailable = 0;
    const applied = new Set<string>();

    for (let surahNumber = 1; surahNumber <= 114; surahNumber++) {
      const surah = loadSurah(surahNumber);
      const verses = surah.bismillah ? [surah.bismillah, ...surah.verses] : surah.verses;
      expect(verses).toHaveLength(surah.meta.verseCount + (surah.bismillah ? 1 : 0));

      for (const verse of verses) {
        rows++;
        const rendered = verse.tajweed.segments.map((segment) => segment.text).join("");
        expect(rendered).toBe(verse.arabic);
        if (verse.tajweed.status === "unavailable") unavailable++;
        for (const rule of verse.tajweed.appliedRules) {
          expect(TAJWEED_RULES[rule]).toBeDefined();
          applied.add(rule);
        }
        for (const segment of verse.tajweed.segments) {
          if (segment.rule) expect(TAJWEED_RULES[segment.rule]).toBeDefined();
        }
      }
    }

    expect(rows).toBe(6348);
    expect(unavailable).toBe(147);
    expect(applied.size).toBe(18);
  });

  it("flags the pinned offset anomaly instead of shifting or guessing", () => {
    const surah = loadSurah(2);
    const verse = surah.verses[0];
    expect(verse.arabic).toBe("الٓمٓ");
    expect(verse.tajweed.status).toBe("unavailable");
    expect(verse.tajweed.reason).toBe("out-of-bounds");
    expect(verse.tajweed.segments).toEqual([{ text: verse.arabic }]);
  });

  it("applies the source ranges around the BOM artifact without changing the string", () => {
    const surah = loadSurah(1);
    const verse = surah.verses[0];
    expect(verse.arabic.startsWith("\uFEFF")).toBe(true);
    expect(verse.tajweed.status).toBe("ok");
    expect(verse.tajweed.segments.map((segment) => segment.text).join("")).toBe(verse.arabic);
    const firstMark = verse.tajweed.segments.find((segment) => segment.rule);
    expect(firstMark?.rule).toBe("hamzat_wasl");
    expect(firstMark?.text).toBe("ٱ");
  });

  it("rejects corrupted range fixtures without altering the source string", () => {
    const verse = loadSurah(2).verses[1];
    const text = verse.arabic;

    expect(renderTajweed(text, [{ start: 0, end: 2, rule: "madd_2" }]).status).toBe("ok");

    const outOfBounds = renderTajweed(text, [
      { start: 0, end: text.length + 1, rule: "madd_2" },
    ]);
    expect(outOfBounds.status).toBe("unavailable");
    expect(outOfBounds.reason).toBe("out-of-bounds");

    const overlapping = renderTajweed(text, [
      { start: 0, end: 3, rule: "madd_2" },
      { start: 2, end: 4, rule: "ghunnah" },
    ]);
    expect(overlapping.status).toBe("unavailable");
    expect(overlapping.reason).toBe("overlap");

    const invented = renderTajweed(
      text,
      [{ start: 0, end: 2, rule: "invented_rule" }],
      { knownRules: new Set(Object.keys(TAJWEED_RULES)) },
    );
    expect(invented.status).toBe("unavailable");
    expect(invented.reason).toBe("unknown-rule");

    for (const result of [outOfBounds, overlapping, invented]) {
      expect(result.segments.map((segment) => segment.text).join("")).toBe(text);
    }
  });

  it("does not mutate its inputs", () => {
    const text = loadSurah(1).verses[0].arabic;
    const ranges = [
      { start: 7, end: 8, rule: "hamzat_wasl" },
      { start: 28, end: 29, rule: "hamzat_wasl" },
    ];
    const snapshot = JSON.stringify(ranges);
    renderTajweed(text, ranges);
    expect(JSON.stringify(ranges)).toBe(snapshot);
    expect(text).toBe(loadSurah(1).verses[0].arabic);
  });
});
