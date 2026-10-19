/**
 * Run once, deliberately, when pinning or reviewing a new quranjson revision.
 * Writes src/data/source-lock.json with per-file hashes and known data issues.
 */
import fs from "node:fs";
import path from "node:path";
import {
  AUDIO,
  COMMIT,
  COMMIT_DATE,
  LICENSE,
  LOCK_PATH,
  REPO_URL,
  SOURCE_ROOT,
  SURAH_NUMBERS,
  TRANSLATIONS,
  findTajweedAnomalies,
  issueKey,
  readJson,
  sha256,
  sourcePath,
  surahFile,
  translationFile,
  walkFiles,
} from "./lib/source.mjs";

const metadata = readJson(sourcePath("source/surah.json"));
const juz = readJson(sourcePath("source/juz.json"));

const files = {};
for (const rel of walkFiles(SOURCE_ROOT, "source")) {
  if (rel.endsWith(".mp3")) continue;
  files[rel] = sha256(sourcePath(rel));
}

const anomalies = findTajweedAnomalies();
const bismillahSurahs = SURAH_NUMBERS.filter((n) => {
  const ar = readJson(sourcePath(surahFile(n)));
  return typeof ar.verse.verse_0 === "string";
});

const translationRows = {};
for (const translation of TRANSLATIONS) {
  let rows = 0;
  for (const n of SURAH_NUMBERS) {
    const file = readJson(sourcePath(translationFile(n, translation.languageCode)));
    for (const text of Object.values(file.verse)) {
      if (typeof text === "string" && text.length > 0) rows++;
    }
  }
  translationRows[translation.languageCode] = rows;
}

let audioFiles = 0;
let audioBytes = 0;
for (const n of SURAH_NUMBERS) {
  const index = readJson(sourcePath(`source/audio/${String(n).padStart(3, "0")}/index.json`));
  for (const entry of Object.values(index.verse)) audioBytes += entry.size;
  audioFiles += Object.keys(index.verse).length;
}

const lock = {
  repository: REPO_URL,
  commit: COMMIT,
  commitDate: COMMIT_DATE,
  license: LICENSE,
  pinnedAt: "2026-10-18",
  translations: TRANSLATIONS,
  audio: { ...AUDIO, files: audioFiles, bytes: audioBytes },
  counts: {
    surahs: metadata.length,
    verses: metadata.reduce((total, s) => total + s.count, 0),
    arabicEntries: metadata.reduce((total, s) => total + s.count + (bismillahSurahs.includes(s.index * 1) ? 1 : 0), 0),
    translationEntries: metadata.reduce((total, s) => total + s.count + (bismillahSurahs.includes(s.index * 1) ? 1 : 0), 0),
    numberedTranslations: metadata.reduce((total, s) => total + s.count, 0),
    translationRows,
    tajweedSegments: anomalies.segments,
    tajweedRules: anomalies.rules,
    bismillahVerses: bismillahSurahs.length,
    juz: juz.length,
  },
  knownIssues: {
    description:
      "The repository's tajweed offsets for verse_1 of most surahs are measured from an implicit Bismillah prefix that is not part of that verse. The ranges are not applied; those verses render as plain source text and an in-app note explains why. Some ranges overlap and are likewise not applied. The validator asserts this set stays exactly as pinned.",
    tajweedOutOfBounds: anomalies.outOfBounds.map(issueKey).sort(),
    tajweedOverlapping: anomalies.overlapping.map(issueKey).sort(),
    bomStrings: anomalies.bom.map(issueKey).sort(),
  },
  files,
};

fs.mkdirSync(path.dirname(LOCK_PATH), { recursive: true });
fs.writeFileSync(LOCK_PATH, JSON.stringify(lock, null, 2) + "\n");

console.log("Wrote", path.relative(process.cwd(), LOCK_PATH));
console.log("files:", Object.keys(files).length, "audio entries:", audioFiles);
console.log("translation rows:", translationRows);
console.log("out-of-bounds verses:", anomalies.outOfBounds.length);
console.log("overlapping verses:", anomalies.overlapping.length);
console.log("BOM strings:", anomalies.bom.length);
console.log("bismillah verse_0 surahs:", bismillahSurahs.length);
