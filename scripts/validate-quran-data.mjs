/**
 * Release-blocking integrity validation for the pinned Quran data.
 *
 * Exits non-zero on any unexpected condition. Known source defects are pinned in
 * src/data/source-lock.json and must match exactly; a new anomaly fails the run.
 */
import fs from "node:fs";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { normalize } from "../src/lib/normalize.ts";
import {
  COMMIT,
  LOCK_PATH,
  PUBLIC_DATA_ROOT,
  SOURCE_ROOT,
  SURAH_NUMBERS,
  TRANSLATIONS,
  pad3,
  readJson,
  readText,
  sha256,
  sourcePath,
  surahFile,
  tajweedFile,
  translationFile,
  walkFiles,
} from "./lib/source.mjs";

const errors = [];
const warnings = [];
const fail = (message) => errors.push(message);
const warn = (message) => warnings.push(message);
const check = (condition, message) => {
  if (!condition) fail(message);
};

const lock = JSON.parse(fs.readFileSync(LOCK_PATH, "utf8"));
check(lock.commit === COMMIT, "source-lock commit does not match the pinned constant");
check(lock.repository === "https://github.com/semarketir/quranjson", "unexpected repository URL");

const publicFile = (rel) => path.join(PUBLIC_DATA_ROOT, rel);
const metadata = readJson(publicFile("metadata.json"));
const juz = readJson(publicFile("juz.json"));
const manifest = readJson(publicFile("manifest.json"));

check(Array.isArray(metadata) && metadata.length === 114, "metadata must contain 114 surahs");
check(juz.length === 30, `expected 30 juz, found ${juz.length}`);
check(manifest.commit === lock.commit, "public manifest commit mismatch");

// ---------------------------------------------------------------------------
// 1. Verify the local checkout still matches the pinned revision and hashes.
// ---------------------------------------------------------------------------
let sourceAvailable = fs.existsSync(SOURCE_ROOT);
if (sourceAvailable) {
  const { execFileSync } = await import("node:child_process");
  try {
    const head = execFileSync("git", ["-C", SOURCE_ROOT, "rev-parse", "HEAD"], {
      encoding: "utf8",
    }).trim();
    check(head === lock.commit, `checkout is at ${head}, expected ${lock.commit}`);
  } catch {
    warn("could not read .quranjson git revision");
  }

  for (const [rel, expected] of Object.entries(lock.files)) {
    if (!fs.existsSync(sourcePath(rel))) {
      fail(`pinned source file missing: ${rel}`);
      continue;
    }
    const actual = sha256(sourcePath(rel));
    if (actual !== expected) fail(`source hash mismatch: ${rel}`);
  }
  const extra = walkFiles(SOURCE_ROOT, "source").filter(
    (rel) => !rel.endsWith(".mp3") && !(rel in lock.files),
  );
  check(extra.length === 0, `unexpected unpinned source files: ${extra.slice(0, 5).join(", ")}`);

  for (const translation of TRANSLATIONS) {
    const sources = readText(
      sourcePath(`source/translation/${translation.languageCode}/.sources`),
    );
    check(
      sources.includes(translation.translator),
      `${translation.languageCode} translation attribution missing ${translation.translator}`,
    );
    check(
      sources.includes(translation.id),
      `${translation.languageCode} translation attribution missing ${translation.id}`,
    );
  }
  const audioSources = readText(sourcePath("source/audio/.sources"));
  check(/Ghamadi/i.test(audioSources), "audio attribution missing Ghamadi");
  check(/versebyversequran/i.test(audioSources), "audio attribution missing versebyversequran.com");
} else {
  warn("source checkout unavailable: hash pinning skipped, public data still validated structurally");
}

// ---------------------------------------------------------------------------
// 2. Structural and content checks across all 114 surahs.
// ---------------------------------------------------------------------------
const totalVerses = metadata.reduce((sum, s) => sum + s.count, 0);
check(totalVerses === 6236, `expected 6236 verses, found ${totalVerses}`);
check(lock.counts.verses === totalVerses, "locked verse count differs from metadata");

const computedIssues = { outOfBounds: [], overlapping: [], bom: [] };
const ruleCounts = {};
let renderedSegments = 0;
let numberedVerses = 0;
const translationRows = Object.fromEntries(
  TRANSLATIONS.map((translation) => [translation.languageCode, 0]),
);
let audioEntries = 0;
let bismillahVerses = 0;
const allRules = new Set(Object.keys(lock.counts.tajweedRules ?? {}));
const searchRefs = new Set();

