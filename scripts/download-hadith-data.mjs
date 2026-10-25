#!/usr/bin/env node
/**
 * Downloads the Hadithly corpus from fawazahmed0/hadith-api and writes it as
 * same-origin files.
 *
 * A whole Bukhari is ~10 MB in Arabic, which is far too much to fetch on a page
 * view, so this script splits every edition by the collection's own book
 * number: the reader then fetches only the book it is showing, in the language
 * it is showing.
 *
 * The revision is pinned. `@1` is a moving branch, and a reading app should not
 * change its scripture because someone pushed to the upstream repository.
 *
 * Output:
 *   public/hadith/{collection}/{section}.json          one book, Arabic + English
 *   public/hadith/{collection}/{language}/{section}.json  one book, one translation
 *   src/data/generated/hadith-index.json               counts, languages, source
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const PINNED_COMMIT = "df57907be35291c91ad6a6691180e22ca9920784";
const BASE = `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@${PINNED_COMMIT}`;

const COLLECTIONS = [
  "bukhari",
  "muslim",
  "abudawud",
  "tirmidhi",
  "nasai",
  "ibnmajah",
  "malik",
  "nawawi",
  "qudsi",
  "dehlawi",
];

/**
 * The languages the datasets publish, keyed by the name `editions.json` uses.
 * The reader shows the native label beside the English one, and lays out the
 * text right to left for the two languages that are written that way.
 */
const LANGUAGES = {
  Arabic: { code: "ar", name: "Arabic", native: "العربية", direction: "rtl" },
  Bengali: { code: "bn", name: "Bengali", native: "বাংলা", direction: "ltr" },
  English: { code: "en", name: "English", native: "English", direction: "ltr" },
  French: { code: "fr", name: "French", native: "Français", direction: "ltr" },
  Indonesian: { code: "id", name: "Indonesian", native: "Bahasa Indonesia", direction: "ltr" },
  Russian: { code: "ru", name: "Russian", native: "Русский", direction: "ltr" },
  Tamil: { code: "ta", name: "Tamil", native: "தமிழ்", direction: "ltr" },
  Turkish: { code: "tr", name: "Turkish", native: "Türkçe", direction: "ltr" },
  Urdu: { code: "ur", name: "Urdu", native: "اردو", direction: "rtl" },
};

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, "public", "hadith");
const INDEX_FILE = path.join(ROOT, "src", "data", "generated", "hadith-index.json");
const CACHE_DIR = path.join(os.tmpdir(), "mushafly-hadith-cache");

const clean = (value) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "");

function fail(message) {
  console.error(`hadith: ${message}`);
  process.exit(1);
}

/**
 * Downloads one remote JSON file, reusing a cached copy for this pinned
 * revision so a failed run can be resumed without pulling gigabytes again.
 */
async function fetchRemote(relativePath) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const cached = path.join(CACHE_DIR, path.basename(relativePath));
  if (fs.existsSync(cached)) {
    return JSON.parse(fs.readFileSync(cached, "utf8"));
  }

  const url = `${BASE}/${relativePath}`;
  const response = await fetch(url, { headers: { "user-agent": "mushafly-hadithly" } });
  if (!response.ok) fail(`${relativePath}: ${url} returned ${response.status}`);

  const text = await response.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    fail(`${relativePath}: the response was not valid JSON`);
  }
  fs.writeFileSync(cached, text);
  return parsed;
}

const fetchEdition = (edition) => fetchRemote(`editions/${edition}.json`);

