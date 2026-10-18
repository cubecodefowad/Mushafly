import fs from "node:fs";
import path from "node:path";
import attribution from "@/data/generated/attribution.json";
import surahMetaJson from "@/data/generated/surah-meta.json";
import { renderTajweed, type RawTajweedRange } from "@/data/tajweed";
import { TAJWEED_RULES } from "@/data/tajweed-rules";
import type {
  AudioReference,
  SourceInfo,
  SurahMeta,
  SurahView,
  VerseView,
} from "@/types/quran";

const DATA_ROOT = path.join(process.cwd(), "public", "quran");
const KNOWN_RULES = new Set(Object.keys(TAJWEED_RULES));
const AUDIO_BASE = `https://raw.githubusercontent.com/semarketir/quranjson/${attribution.commit}/source/audio`;

export const sourceInfo = attribution as SourceInfo;
export const allSurahMeta = surahMetaJson as SurahMeta[];

const cache = new Map<string, unknown>();

function readData<T>(relativePath: string): T {
  const cached = cache.get(relativePath);
  if (cached !== undefined) return cached as T;
  const file = path.join(DATA_ROOT, relativePath);
  const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as T;
  cache.set(relativePath, parsed);
  return parsed;
}

const pad3 = (n: number) => String(n).padStart(3, "0");

type RawArabicSurah = {
  index: string;
  name: string;
  count: number;
  verse: Record<string, string>;
};

type RawTranslationSurah = {
  index: string;
  count: number;
  verse: Record<string, string>;
};

type RawTajweedSurah = {
  index: string;
  count: number;
  verse: Record<string, RawTajweedRange[]>;
};

type RawAudioIndex = {
  index: string;
  count: number;
  verse: Record<string, { file: string; size: number; unit: string }>;
};

const audioUrl = (surah: number, file: string) =>
  `${AUDIO_BASE}/${pad3(surah)}/${encodeURIComponent(file)}`;

function audioFor(
  surah: number,
  index: RawAudioIndex,
  key: string,
): { audio: AudioReference | null; reason?: string } {
  const entry = index.verse[key];
  if (!entry || typeof entry.file !== "string") {
    return { audio: null, reason: "The source audio index has no file for this verse." };
  }
  return {
    audio: {
      file: entry.file,
      url: audioUrl(surah, entry.file),
      size: entry.size,
      unit: entry.unit,
    },
  };
}

export function getSurahMeta(number: number): SurahMeta | undefined {
  return allSurahMeta.find((meta) => meta.number === number);
}

export function loadSurah(number: number): SurahView {
  if (!Number.isInteger(number) || number < 1 || number > 114) {
    throw new Error(`Invalid surah number: ${String(number)}`);
  }

  const meta = allSurahMeta[number - 1];
  const file = pad3(number);
  const arabic = readData<RawArabicSurah>(`surah/${file}.json`);
  const translation = readData<RawTranslationSurah>(`translation/en/${file}.json`);
  const tajweed = readData<RawTajweedSurah>(`tajweed/${file}.json`);
  const audio = readData<RawAudioIndex>(`audio/${file}/index.json`);

  if (arabic.count !== meta.verseCount) {
    throw new Error(`Verse count mismatch for surah ${number}: source ${arabic.count}, metadata ${meta.verseCount}`);
  }

  const makeVerse = (verseNumber: number): VerseView => {
    const key = `verse_${verseNumber}`;
    const sourceText = arabic.verse[key];
    if (typeof sourceText !== "string") {
      throw new Error(`Missing Arabic verse ${number}:${verseNumber}`);
    }
    if (typeof translation.verse[key] !== "string") {
      throw new Error(`Missing English translation ${number}:${verseNumber}`);
    }

    const rendered = renderTajweed(sourceText, tajweed.verse[key], {
      knownRules: KNOWN_RULES,
    });
    const { audio: audioRef, reason } = audioFor(number, audio, key);

    return {
      number: verseNumber,
      key,
      arabic: sourceText,
      translation: translation.verse[key],
      arabicFile: `source/surah/surah_${number}.json`,
      translationFile: `source/translation/en/en_translation_${number}.json`,
      tajweed: rendered,
      audio: audioRef,
      ...(reason ? { audioUnavailableReason: reason } : {}),
    };
  };

  const verses: VerseView[] = [];
  for (let verse = 1; verse <= meta.verseCount; verse++) verses.push(makeVerse(verse));

  const bismillah = typeof arabic.verse.verse_0 === "string" ? makeVerse(0) : null;

  const rules = new Set<string>();
  let unavailableCount = 0;
  for (const verse of bismillah ? [bismillah, ...verses] : verses) {
    if (verse.tajweed.status === "ok") {
      for (const rule of verse.tajweed.appliedRules) rules.add(rule);
    } else if (verse.tajweed.status === "unavailable") {
      unavailableCount++;
    }
  }

  return {
    meta,
    bismillah,
    verses,
    prev: number > 1 ? allSurahMeta[number - 2] : null,
    next: number < 114 ? allSurahMeta[number] : null,
    tajweedRules: [...rules].sort(),
    unavailableTajweedCount: unavailableCount,
    source: sourceInfo,
  };
}

/** Structural check used by the build and tests. Does not write anything. */
export function auditSurah(number: number) {
  const view = loadSurah(number);
  const entries = view.bismillah ? [view.bismillah, ...view.verses] : view.verses;
  return {
    surah: number,
    verses: view.verses.length,
    entries: entries.length,
    audio: entries.filter((verse) => verse.audio !== null).length,
    tajweedApplied: entries.filter((verse) => verse.tajweed.status === "ok").length,
    tajweedUnavailable: entries.filter((verse) => verse.tajweed.status === "unavailable").length,
    integrity:
      entries.every(
        (verse) =>
          verse.tajweed.segments.map((segment) => segment.text).join("") === verse.arabic,
      ),
  };
}