for (const n of SURAH_NUMBERS) {
  const meta = metadata[n - 1];
  const arabic = readJson(publicFile(`surah/${pad3(n)}.json`));
  const translations = Object.fromEntries(
    TRANSLATIONS.map((translation) => [
      translation.languageCode,
      readJson(publicFile(`translation/${translation.languageCode}/${pad3(n)}.json`)),
    ]),
  );
  const tajweed = readJson(publicFile(`tajweed/${pad3(n)}.json`));
  const audio = readJson(publicFile(`audio/${pad3(n)}/index.json`));

  check(String(meta.index) === pad3(n), `metadata index ${meta.index} at position ${n}`);
  check(typeof meta.title === "string" && meta.title.length > 0, `missing title for surah ${n}`);
  check(typeof meta.titleAr === "string" && meta.titleAr.length > 0, `missing Arabic title for ${n}`);
  check(meta.count > 0, `invalid verse count for surah ${n}`);

  check(String(arabic.index) === pad3(n), `Arabic file index mismatch at ${n}`);
  check(arabic.count === meta.count, `Arabic count mismatch at ${n}`);

  const expectedBismillah = n !== 1 && n !== 9;
  const hasBismillah = typeof arabic.verse.verse_0 === "string";
  check(hasBismillah === expectedBismillah, `unexpected Bismillah verse_0 convention at surah ${n}`);
  if (hasBismillah) bismillahVerses++;

  const expectedArabicKeys = new Set(
    Array.from({ length: meta.count }, (_, i) => `verse_${i + 1}`),
  );
  if (hasBismillah) expectedArabicKeys.add("verse_0");
  const actualArabicKeys = Object.keys(arabic.verse);
  check(
    actualArabicKeys.length === expectedArabicKeys.size &&
      actualArabicKeys.every((key) => expectedArabicKeys.has(key)),
    `unexpected Arabic verse keys at surah ${n}`,
  );

  for (const key of expectedArabicKeys) {
    const text = arabic.verse[key];
    if (typeof text !== "string") {
      fail(`Arabic verse is not a string: ${n}:${key}`);
      continue;
    }
    check(text.length > 0, `empty Arabic verse: ${n}:${key}`);
    check(/[\u0621-\u064A\u0671]/.test(text), `no Arabic letters: ${n}:${key}`);
    if (text.startsWith("\uFEFF")) computedIssues.bom.push(`${n}:${key}:bom`);
    if (key !== "verse_0") numberedVerses++;
  }

  for (const translation of TRANSLATIONS) {
    const data = translations[translation.languageCode];
    check(
      String(Number(data.index)) === String(n),
      `${translation.languageCode} translation index mismatch at ${n}`,
    );
    check(
      data.count === meta.count,
      `${translation.languageCode} translation count mismatch at ${n}`,
    );
    // The Arabic commentary omits the unnumbered Bismillah row entirely; the
    // English and Indonesian datasets include it. Every other key must exist.
    const omitBismillah = translation.languageCode === "ar" && hasBismillah;
    const expectedTranslationKeys = omitBismillah
      ? [...expectedArabicKeys].filter((key) => key !== "verse_0")
      : [...expectedArabicKeys];
    check(
      Object.keys(data.verse).length === expectedTranslationKeys.length &&
        expectedTranslationKeys.every((key) => typeof data.verse[key] === "string"),
      `${translation.languageCode} translation keys do not map to Arabic verses at surah ${n}`,
    );
    for (const key of expectedTranslationKeys) {
      const text = data.verse[key];
      if (typeof text !== "string") continue;
      check(text.length > 0, `empty ${translation.languageCode} translation: ${n}:${key}`);
      translationRows[translation.languageCode]++;
    }
  }

  check(
    Object.keys(tajweed.verse).length === actualArabicKeys.length &&
      actualArabicKeys.every((key) => Array.isArray(tajweed.verse[key])),
    `tajweed keys do not map to Arabic verses at surah ${n}`,
  );

  const issueKeys = [];
  for (const key of actualArabicKeys) {
    const text = arabic.verse[key];
    const ranges = tajweed.verse[key];
    if (typeof text !== "string" || !Array.isArray(ranges)) continue;

    const sorted = [...ranges].sort((a, b) => a.start - b.start);
    let badBounds = false;
    let badOverlap = false;
    for (let i = 0; i < sorted.length; i++) {
      const r = sorted[i];
      renderedSegments++;
      if (typeof r.rule !== "string" || !allRules.has(r.rule)) {
        fail(`unknown tajweed rule ${JSON.stringify(r.rule)} at ${n}:${key}`);
      }
      ruleCounts[r.rule] = (ruleCounts[r.rule] ?? 0) + 1;
      if (
        !Number.isInteger(r.start) ||
        !Number.isInteger(r.end) ||
        r.start < 0 ||
        r.end > text.length ||
        r.start >= r.end
      ) {
        badBounds = true;
      }
      if (i > 0 && r.start < sorted[i - 1].end) badOverlap = true;
    }
    if (badBounds) computedIssues.outOfBounds.push(`${n}:${key}:out-of-bounds`);
    if (badOverlap) computedIssues.overlapping.push(`${n}:${key}:overlap`);
    issueKeys.push({ n, key, badBounds, badOverlap });
  }

  // Audio index maps one entry per Arabic key (including the unnumbered Bismillah).
  check(String(audio.index) === pad3(n), `audio index mismatch at ${n}`);
  check(audio.count === meta.count, `audio count mismatch at surah ${n}`);
  check(
    Object.keys(audio.verse).length === actualArabicKeys.length &&
      actualArabicKeys.every((key) => audio.verse[key] && typeof audio.verse[key].file === "string"),
    `audio keys do not map to Arabic verses at surah ${n}`,
  );
  for (const key of actualArabicKeys) {
    const entry = audio.verse[key];
    if (!entry) continue;
    audioEntries++;
    const verseNumber = Number(key.split("_")[1]);
    const expectedFile = `${String(verseNumber).padStart(3, "0")}.mp3`;
    check(entry.file === expectedFile, `audio file mapping mismatch at ${n}:${key}`);
    check(Number.isInteger(entry.size) && entry.size > 0, `invalid audio size at ${n}:${key}`);
    if (sourceAvailable) {
      const file = sourcePath(`source/audio/${pad3(n)}/${entry.file}`);
      if (!fs.existsSync(file)) {
        fail(`audio file missing: source/audio/${pad3(n)}/${entry.file}`);
      } else if (fs.statSync(file).size !== entry.size) {
        fail(`audio index size mismatch: source/audio/${pad3(n)}/${entry.file}`);
      }
    }
  }

  // Semantic equality with the original checkout where available.
  if (sourceAvailable) {
    const pairs = [
      [arabic, readJson(sourcePath(surahFile(n))), `surah/${n}`],
      [tajweed, readJson(sourcePath(tajweedFile(n))), `tajweed/${n}`],
      [audio, readJson(sourcePath(`source/audio/${pad3(n)}/index.json`)), `audio/${n}`],
      ...TRANSLATIONS.map((translation) => [
        translations[translation.languageCode],
        readJson(sourcePath(translationFile(n, translation.languageCode))),
        `translation/${translation.languageCode}/${n}`,
      ]),
    ];
    for (const [published, original, label] of pairs) {
      check(isDeepStrictEqual(published, original), `public ${label} differs from pinned source`);
    }
  }
}

