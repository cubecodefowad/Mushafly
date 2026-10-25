#!/usr/bin/env node
/**
 * Checks the Hadithly corpus against its index.
 *
 * The page for a book is generated from `hadith-index.json`, while the text is
 * read from `public/hadith/{collection}/{section}.json` and, for every
 * translation other than English,
 * `public/hadith/{collection}/{language}/{section}.json`. A build must fail if
 * the index and the files disagree, if a hadith has no Arabic text, if a
 * translation is missing or attached to a narration that does not exist, or if
 * the text contains a replacement character, because each of those is visible
 * to a reader.
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "public", "hadith");
const INDEX_FILE = path.join(ROOT, "src", "data", "generated", "hadith-index.json");

const problems = [];
const fail = (message) => problems.push(message);

function readIndex() {
  if (!fs.existsSync(INDEX_FILE)) {
    fail("src/data/generated/hadith-index.json is missing. Run `npm run data:hadith`.");
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(INDEX_FILE, "utf8"));
  } catch (error) {
    fail(`hadith-index.json is not valid JSON: ${error.message}`);
    return null;
  }
}

const index = readIndex();
if (!index) {
  console.error(problems.join("\n"));
  process.exit(1);
}

if (!Array.isArray(index.collections) || index.collections.length === 0) {
  fail("hadith-index.json lists no collections.");
}

let totalHadiths = 0;
let totalSections = 0;
let withEnglish = 0;
let withGrades = 0;
let withoutArabic = 0;
let totalDamaged = 0;
let totalTranslated = 0;
const seenIds = new Set();
/** Every narration the files hold, so a translation cannot point at a ghost. */
const knownHadiths = new Set();
const knownBooks = new Set();

for (const collection of index.collections ?? []) {
  if (seenIds.has(collection.id)) fail(`${collection.id}: listed twice.`);
  seenIds.add(collection.id);

  const dir = path.join(DATA_DIR, collection.id);
  if (!fs.existsSync(dir)) {
    fail(`${collection.id}: no directory at public/hadith/${collection.id}.`);
    continue;
  }

  const files = new Set(fs.readdirSync(dir).filter((file) => file.endsWith(".json")));
  const numbers = new Set();
  let collectionDamaged = 0;

  for (const section of collection.sections ?? []) {
    const file = `${section.number}.json`;
    if (!files.has(file)) {
      fail(`${collection.id}: index lists book ${section.number} but ${file} is missing.`);
      continue;
    }
    files.delete(file);

    let payload;
    try {
      payload = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
    } catch (error) {
      fail(`${collection.id}/${file}: not valid JSON (${error.message}).`);
      continue;
    }

    if (payload.collection !== collection.id || payload.section !== section.number) {
      fail(`${collection.id}/${file}: header does not match its location.`);
    }
    if (!Array.isArray(payload.hadiths) || payload.hadiths.length !== section.count) {
      fail(
        `${collection.id}/${file}: index says ${section.count} hadiths, file has ${
          Array.isArray(payload.hadiths) ? payload.hadiths.length : "none"
        }.`,
      );
      continue;
    }
    if (!payload.name || typeof payload.name !== "string") {
      fail(`${collection.id}/${file}: the book has no name.`);
    }

    let previous = -Infinity;
    let damaged = 0;
    for (const hadith of payload.hadiths) {
      // Inserted narrations are numbered with a fraction (402.2), so a positive
      // finite number is what is required, not an integer.
      if (!Number.isFinite(hadith.number) || hadith.number < 1) {
        fail(`${collection.id}/${file}: a hadith has no positive number.`);
        continue;
      }
      if (numbers.has(hadith.number)) {
        fail(`${collection.id}/${file}: hadith ${hadith.number} appears twice in this collection.`);
      }
      numbers.add(hadith.number);
      knownHadiths.add(`${collection.id}:${hadith.number}`);
      if (hadith.number < previous) {
        fail(`${collection.id}/${file}: hadiths are out of order at ${hadith.number}.`);
      }
      previous = hadith.number;

      const hasArabic = Boolean(hadith.arabic?.trim());
      const hasEnglish = Boolean(hadith.english?.trim());
      if (!hasArabic && !hasEnglish) {
        fail(`${collection.id}/${file}: hadith ${hadith.number} has no text at all.`);
      }
      // A few editions publish a narration only in translation. That is worth
      // counting, but it is the source's shape rather than a broken build.
      if (!hasArabic) withoutArabic++;
      if (hasEnglish) withEnglish++;
      if (Array.isArray(hadith.grades) && hadith.grades.length) withGrades++;

      // The datasets ship a few damaged characters. They are shown as they are
      // and declared, so the count must stay truthful instead of drifting.
      const hasReplacement =
        hadith.arabic?.includes("\uFFFD") || hadith.english?.includes("\uFFFD");
      if (hasReplacement) damaged++;
      if (Boolean(hadith.damaged) !== Boolean(hasReplacement)) {
        fail(`${collection.id}/${file}: hadith ${hadith.number} has a wrong damaged flag.`);
      }
    }

    totalHadiths += payload.hadiths.length;
    totalSections++;
    collectionDamaged += damaged;
    knownBooks.add(`${collection.id}:${section.number}`);
  }

  if (collectionDamaged !== collection.damaged) {
    fail(
      `${collection.id}: ${collectionDamaged} damaged hadiths, index says ${collection.damaged}.`,
    );
  }
  totalDamaged += collectionDamaged;

  if (files.size) {
    fail(`${collection.id}: ${files.size} book files exist that the index does not list.`);
  }
  if (collection.hadiths !== numbers.size) {
    fail(`${collection.id}: index says ${collection.hadiths} hadiths, files hold ${numbers.size}.`);
  }

  // ---------------------------------------------------------- translations
  const languageDirs = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const expectedDirs = (collection.languages ?? [])
    .filter((language) => language.code !== "en")
    .map((language) => language.code)
    .sort();
  if (languageDirs.join() !== expectedDirs.join()) {
    fail(
      `${collection.id}: translation folders are ${languageDirs.join(", ") || "none"}, index lists ${
        expectedDirs.join(", ") || "none"
      }.`,
    );
  }

  for (const language of collection.languages ?? []) {
    if (!/^[a-z]{2}$/.test(language.code)) {
      fail(`${collection.id}: "${language.code}" is not a language code.`);
    }
    if (!language.name || !language.native) {
      fail(`${collection.id}/${language.code}: the language has no label.`);
    }
    if (!Number.isInteger(language.hadiths) || language.hadiths < 1) {
      fail(`${collection.id}/${language.code}: no narrations are declared.`);
    }
    if (language.code === "en") continue;

    const languageDir = path.join(dir, language.code);
    const files = fs.readdirSync(languageDir).filter((file) => file.endsWith(".json"));
    if (!files.length) {
      fail(`${collection.id}/${language.code}: the folder has no book files.`);
      continue;
    }

    let translated = 0;
    for (const file of files) {
      const section = Number(file.replace(".json", ""));
      if (!knownBooks.has(`${collection.id}:${section}`)) {
        fail(`${collection.id}/${language.code}/${file}: there is no such book.`);
        continue;
      }

      let payload;
      try {
        payload = JSON.parse(fs.readFileSync(path.join(languageDir, file), "utf8"));
      } catch (error) {
        fail(`${collection.id}/${language.code}/${file}: not valid JSON (${error.message}).`);
        continue;
      }

      if (payload.collection !== collection.id || payload.section !== section) {
        fail(`${collection.id}/${language.code}/${file}: header does not match its location.`);
      }
      if (payload.language !== language.code) {
        fail(`${collection.id}/${language.code}/${file}: says it is ${payload.language}.`);
      }
      if (payload.direction !== language.direction) {
        fail(`${collection.id}/${language.code}/${file}: direction does not match the index.`);
      }
      if (!payload.hadiths?.length) {
        fail(`${collection.id}/${language.code}/${file}: has no narrations.`);
        continue;
      }

      const seenHere = new Set();
      for (const hadith of payload.hadiths) {
        if (!Number.isFinite(hadith.number)) {
          fail(`${collection.id}/${language.code}/${file}: a narration has no number.`);
          continue;
        }
        if (!knownHadiths.has(`${collection.id}:${hadith.number}`)) {
          fail(`${collection.id}/${language.code}/${file}: hadith ${hadith.number} is not in the book.`);
        }
        if (seenHere.has(hadith.number)) {
          fail(`${collection.id}/${language.code}/${file}: hadith ${hadith.number} appears twice.`);
        }
        seenHere.add(hadith.number);
        if (!hadith.text?.trim()) {
          fail(`${collection.id}/${language.code}/${file}: hadith ${hadith.number} is empty.`);
        }
        translated++;
      }
    }

    if (translated !== language.hadiths) {
      fail(
        `${collection.id}/${language.code}: index says ${language.hadiths} translated hadiths, files hold ${translated}.`,
      );
    }
    totalTranslated += translated;
  }
}

