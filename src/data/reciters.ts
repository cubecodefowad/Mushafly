/**
 * Recitation sources.
 *
 * The default reciter streams one MP3 per verse from the pinned quranjson
 * mirror, so every URL carries a commit and cannot change under the reader.
 *
 * Other reciters stream from everyayah.com, which names each file
 * `<surah:3><ayah:3>.mp3` inside a folder per reciter:
 *
 *   /data/Alafasy_128kbps/002255.mp3  → surah 2, ayah 255
 *   /data/Alafasy_128kbps/002000.mp3  → the unnumbered Bismillah of surah 2
 *
 * Ayah `000` is the Bismillah that opens a surah. Al-Fatiha counts it as ayah
 * 1 and At-Tawbah has none, so `001000.mp3` and `009000.mp3` do not exist —
 * exactly like `verse_0` in the pinned dataset. A reciter whose folder is
 * missing files must add a coverage list before it is offered here, because
 * the reader decides availability from the pinned index.
 */
export type ReciterId = "ghamadi" | "alafasy";

export type Reciter = {
  id: ReciterId;
  name: string;
  /** Compact label for the in-reader switch. */
  shortName: string;
  bitrate: string;
  source: string;
  sourceUrl: string;
  /** everyayah folder name; `null` uses the pinned per-verse URLs. */
  folder: string | null;
};

export const EVERYAYAH_ORIGIN = "https://everyayah.com";

export const RECITERS: Reciter[] = [
  {
    id: "ghamadi",
    name: "Saad Al-Ghamadi",
    shortName: "Al-Ghamadi",
    bitrate: "~40 kbps",
    source: "versebyversequran.com",
    sourceUrl: "http://www.versebyversequran.com/site/licence/",
    folder: null,
  },
  {
    id: "alafasy",
    name: "Mishary Rashid Alafasy",
    shortName: "Alafasy",
    bitrate: "128 kbps",
    source: "everyayah.com",
    sourceUrl: `${EVERYAYAH_ORIGIN}/`,
    folder: "Alafasy_128kbps",
  },
];

export const DEFAULT_RECITER: ReciterId = "ghamadi";

const BY_ID = new Map<string, Reciter>(RECITERS.map((reciter) => [reciter.id, reciter]));

export function isReciterId(value: unknown): value is ReciterId {
  return typeof value === "string" && BY_ID.has(value);
}

export function reciterInfo(id: ReciterId): Reciter {
  return BY_ID.get(id) ?? RECITERS[0];
}

const pad3 = (value: number) => String(value).padStart(3, "0");

/** `everyayahUrl("Alafasy_128kbps", 2, 255)` → `.../002255.mp3`. */
export function everyayahUrl(folder: string, surah: number, verse: number): string {
  return `${EVERYAYAH_ORIGIN}/data/${folder}/${pad3(surah)}${pad3(verse)}.mp3`;
}

/**
 * Resolves the MP3 for one verse. `pinnedUrl` is the per-verse URL built from
 * the pinned dataset; it stays authoritative for the default reciter.
 */
export function recitationUrl(
  reciter: ReciterId,
  surah: number,
  verse: number,
  pinnedUrl: string | null,
): string | null {
  if (!pinnedUrl) return null;
  const folder = reciterInfo(reciter).folder;
  return folder ? everyayahUrl(folder, surah, verse) : pinnedUrl;
}