check(numberedVerses === 6236, `numbered Arabic verses: ${numberedVerses}`);
check(translationRows.en === 6348, `English translation rows: ${translationRows.en}`);
check(translationRows.id === 6348, `Indonesian translation rows: ${translationRows.id}`);
check(translationRows.ar === 6236, `Arabic translation rows: ${translationRows.ar}`);
check(
  isDeepStrictEqual(translationRows, lock.counts.translationRows),
  "translation row counts differ from pinned lock",
);
check(bismillahVerses === 112, `unnumbered Bismillah verses: ${bismillahVerses}`);
check(audioEntries === 6348, `audio entries: ${audioEntries}`);
check(renderedSegments === 60841, `tajweed segments: ${renderedSegments}`);

// ---------------------------------------------------------------------------
// 3. Known anomalies must match the pinned lock exactly.
// ---------------------------------------------------------------------------
function compareSet(name, actual, expected) {
  const a = [...actual].sort();
  const e = [...expected].sort();
  if (!isDeepStrictEqual(a, e)) {
    const added = a.filter((x) => !e.includes(x));
    const removed = e.filter((x) => !a.includes(x));
    fail(
      `${name} differs from pinned lock` +
        (added.length ? `; new: ${added.slice(0, 5).join(", ")}` : "") +
        (removed.length ? `; missing: ${removed.slice(0, 5).join(", ")}` : ""),
    );
  }
}

