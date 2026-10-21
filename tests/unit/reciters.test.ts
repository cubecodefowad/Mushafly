import { describe, expect, it } from "vitest";
import {
  DEFAULT_RECITER,
  EVERYAYAH_ORIGIN,
  RECITERS,
  everyayahUrl,
  isReciterId,
  recitationUrl,
  reciterInfo,
} from "@/data/reciters";

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
  const pinned =
    "https://raw.githubusercontent.com/semarketir/quranjson/7ca6f46/source/audio/002/255.mp3";

  it("keeps the pinned per-verse URL for the default reciter", () => {
    expect(DEFAULT_RECITER).toBe("ghamadi");
    expect(recitationUrl("ghamadi", 2, 255, pinned)).toBe(pinned);
  });

  it("builds an everyayah URL for the added reciter", () => {
    expect(recitationUrl("alafasy", 2, 255, pinned)).toBe(
      `${EVERYAYAH_ORIGIN}/data/Alafasy_128kbps/002255.mp3`,
    );
  });

  it("treats a verse the dataset has no file for as unavailable", () => {
    expect(recitationUrl("ghamadi", 1, 8, null)).toBeNull();
    expect(recitationUrl("alafasy", 1, 8, null)).toBeNull();
  });
});

describe("registry", () => {
  it("has unique ids and a source for each reciter", () => {
    const ids = RECITERS.map((reciter) => reciter.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const reciter of RECITERS) {
      expect(reciter.name.length).toBeGreaterThan(0);
      expect(reciter.sourceUrl.startsWith("http")).toBe(true);
    }
    expect(reciterInfo("alafasy").folder).toBe("Alafasy_128kbps");
  });

  it("accepts only known ids", () => {
    expect(isReciterId("alafasy")).toBe(true);
    expect(isReciterId("ghamadi")).toBe(true);
    expect(isReciterId("husary")).toBe(false);
    expect(isReciterId(null)).toBe(false);
    expect(isReciterId(undefined)).toBe(false);
  });
});
