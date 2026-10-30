import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { HADITH_COLLECTIONS } from "@/data/hadith";
import { hadithSearchShardUrl, hadithUrl } from "@/data/hadith-format";
import {
  decodePostings,
  searchHadiths,
  type HadithSearchDocs,
  type HadithSearchShard,
} from "@/lib/hadith-search";

const ROOT = path.join(process.cwd(), "public", "hadith-search");

const DOCS = JSON.parse(fs.readFileSync(path.join(ROOT, "docs.json"), "utf8")) as HadithSearchDocs;

function shard(language: string, collection: string): HadithSearchShard {
  return JSON.parse(
    fs.readFileSync(path.join(ROOT, language, `${collection}.json`), "utf8"),
  ) as HadithSearchShard;
}

const BUKHARI = {
  ar: shard("ar", "bukhari"),
  en: shard("en", "bukhari"),
};

describe("hadith postings", () => {
  it("decodes the delta-encoded document ids", () => {
    expect(decodePostings("0")).toEqual([0]);
    expect(decodePostings("0.1.4")).toEqual([0, 1, 5]);
    expect(decodePostings("z.1")).toEqual([35, 36]);
  });

  it("stores terms in the order the binary search expects", () => {
    for (const code of ["ar", "en"]) {
      const terms = BUKHARI[code as "ar" | "en"].terms;
      for (let index = 1; index < terms.length; index++) {
        expect(terms[index - 1][0] < terms[index][0], `${code} ${terms[index][0]}`).toBe(true);
      }
    }
  });
});

describe("hadith search index", () => {
  it("catalogues every narration the generated index counts", () => {
    expect(Object.keys(DOCS.collections).sort()).toEqual(
      HADITH_COLLECTIONS.map((collection) => collection.id).sort(),
    );

    for (const collection of HADITH_COLLECTIONS) {
      const documents = DOCS.collections[collection.id];
      expect(documents.length, collection.id).toBe(collection.hadiths);
      expect(shard("ar", collection.id).docs, collection.id).toBe(collection.hadiths);

      const sections = new Set(documents.map(([section]) => section));
      expect(sections.size, collection.id).toBe(collection.sections.length);
    }
  });

  it("has a postings file for Arabic and every published translation", () => {
    for (const collection of HADITH_COLLECTIONS) {
      const codes = ["ar", ...collection.languages.map((language) => language.code)];
      for (const code of codes) {
        const file = path.join(ROOT, code, `${collection.id}.json`);
        expect(fs.existsSync(file), `${collection.id}/${code}`).toBe(true);
        expect(shard(code, collection.id).language, `${collection.id}/${code}`).toBe(code);
      }
    }
    // No collection folder holds a language it does not publish.
    const codes = new Set(fs.readdirSync(ROOT).filter((entry) => entry !== "docs.json"));
    expect([...codes].sort()).toEqual([
      "ar",
      "bn",
      "en",
      "fr",
      "id",
      "ru",
      "ta",
      "tr",
      "ur",
    ]);
  });
});

describe("searchHadiths", () => {
  const shards = [BUKHARI.ar, BUKHARI.en];

  function find(query: string, language: "ar" | "en" = "en", limit = 60) {
    return searchHadiths([BUKHARI[language]], DOCS.collections, query, limit);
  }

  it("finds a narration by an English word", () => {
    const { hits } = find("intentions");
    expect(hits[0]).toMatchObject({ collection: "bukhari", section: 1, number: 1 });
    expect(hits.length).toBeGreaterThan(1);
  });

  it("matches a prefix while the reader is still typing", () => {
    const { hits } = find("intent");
    expect(hits[0]).toMatchObject({ section: 1, number: 1 });
  });

  it("ignores Arabic diacritics and letter variants", () => {
    const plain = find("الاعمال", "ar");
    const vocalised = find("الأعمالُ", "ar");
    expect(plain.hits[0]).toMatchObject({ section: 1, number: 1 });
    expect(vocalised.hits.map((hit) => `${hit.section}:${hit.number}`)).toEqual(
      plain.hits.map((hit) => `${hit.section}:${hit.number}`),
    );
  });

  it("requires every word of a longer query", () => {
    const both = find("reward deeds");
    const addresses = new Set(both.hits.map((hit) => `${hit.section}:${hit.number}`));
    expect(addresses.has("1:1")).toBe(true);

    const impossible = find("reward zzzzznotaword");
    expect(impossible.total).toBe(0);
    expect(impossible.hits).toEqual([]);
  });

  it("drops queries shorter than two letters and unknown words", () => {
    expect(searchHadiths(shards, DOCS.collections, "").total).toBe(0);
    expect(searchHadiths(shards, DOCS.collections, "a").total).toBe(0);
    expect(searchHadiths(shards, DOCS.collections, "   ").total).toBe(0);
    expect(searchHadiths(shards, DOCS.collections, "zzzzznotaword").total).toBe(0);
  });

  it("merges the same narration found in Arabic and English", () => {
    const single = find("بسم", "ar").hits.map((hit) => `${hit.section}:${hit.number}`);
    const merged = searchHadiths(shards, DOCS.collections, "بسم").hits.map(
      (hit) => `${hit.section}:${hit.number}`,
    );
    expect(new Set(merged).size).toBe(merged.length);
    for (const address of single) expect(merged).toContain(address);
  });

  it("respects the result limit and reports the full total", () => {
    const all = searchHadiths(shards, DOCS.collections, "prayer", 5);
    expect(all.hits).toHaveLength(5);
    expect(all.total).toBeGreaterThan(5);
  });

  it("ignores a collection it has no catalogue for", () => {
    const orphan: HadithSearchShard = {
      language: "en",
      collection: "nope",
      docs: 1,
      terms: [["mercy", "0"]],
    };
    expect(searchHadiths([orphan], DOCS.collections, "mercy").total).toBe(0);
  });
});

describe("hadith search addresses", () => {
  it("points at the derived files and the cited narration", () => {
    expect(hadithSearchShardUrl("ur", "muslim")).toBe("/hadith-search/ur/muslim.json");
    expect(hadithUrl("bukhari", 1, 1)).toBe("/hadithly/bukhari/1/#hadith-1");
    expect(hadithUrl("muslim", 54, 402.2)).toBe("/hadithly/muslim/54/#hadith-402.2");
  });
});
