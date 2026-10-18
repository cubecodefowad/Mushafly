import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { normalize } from "@/lib/normalize";
import { searchQuran, type SearchIndex } from "@/lib/search";

const index = JSON.parse(
  fs.readFileSync(path.resolve("public/quran/search-index.json"), "utf8"),
) as SearchIndex;

const refs = (matches: ReturnType<typeof searchQuran>["matches"]) =>
  matches.map((match) => `${match.entry.s}:${match.entry.v}`);

describe("Quran search", () => {
  it("indexes all 6,236 numbered verses exactly once", () => {
    expect(index.entries).toHaveLength(6236);
    const unique = new Set(index.entries.map((entry) => `${entry.s}:${entry.v}`));
    expect(unique.size).toBe(6236);
    expect(index.entries.some((entry) => entry.v === 0)).toBe(false);
  });

  it("finds Arabic without diacritics and returns source references", () => {
    const result = searchQuran(index.entries, "الرحمن", "arabic");
    expect(result.total).toBeGreaterThan(0);
    expect(refs(result.matches)).toContain("1:1");
    expect(refs(result.matches)).toContain("55:1");
    for (const match of result.matches) {
      expect(match.entry.na).toBe(normalize(match.entry.a));
      expect(match.entry.a.length).toBeGreaterThan(0);
    }
  });

  it("matches a vocalized Arabic query against the same index", () => {
    const plain = searchQuran(index.entries, "الرحمن", "arabic", 200);
    const vocalized = searchQuran(index.entries, "ٱلرَّحْمَٰن", "arabic", 200);
    expect(vocalized.total).toBe(plain.total);
    expect(refs(vocalized.matches).slice(0, 10)).toEqual(refs(plain.matches).slice(0, 10));
  });

  it("finds English translations and respects the language filter", () => {
    const english = searchQuran(index.entries, "merciful", "english");
    expect(refs(english.matches)).toContain("1:1");
    expect(english.matches.every((match) => match.matched === "english")).toBe(true);

    const arabicOnly = searchQuran(index.entries, "merciful", "arabic");
    expect(arabicOnly.total).toBe(0);

    const all = searchQuran(index.entries, "merciful", "all");
    expect(all.total).toBeGreaterThanOrEqual(english.total);
  });

  it("supports multi-word queries and caps results", () => {
    const result = searchQuran(index.entries, "most merciful", "english", 5);
    expect(result.total).toBeGreaterThan(5);
    expect(result.matches).toHaveLength(5);
  });

  it("returns nothing for empty or one-character queries", () => {
    expect(searchQuran(index.entries, "", "all").total).toBe(0);
    expect(searchQuran(index.entries, "a", "all").total).toBe(0);
  });
});