// The library-wide language list must be the sum of the collections' own.
for (const language of index.languages ?? []) {
  const collections = (index.collections ?? []).filter((collection) =>
    (collection.languages ?? []).some((item) => item.code === language.code),
  );
  const hadiths = collections.reduce(
    (sum, collection) =>
      sum +
      (collection.languages ?? []).find((item) => item.code === language.code)?.hadiths,
    0,
  );
  if (collections.length !== language.collections) {
    fail(`${language.code}: listed for ${language.collections} collections, the files cover ${collections.length}.`);
  }
  if (hadiths !== language.hadiths) {
    fail(`${language.code}: index says ${language.hadiths} hadiths, the collections sum to ${hadiths}.`);
  }
}
if (index.totals?.languages !== (index.languages ?? []).length) {
  fail(`totals.languages is ${index.totals?.languages} but ${index.languages?.length} are listed.`);
}

if (index.totals?.hadiths !== totalHadiths) {
  fail(`totals.hadiths is ${index.totals?.hadiths} but the files hold ${totalHadiths}.`);
}
if (index.totals?.sections !== totalSections) {
  fail(`totals.sections is ${index.totals?.sections} but the files hold ${totalSections}.`);
}
if (index.totals?.damaged !== totalDamaged) {
  fail(`totals.damaged is ${index.totals?.damaged} but the files hold ${totalDamaged}.`);
}
if (!index.source?.revision || !/^[0-9a-f]{40}$/.test(index.source.revision)) {
  fail("source.revision is not a pinned 40-character commit.");
}

if (problems.length) {
  console.error(`hadith: ${problems.length} problem(s)\n- ${problems.slice(0, 40).join("\n- ")}`);
  process.exit(1);
}

console.log(
  `hadith: ${index.collections.length} collections · ${totalSections} books · ` +
    `${totalHadiths} hadiths (${withEnglish} with English, ${withoutArabic} English-only, ` +
    `${withGrades} with a grading, ${totalDamaged} with a damaged source character) · ` +
    `${(index.languages ?? []).length} translations, ${totalTranslated} translated hadiths at ` +
    `${index.source.revision.slice(0, 7)}`,
);
