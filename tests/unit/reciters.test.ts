import { describe, expect, it } from "vitest";
import manifest from "@/data/generated/reciters.json";
import {
  ACTIVE_GROUPS,
  DEFAULT_RECITER,
  EVERYAYAH_ORIGIN,
  EXCLUDED_RECITERS,
  RECITERS,
  everyayahUrl,
  isReciterId,
  recitationUrl,
  reciterInfo,
} from "@/data/reciters";

const PINNED =
  "https://raw.githubusercontent.com/semarketir/quranjson/7ca6f46/source/audio/002/255.mp3";

describe("everyayah filenames", () => {
  it("pads surah and ayah to three digits each", () => {
    expect(everyayahUrl("Alafasy_128kbps", 2, 255)).toBe(
      `${EVERYAYAH_ORIGIN}/data/Alafasy_128kbps/002255.mp3`,
    );
    expect(everyayahUrl("Alafasy_128kbps", 1, 1)).toBe(
      `${EVERYAYAH_ORIGIN}/data/Alafasy_128kbps/001001.mp3`,
    );
    expect(everyayahUrl("Alafasy_128kbps", 114, 6)).toBe(
      `${EVERYAYAH_ORIGIN}/data/Alafasy_128kbps/114006.mp3`,
    );
  });

  it("maps the unnumbered Bismillah to ayah 000", () => {
    expect(everyayahUrl("Alafasy_128kbps", 2, 0)).toBe(
      `${EVERYAYAH_ORIGIN}/data/Alafasy_128kbps/002000.mp3`,
    );
    // Al-Fatiha counts the Bismillah as ayah 1 and At-Tawbah has none, so the
    // 000 file is legitimately absent there; the name is still well formed.
    expect(everyayahUrl("Alafasy_128kbps", 1, 0)).toBe(
      `${EVERYAYAH_ORIGIN}/data/Alafasy_128kbps/001000.mp3`,
    );
    expect(everyayahUrl("Alafasy_128kbps", 9, 0)).toBe(
      `${EVERYAYAH_ORIGIN}/data/Alafasy_128kbps/009000.mp3`,
    );
  });
});

describe("reciter sources", () => {
  it("keeps the pinned per-verse URL for the default reciter", () => {
    expect(DEFAULT_RECITER).toBe("ghamadi");
    expect(recitationUrl("ghamadi", 2, 255, PINNED)).toBe(PINNED);
  });

  it("builds an everyayah URL for an added reciter", () => {
    expect(recitationUrl("alafasy", 2, 255, PINNED)).toBe(
      `${EVERYAYAH_ORIGIN}/data/Alafasy_128kbps/002255.mp3`,
    );
    expect(reciterInfo("alafasy").name).toBe("Mishary Rashid Alafasy");
  });

  it("uses a folder's own Bismillah file when it has one", () => {
    expect(reciterInfo("alafasy").bismillahFiles).toBe(true);
    expect(recitationUrl("alafasy", 2, 0, PINNED)).toBe(
      `${EVERYAYAH_ORIGIN}/data/Alafasy_128kbps/002000.mp3`,
    );
  });

  it("falls back to Al-Fatiha 1:1 for folders without Bismillah files", () => {
    const reciter = RECITERS.find((candidate) => candidate.folder && !candidate.bismillahFiles);
    expect(reciter).toBeDefined();
    expect(recitationUrl(reciter!.id, 2, 0, PINNED)).toBe(
      `${EVERYAYAH_ORIGIN}/data/${reciter!.folder}/001001.mp3`,
    );
    // Numbered ayahs are unaffected by the fallback.
    expect(recitationUrl(reciter!.id, 2, 255, PINNED)).toBe(
      `${EVERYAYAH_ORIGIN}/data/${reciter!.folder}/002255.mp3`,
    );
  });

  it("treats a verse the dataset has no file for as unavailable", () => {
    expect(recitationUrl("ghamadi", 1, 8, null)).toBeNull();
    expect(recitationUrl("alafasy", 1, 8, null)).toBeNull();
  });
});

describe("generated manifest", () => {
  it("offers every folder that covers all 6,236 ayahs", () => {
    expect(RECITERS).toHaveLength(manifest.counts.offered + 1);
    expect(manifest.expected.ayahs).toBe(6236);
    expect(manifest.expected.bismillah).toBe(112);
    expect(manifest.source.audioOrigin).toBe(EVERYAYAH_ORIGIN);
    expect(manifest.source.page).toContain("versebyversequran.com");

    for (const reciter of manifest.reciters) {
      expect(reciter.files, reciter.folder).toBeGreaterThanOrEqual(6236);
      expect(reciter.folder.length).toBeGreaterThan(0);
      expect(reciter.name.length).toBeGreaterThan(0);
    }
    expect(manifest.reciters.every((reciter) => reciter.bitrate !== null)).toBe(true);
  });

  it("records the requested and incomplete exclusions", () => {
    const requested = EXCLUDED_RECITERS.filter((reciter) => reciter.reason === "requested");
    const incomplete = EXCLUDED_RECITERS.filter((reciter) => reciter.reason === "incomplete");

    expect(requested.map((reciter) => reciter.folder).sort()).toEqual([
      "Karim_Mansoori_40kbps",
      "Parhizgar_48kbps",
      "translations/Fooladvand_Hedayatfar_40Kbps",
      "translations/Makarem_Kabiri_16Kbps",
    ]);
    expect(incomplete.length).toBeGreaterThan(0);
    for (const reciter of incomplete) {
      expect(reciter.missingAyahs).toBeGreaterThan(0);
    }

    const offered = new Set(manifest.reciters.map((reciter) => reciter.folder));
    for (const reciter of EXCLUDED_RECITERS) {
      expect(offered.has(reciter.folder), reciter.folder).toBe(false);
    }
  });
});

describe("registry", () => {
  it("has unique ids and a usable source for each reciter", () => {
    const ids = RECITERS.map((reciter) => reciter.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const reciter of RECITERS) {
      expect(reciter.name.length).toBeGreaterThan(0);
      expect(reciter.sourceUrl.startsWith("http")).toBe(true);
      if (reciter.folder === null) expect(reciter.id).toBe(DEFAULT_RECITER);
    }
    expect(reciterInfo("alafasy").folder).toBe("Alafasy_128kbps");
  });

  it("groups every reciter into a non-empty section", () => {
    const kinds = new Set(RECITERS.map((reciter) => reciter.kind));
    for (const group of ACTIVE_GROUPS) {
      expect(kinds.has(group.kind)).toBe(true);
      expect(group.note.length).toBeGreaterThan(0);
    }
    expect(ACTIVE_GROUPS.map((group) => group.kind)).toEqual(["hafs", "warsh", "translation"]);
    expect(RECITERS.filter((reciter) => reciter.kind === "warsh").length).toBe(2);
    expect(RECITERS.filter((reciter) => reciter.kind === "translation").length).toBe(6);
  });

  it("accepts only known ids", () => {
    expect(isReciterId("alafasy")).toBe(true);
    expect(isReciterId("ghamadi")).toBe(true);
    expect(isReciterId("husary-128kbps")).toBe(true);
    expect(isReciterId("husary")).toBe(false);
    expect(isReciterId("karim-mansoori-40kbps")).toBe(false);
    expect(isReciterId(null)).toBe(false);
    expect(isReciterId(undefined)).toBe(false);
  });
});
