import fs from "node:fs";
import path from "node:path";
import { normalize } from "../src/lib/normalize.ts";

/**
 * Builds the derived hadith search index.
 *
 * One postings file per language and collection, plus a single catalogue file
 * giving every document id its book and hadith number. The postings are
 * document-frequency lists over normalized text: they never replace the
 * records the reader displays, which are fetched from `public/hadith/` when a
 * result is shown.
 *
 * A token is kept whatever its frequency. Dropping the commonest quarters of
 * the vocabulary would save only about a fifth of the index and would make
 * searches such as "الله" or "prayer" silently empty.
 */

const DATA_ROOT = path.join(process.cwd(), "public", "hadith");
const OUTPUT_ROOT = path.join(process.cwd(), "public", "hadith-search");
const GENERATED = path.join(process.cwd(), "src", "data", "generated", "hadith-index.json");

/** Single letters carry no information and would match everywhere. */
const MIN_TOKEN = 2;

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function formatCount(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

/** Postings are ascending document ids, delta-encoded in base 36. */
function encodePostings(ids) {
  const parts = [];
  let previous = 0;
  for (const id of ids) {
    parts.push((id - previous).toString(36));
    previous = id;
  }
  return parts.join(".");
}

function addTokens(index, text, docId) {
  if (!text) return;
  const seen = new Set();
  for (const token of normalize(text).split(" ")) {
    if (token.length < MIN_TOKEN || seen.has(token)) continue;
    seen.add(token);
    const list = index.get(token);
    if (list) list.push(docId);
    else index.set(token, [docId]);
  }
}

const generated = readJson(GENERATED);
if (!fs.existsSync(DATA_ROOT)) {
  throw new Error(`No hadith corpus at ${DATA_ROOT}. Run \`npm run data:hadith\` first.`);
}

fs.rmSync(OUTPUT_ROOT, { recursive: true, force: true });
fs.mkdirSync(OUTPUT_ROOT, { recursive: true });

const collections = {};
const stats = new Map();
let documents = 0;

for (const collection of generated.collections) {
  // Arabic is not a translation, so it is added to the published list.
  const codes = ["ar", ...collection.languages.map((language) => language.code)];
  const indexes = new Map(codes.map((code) => [code, new Map()]));
  const docs = [];

  for (const section of collection.sections) {
    const book = readJson(path.join(DATA_ROOT, collection.id, `${section.number}.json`));
    const translations = new Map();

    for (const code of codes) {
      if (code === "en") continue; // English sits beside the Arabic in the book file.
      const file = path.join(DATA_ROOT, collection.id, code, `${section.number}.json`);
      translations.set(
        code,
        fs.existsSync(file)
          ? new Map(readJson(file).hadiths.map((hadith) => [hadith.number, hadith.text]))
          : new Map(),
      );
    }

    for (const hadith of book.hadiths) {
      const docId = docs.length;
      docs.push([section.number, hadith.number]);
      addTokens(indexes.get("ar"), hadith.arabic, docId);
      addTokens(indexes.get("en"), hadith.english, docId);
      for (const code of codes) {
        if (code === "en") continue;
        addTokens(indexes.get(code), translations.get(code).get(hadith.number), docId);
      }
    }
  }

  collections[collection.id] = docs;
  documents += docs.length;

  for (const code of codes) {
    const index = indexes.get(code);
    const terms = [...index].map(([term, ids]) => [term, encodePostings(ids)]);
    terms.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));

    const file = path.join(OUTPUT_ROOT, code, `${collection.id}.json`);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(
      file,
      JSON.stringify({ language: code, collection: collection.id, docs: docs.length, terms }),
    );

    const current = stats.get(code) ?? { bytes: 0, terms: 0 };
    current.bytes += fs.statSync(file).size;
    current.terms += terms.length;
    stats.set(code, current);
  }
}

const catalogue = {
  source: generated.source,
  note: "Derived search data. Display text always comes from the original hadith records.",
  collections,
};
fs.writeFileSync(path.join(OUTPUT_ROOT, "docs.json"), JSON.stringify(catalogue) + "\n");

const total = [...stats.values()].reduce((sum, entry) => sum + entry.bytes, 0);
console.log(
  `Hadith search index: ${formatCount(documents)} narrations, ${stats.size} languages, ${(
    total / 1048576
  ).toFixed(1)} MiB in ${stats.size * generated.collections.length + 1} files`,
);
for (const [code, entry] of stats) {
  console.log(
    `  ${code}  ${formatCount(entry.terms)} terms  ${(entry.bytes / 1048576).toFixed(2)} MiB`,
  );
}
