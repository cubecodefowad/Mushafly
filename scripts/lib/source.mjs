import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const REPO_URL = "https://github.com/semarketir/quranjson";
export const COMMIT = "7ca6f46ec9a1a029cdb220c2531d509f4a5b5e98";
export const COMMIT_DATE = "2021-02-16";
export const LICENSE = "MIT";

export const SOURCE_ROOT = path.resolve(".quranjson");
export const PUBLIC_DATA_ROOT = path.resolve("public/quran");
export const LOCK_PATH = path.resolve("src/data/source-lock.json");

export const TRANSLATIONS = [
  {
    languageCode: "en",
    id: "en.itani",
    label: "English",
    name: "Itani",
    shortName: "Itani",
    translator: "Talal Itani",
    source: "Tanzil.net",
    lastUpdate: "July 19, 2013",
    direction: "ltr",
    htmlLang: "en",
    language: "English",
    group: "English",
    rows: 6348,
  },
  {
    languageCode: "id",
    id: "id.indonesian",
    label: "Indonesia",
    name: "Bahasa Indonesia",
    shortName: "Bahasa Indonesia",
    translator: "Indonesian Ministry of Religious Affairs",
    source: "Tanzil.net",
    lastUpdate: "June 4, 2010",
    direction: "ltr",
    htmlLang: "id",
    language: "Indonesian",
    group: "Indonesian",
    rows: 6348,
  },
  {
    languageCode: "ar",
    id: "ar.muyassar",
    label: "العربية",
    name: "Tafsir al-Muyassar",
    shortName: "Muyassar",
    translator: "King Fahad Quran Complex",
    source: "alquran.cloud",
    direction: "rtl",
    htmlLang: "ar",
    language: "Arabic",
    group: "Arabic",
    rows: 6236,
  },
];


export const AUDIO = {
  reciter: "Saad Al-Ghamadi",
  source: "versebyversequran.com",
  licenseUrl: "http://www.versebyversequran.com/site/licence/",
  bitrate: "~40 kbps",
};

export const SURAH_NUMBERS = Array.from({ length: 114 }, (_, i) => i + 1);
export const pad3 = (n) => String(n).padStart(3, "0");

export function sourcePath(relative) {
  return path.join(SOURCE_ROOT, relative);
}

export function publicPath(relative) {
  return path.join(PUBLIC_DATA_ROOT, relative);
}

export function readJson(file) {
  const raw = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  return JSON.parse(raw);
}

export function readText(file) {
  return fs.readFileSync(file, "utf8");
}

export function sha256(file) {
  return createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

export function sha256Text(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function walkFiles(root, prefix = "") {
  const out = [];
  for (const entry of fs.readdirSync(path.join(root, prefix), { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...walkFiles(root, rel));
    else if (entry.isFile()) out.push(rel);
  }
  return out.sort();
}

export function surahFile(n) {
  return `source/surah/surah_${n}.json`;
}
export function tajweedFile(n) {
  return `source/tajweed/surah_${n}.json`;
}
export function translationFile(n, languageCode = "en") {
  return `source/translation/${languageCode}/${languageCode}_translation_${n}.json`;
}
export function audioIndexFile(n) {
  return `source/audio/${pad3(n)}/index.json`;
}

/** Quranic strings that begin with a stray BOM (a file artifact, not Quranic text). */
export function hasBom(text) {
  return text.startsWith("\uFEFF");
}

/** Returns the verses whose tajweed ranges cannot be applied to the displayed source string. */
export function findTajweedAnomalies() {
  const outOfBounds = [];
  const overlapping = [];
  const bom = [];
  const rules = {};
  let segments = 0;

  for (const n of SURAH_NUMBERS) {
    const arabic = readJson(sourcePath(surahFile(n)));
    const tajweed = readJson(sourcePath(tajweedFile(n)));
    for (const [key, ranges] of Object.entries(tajweed.verse)) {
      const text = arabic.verse[key];
      if (typeof text !== "string") {
        outOfBounds.push({ surah: n, verse: key, reason: "missing-arabic" });
        continue;
      }
      if (hasBom(text)) bom.push({ surah: n, verse: key, reason: "bom" });
      const sorted = [...ranges].sort((a, b) => a.start - b.start);
      const badBounds = sorted.some(
        (r) =>
          !Number.isInteger(r.start) ||
          !Number.isInteger(r.end) ||
          r.start < 0 ||
          r.end > text.length ||
          r.start >= r.end,
      );
      const badOverlap = sorted.some((r, i) => i > 0 && r.start < sorted[i - 1].end);
      segments += ranges.length;
      for (const range of ranges) rules[range.rule] = (rules[range.rule] ?? 0) + 1;
      if (badBounds) outOfBounds.push({ surah: n, verse: key, reason: "out-of-bounds" });
      if (badOverlap) overlapping.push({ surah: n, verse: key, reason: "overlap" });
    }
  }

  return { outOfBounds, overlapping, bom, segments, rules };
}

export function issueKey(issue) {
  return `${issue.surah}:${issue.verse}:${issue.reason}`;
}