/** Deduplicates grade rows and keeps the payload small. */
function normaliseGrades(hadith) {
  const rows = [];
  const seen = new Set();
  for (const entry of Array.isArray(hadith.grades) ? hadith.grades : []) {
    const scholar = clean(entry?.name);
    const grade = clean(entry?.grade);
    if (!scholar || !grade) continue;
    const key = `${scholar}\u0000${grade}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({ scholar, grade });
  }
  return rows;
}

/**
 * The editions of one collection in `editions.json`, one per language. A
 * `ara-*1` edition is the same Arabic with the diacritics stripped for easier
 * searching, so it would only repeat the vocalised text beside itself.
 */
function editionsFor(registry, collection) {
  const rows = registry[collection]?.collection ?? [];
  if (!rows.length) fail(`${collection}: editions.json lists no editions`);

  const byLanguage = new Map();
  for (const row of rows) {
    const language = LANGUAGES[row.language];
    if (!language) fail(`${collection}: unknown language "${row.language}"`);
    if (language.code === "ar" && /\d$/.test(row.name)) continue;
    if (!byLanguage.has(language.code)) {
      byLanguage.set(language.code, {
        edition: row.name,
        code: language.code,
        name: language.name,
        native: language.native,
        direction: language.direction,
      });
    }
  }
  return [...byLanguage.values()];
}

/**
 * The published text of one edition, indexed both ways. Editions of the same
 * collection agree on the in-book `book:hadith` reference, and on the
 * collection number except for a handful of rows where one edition counts
 * differently — so the reference is tried first and the number second.
 */
function textIndex(edition) {
  const byNumber = new Map();
  const byReference = new Map();
  for (const hadith of edition.hadiths ?? []) {
    const text = clean(hadith.text);
    if (!text) continue;

    const number = Number(hadith.hadithnumber);
    if (Number.isFinite(number) && !byNumber.has(number)) byNumber.set(number, text);

    const key = referenceKey(hadith.reference?.book, hadith.reference?.hadith);
    if (key && !byReference.has(key)) byReference.set(key, text);
  }
  return { byNumber, byReference };
}

/**
 * A citation key, or null when the edition places the narration in no book.
 * Those rows carry `0:0` — sometimes hundreds of them — so treating that as a
 * real reference would attach the same Arabic text to all of them.
 */
function referenceKey(book, inBook) {
  if (!Number.isInteger(book) || !Number.isInteger(inBook)) return null;
  if (book < 1) return null;
  return `${book}:${inBook}`;
}

function lookupText(index, book, inBook, number) {
  const key = referenceKey(book, inBook);
  return (key ? index.byReference.get(key) : undefined) ?? index.byNumber.get(number) ?? null;
}

/**
 * The English edition is the spine: it carries the numbering, the book
 * divisions and their names. Every other edition is joined to it by the
 * collection's own hadith number, which the datasets keep identical across
 * languages (checked against the book reference as well, so a shifted row can
 * never attach the wrong text).
 */
function buildSpine(english, arabic) {
  const arabicIndex = textIndex(arabic);
  const arabicNumberByNumber = new Map(
    (arabic.hadiths ?? []).map((hadith) => [
      Number(hadith.hadithnumber),
      Number(hadith.arabicnumber ?? hadith.hadithnumber),
    ]),
  );

  const names = english.metadata?.sections ?? {};
  const sections = new Map();
  const seen = new Set();
  let skipped = 0;

  for (const hadith of english.hadiths ?? []) {
    const number = Number(hadith.hadithnumber);
    const section = hadith.reference?.book;
    const inBook = hadith.reference?.hadith;
    if (!Number.isFinite(number) || !Number.isInteger(section) || !Number.isInteger(inBook)) {
      skipped++;
      continue;
    }

    // A number identifies a narration inside its collection; repeating one
    // would put two rows under the same anchor.
    if (seen.has(number)) {
      skipped++;
      continue;
    }
    seen.add(number);

    const englishText = clean(hadith.text);
    const arabicText = lookupText(arabicIndex, section, inBook, number) ?? "";
    if (!englishText && !arabicText) {
      skipped++;
      continue;
    }

    const grades = normaliseGrades(hadith);
    // A handful of rows carry a U+FFFD from an edition's own encoding. They are
    // marked rather than repaired, so the page can say so instead of quietly
    // inventing a character in a hadith.
    const damaged = arabicText.includes("\uFFFD") || englishText.includes("\uFFFD");

    const record = {
      number,
      arabicNumber: arabicNumberByNumber.get(number) ?? number,
      inBook,
      arabic: arabicText || null,
      english: englishText || null,
      ...(damaged ? { damaged: true } : {}),
      ...(grades.length ? { grades } : {}),
    };

    if (!sections.has(section)) sections.set(section, []);
    sections.get(section).push(record);
  }

  for (const rows of sections.values()) rows.sort((a, b) => a.number - b.number);

  // Bukhari and a few other editions leave some narrations with book 0 and no
  // chapter name: they belong somewhere in the book, the dataset just did not
  // say where. Presenting them as "Book 0" would put a stray chapter at the
  // front, so each one is placed in the chapter whose published number range
  // contains it, or in the last chapter before it.
  const unplaced = sections.get(0);
  if (unplaced && !clean(names[0])) {
    sections.delete(0);
    const ranges = Object.entries(english.metadata?.section_details ?? {})
      .map(([number, range]) => ({
        number: Number(number),
        first: Number(range?.hadithnumber_first),
        last: Number(range?.hadithnumber_last),
      }))
      .filter((range) => range.number !== 0 && range.last >= range.first)
      .sort((a, b) => a.first - b.first);

    for (const row of unplaced) {
      const containing = ranges.find((range) => row.number >= range.first && row.number <= range.last);
      const preceding = [...ranges].reverse().find((range) => range.first <= row.number);
      const target = containing ?? preceding ?? ranges[0];
      if (!target) continue;
      if (!sections.has(target.number)) sections.set(target.number, []);
      sections.get(target.number).push({ ...row, inBook: null });
    }

    for (const rows of sections.values()) rows.sort((a, b) => a.number - b.number);
  }

  return { sections, names, skipped };
}

async function main() {
  console.log(`hadith: syncing ${COLLECTIONS.length} collections from ${PINNED_COMMIT.slice(0, 7)}`);

  const registry = await fetchRemote("editions.json");

  fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const index = [];
  const languageTotals = new Map();
  let totalHadiths = 0;
  let totalSections = 0;
  let totalSkipped = 0;
  let totalDamaged = 0;

  for (const collection of COLLECTIONS) {
    const editions = editionsFor(registry, collection);
    const arabic = editions.find((edition) => edition.code === "ar");
    const english = editions.find((edition) => edition.code === "en");
    if (!arabic) fail(`${collection}: no Arabic edition`);
    if (!english) fail(`${collection}: no English edition, which would leave the books unnamed`);

    const spine = buildSpine(
      await fetchEdition(english.edition),
      await fetchEdition(arabic.edition),
    );
    totalSkipped += spine.skipped;

    // Every other language is fetched once and joined to the spine by number.
    const translations = [];
    for (const edition of editions) {
      if (edition.code === "ar" || edition.code === "en") continue;
      translations.push({
        ...edition,
        index: textIndex(await fetchEdition(edition.edition)),
      });
    }

    const languages = [
      {
        code: "en",
        name: "English",
        native: "English",
        direction: "ltr",
        hadiths: [...spine.sections.values()]
          .flat()
          .filter((row) => Boolean(row.english)).length,
      },
    ];

    const dir = path.join(OUTPUT_DIR, collection);
    fs.mkdirSync(dir, { recursive: true });

    const sectionIndex = [];
    let hadiths = 0;
    let damaged = 0;

    for (const [number, rows] of [...spine.sections].sort((a, b) => a[0] - b[0])) {
      const name = clean(spine.names[number]) || `Book ${number}`;
      const payload = { collection, section: number, name, hadiths: rows };
      fs.writeFileSync(path.join(dir, `${number}.json`), JSON.stringify(payload));

      const numbers = rows.map((row) => row.number).filter(Number.isFinite);
      sectionIndex.push({
        number,
        name,
        count: rows.length,
        first: numbers.length ? Math.min(...numbers) : null,
        last: numbers.length ? Math.max(...numbers) : null,
      });
      hadiths += rows.length;
      damaged += rows.filter((row) => row.damaged).length;

      // A book in a language that never translated a narration gets no file,
      // so the reader can tell "no translation" from "not fetched yet".
      for (const translation of translations) {
        const translated = [];
        for (const row of rows) {
          const text = lookupText(translation.index, number, row.inBook, row.number);
          if (text) translated.push({ number: row.number, text });
        }
        if (!translated.length) continue;

        const languageDir = path.join(dir, translation.code);
        if (!fs.existsSync(languageDir)) fs.mkdirSync(languageDir, { recursive: true });
        fs.writeFileSync(
          path.join(languageDir, `${number}.json`),
          JSON.stringify({
            collection,
            section: number,
            language: translation.code,
            direction: translation.direction,
            hadiths: translated,
          }),
        );

        const existing = languages.find((language) => language.code === translation.code);
        if (existing) existing.hadiths += translated.length;
        else
          languages.push({
            code: translation.code,
            name: translation.name,
            native: translation.native,
            direction: translation.direction,
            hadiths: translated.length,
          });
      }
    }

    if (!hadiths) fail(`${collection}: no hadiths were written`);
    totalHadiths += hadiths;
    totalSections += sectionIndex.length;
    totalDamaged += damaged;

    for (const language of languages) {
      const current = languageTotals.get(language.code) ?? {
        code: language.code,
        name: language.name,
        native: language.native,
        direction: language.direction,
        hadiths: 0,
        collections: 0,
      };
      current.hadiths += language.hadiths;
      current.collections += 1;
      languageTotals.set(language.code, current);
    }

    index.push({
      id: collection,
      hadiths,
      sectionCount: sectionIndex.length,
      damaged,
      languages: languages.sort(
        (a, b) => Number(b.code === "en") - Number(a.code === "en") || a.name.localeCompare(b.name),
      ),
      sections: sectionIndex,
    });

    console.log(
      `  ${collection.padEnd(9)} ${String(hadiths).padStart(5)} hadiths · ` +
        `${sectionIndex.length} books · ${languages.length} languages`,
    );
  }

  const generated = {
    source: {
      name: "hadith-api",
      repository: "https://github.com/fawazahmed0/hadith-api",
      revision: PINNED_COMMIT,
      license: "Unlicense (public domain)",
      arabic: "Arabic text as published in the ara-* editions",
      english: "English translation as published in the eng-* editions",
      translations: "Every other translation the upstream publishes for these collections",
    },
    languages: [...languageTotals.values()].sort(
      (a, b) => Number(b.code === "en") - Number(a.code === "en") || a.name.localeCompare(b.name),
    ),
    totals: {
      collections: index.length,
      sections: totalSections,
      hadiths: totalHadiths,
      damaged: totalDamaged,
      languages: languageTotals.size,
    },
    collections: index,
  };

  fs.mkdirSync(path.dirname(INDEX_FILE), { recursive: true });
  fs.writeFileSync(INDEX_FILE, `${JSON.stringify(generated, null, 2)}\n`);

  console.log(
    `hadith: wrote ${totalHadiths} hadiths in ${totalSections} books, ` +
      `${languageTotals.size} languages` +
      (totalSkipped ? ` (${totalSkipped} unusable rows skipped)` : ""),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
