import fs from "node:fs";
import path from "node:path";
import { normalize } from "../src/lib/normalize.ts";
import { COMMIT, PUBLIC_DATA_ROOT, SURAH_NUMBERS, pad3, readJson } from "./lib/source.mjs";

const entries = [];

for (const n of SURAH_NUMBERS) {
  const arabic = readJson(path.join(PUBLIC_DATA_ROOT, `surah/${pad3(n)}.json`));
  const english = readJson(path.join(PUBLIC_DATA_ROOT, `translation/en/${pad3(n)}.json`));

  // verse_0 is the identical unnumbered Bismillah; 1:1 already covers it once.
  for (let v = 1; v <= arabic.count; v++) {
    const key = `verse_${v}`;
    const a = arabic.verse[key];
    const t = english.verse[key];
    if (typeof a !== "string" || typeof t !== "string") {
      throw new Error(`Missing verse ${n}:${v} while building search index`);
    }
    entries.push({ s: n, v, a, t, na: normalize(a), nt: normalize(t) });
  }
}

const payload = {
  source: { repository: "https://github.com/semarketir/quranjson", commit: COMMIT },
  note: "Derived search data. Display text always comes from the original verse records.",
  entries,
};

const target = path.join(PUBLIC_DATA_ROOT, "search-index.json");
fs.writeFileSync(target, JSON.stringify(payload) + "\n");

const bytes = fs.statSync(target).size;
console.log(`Search index: ${entries.length} verses, ${(bytes / 1024 / 1024).toFixed(2)} MiB`);
