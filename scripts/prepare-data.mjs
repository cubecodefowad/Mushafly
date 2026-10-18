/**
 * Copies the pinned quranjson content into public/quran for runtime use.
 * The JSON is re-serialized (formatting only); every Quranic string is preserved
 * exactly, including any U+FEFF artifact, which the adapter handles explicitly.
 */
import fs from "node:fs";
import path from "node:path";
import {
  AUDIO,
  COMMIT,
  LOCK_PATH,
  PUBLIC_DATA_ROOT,
  SOURCE_ROOT,
  SURAH_NUMBERS,
  TRANSLATION,
  audioIndexFile,
  pad3,
  readJson,
  sha256,
  sourcePath,
  surahFile,
  tajweedFile,
  translationFile,
  walkFiles,
} from "./lib/source.mjs";

if (!fs.existsSync(SOURCE_ROOT)) {
  console.error("Missing .quranjson checkout. Clone the pinned revision first:");
  console.error("  git clone https://github.com/semarketir/quranjson.git .quranjson");
  console.error("  git -C .quranjson checkout " + COMMIT);
  process.exit(1);
}

const lock = JSON.parse(fs.readFileSync(LOCK_PATH, "utf8"));

// 1. Verify the checkout is exactly the pinned revision.
const { execFileSync } = await import("node:child_process");
let head = "";
try {
  head = execFileSync("git", ["-C", SOURCE_ROOT, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
} catch {
  console.error("Could not read the git revision of .quranjson.");
  process.exit(1);
}
if (head !== lock.commit) {
  console.error(`Source revision mismatch: checked out ${head}, pinned ${lock.commit}.`);
  process.exit(1);
}

// 2. Verify every pinned source file hash.
let checked = 0;
for (const [rel, expected] of Object.entries(lock.files)) {
  const actual = sha256(sourcePath(rel));
  if (actual !== expected) {
    console.error(`Hash mismatch for ${rel}: ${actual} != ${expected}`);
    process.exit(1);
  }
  checked++;
}
const extra = walkFiles(SOURCE_ROOT, "source").filter(
  (rel) => !rel.endsWith(".mp3") && !(rel in lock.files),
);
if (extra.length) {
  console.error("Unexpected source files not covered by the lock:", extra.slice(0, 10));
  process.exit(1);
}
console.log(`Verified ${checked} pinned source files at ${lock.commit}.`);

// 3. Write runtime JSON.
function writeJson(rel, value) {
  const target = path.join(PUBLIC_DATA_ROOT, rel);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, JSON.stringify(value) + "\n");
}

fs.rmSync(PUBLIC_DATA_ROOT, { recursive: true, force: true });

const metadata = readJson(sourcePath("source/surah.json"));
writeJson("metadata.json", metadata);
writeJson("juz.json", readJson(sourcePath("source/juz.json")));

const surahMeta = [];
for (const n of SURAH_NUMBERS) {
  const ar = readJson(sourcePath(surahFile(n)));
  const en = readJson(sourcePath(translationFile(n)));
  const tajweed = readJson(sourcePath(tajweedFile(n)));
  const audio = readJson(sourcePath(audioIndexFile(n)));

  writeJson(`surah/${pad3(n)}.json`, ar);
  writeJson(`translation/en/${pad3(n)}.json`, en);
  writeJson(`tajweed/${pad3(n)}.json`, tajweed);
  writeJson(`audio/${pad3(n)}/index.json`, audio);

  const meta = metadata[n - 1];
  surahMeta.push({
    number: n,
    name: meta.title,
    arabicName: meta.titleAr,
    verseCount: meta.count,
    place: meta.place,
    type: meta.type,
    bismillah: typeof ar.verse.verse_0 === "string",
    sourceFile: `source/surah/${path.basename(surahFile(n))}`,
  });
}

const generatedDir = path.resolve("src/data/generated");
fs.mkdirSync(generatedDir, { recursive: true });
fs.writeFileSync(path.join(generatedDir, "surah-meta.json"), JSON.stringify(surahMeta, null, 2) + "\n");
fs.writeFileSync(
  path.join(generatedDir, "attribution.json"),
  JSON.stringify(
    {
      repository: lock.repository,
      commit: lock.commit,
      license: lock.license,
      translation: TRANSLATION,
      audio: AUDIO,
    },
    null,
    2,
  ) + "\n",
);

writeJson("manifest.json", {
  repository: lock.repository,
  commit: lock.commit,
  license: lock.license,
  translation: TRANSLATION,
  audio: AUDIO,
  counts: lock.counts,
  knownIssues: {
    tajweedOutOfBounds: lock.knownIssues.tajweedOutOfBounds,
    tajweedOverlapping: lock.knownIssues.tajweedOverlapping,
    bomStrings: lock.knownIssues.bomStrings,
  },
});

console.log(`Prepared ${SURAH_NUMBERS.length} surahs, ${lock.counts.verses} numbered verses.`);