compareSet("tajweed out-of-bounds verses", computedIssues.outOfBounds, lock.knownIssues.tajweedOutOfBounds);
compareSet("tajweed overlapping verses", computedIssues.overlapping, lock.knownIssues.tajweedOverlapping);
compareSet("BOM source strings", computedIssues.bom, lock.knownIssues.bomStrings);
check(
  isDeepStrictEqual(ruleCounts, lock.counts.tajweedRules),
  "tajweed rule counts differ from pinned lock",
);

// ---------------------------------------------------------------------------
// 4. Juz metadata must point at real verses.
// ---------------------------------------------------------------------------
for (const [i, entry] of juz.entries()) {
  check(entry.index === String(i + 1).padStart(2, "0"), `juz index mismatch at ${i + 1}`);
  for (const side of ["start", "end"]) {
    const ref = entry[side];
    const surah = Number(ref.index);
    check(surah >= 1 && surah <= 114, `juz ${entry.index} ${side} has invalid surah`);
    const verse = Number(String(ref.verse).replace("verse_", ""));
    check(
      verse >= 1 && verse <= metadata[surah - 1].count,
      `juz ${entry.index} ${side} points outside surah ${surah}`,
    );
  }
}

// ---------------------------------------------------------------------------
// 5. Search index must be derived from, and identical to, the display records.
// ---------------------------------------------------------------------------
const searchPath = publicFile("search-index.json");
check(fs.existsSync(searchPath), "search index missing (run npm run data:search)");
if (fs.existsSync(searchPath)) {
  const search = readJson(searchPath);
  check(search.source.commit === lock.commit, "search index commit mismatch");
  check(Array.isArray(search.entries) && search.entries.length === 6236, "search index must hold 6236 verses");
  for (const entry of search.entries ?? []) {
    const ref = `${entry.s}:${entry.v}`;
    if (searchRefs.has(ref)) fail(`duplicate search reference ${ref}`);
    searchRefs.add(ref);
    if (entry.v < 1 || entry.s < 1 || entry.s > 114) {
      fail(`invalid search reference ${ref}`);
      continue;
    }
    const arabic = readJson(publicFile(`surah/${pad3(entry.s)}.json`));
    const english = readJson(publicFile(`translation/en/${pad3(entry.s)}.json`));
    const key = `verse_${entry.v}`;
    check(entry.a === arabic.verse[key], `search Arabic text differs from source at ${ref}`);
    check(entry.t === english.verse[key], `search translation differs from source at ${ref}`);
    check(entry.na === normalize(entry.a), `search Arabic normalization is stale at ${ref}`);
    check(entry.nt === normalize(entry.t), `search English normalization is stale at ${ref}`);
  }
  check(searchRefs.size === 6236, `search references: ${searchRefs.size}`);
}

// ---------------------------------------------------------------------------
// Report.
// ---------------------------------------------------------------------------
console.log(`Pinned revision: ${lock.commit} (${lock.repository})`);
console.log(
  `Validated ${SURAH_NUMBERS.length} surahs, ${numberedVerses} numbered verses, ` +
    `translations en/id/ar: ${translationRows.en}/${translationRows.id}/${translationRows.ar} rows, ` +
    `${renderedSegments} tajweed segments, ${audioEntries} audio entries.`,
);
console.log(
  `Known pinned anomalies: ${lock.knownIssues.tajweedOutOfBounds.length} out-of-bounds verses, ` +
    `${lock.knownIssues.tajweedOverlapping.length} overlapping verses, ` +
    `${lock.knownIssues.bomStrings.length} BOM string.`,
);
for (const message of warnings) console.warn(`WARN  ${message}`);
if (errors.length) {
  console.error(`\nFAILED with ${errors.length} integrity error(s):`);
  for (const message of errors.slice(0, 50)) console.error(`  - ${message}`);
  if (errors.length > 50) console.error(`  ... and ${errors.length - 50} more`);
  process.exit(1);
}
console.log("Integrity validation passed.");
