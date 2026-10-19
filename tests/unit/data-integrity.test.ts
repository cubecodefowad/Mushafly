import { describe, expect, it } from "vitest";
import { allSurahMeta, loadSurah, sourceInfo } from "@/data/quran-source";

describe("Quran data adapter", () => {
  it("covers all 114 surahs and 6,236 numbered verses", () => {
    expect(allSurahMeta).toHaveLength(114);
    let verses = 0;
    let translations = 0;
    let audio = 0;
    let bismillah = 0;

    for (const meta of allSurahMeta) {
      const surah = loadSurah(meta.number);
      expect(surah.verses).toHaveLength(meta.verseCount);
      expect(surah.meta.name).toBe(meta.name);
      if (surah.bismillah) {
        bismillah++;
        expect(surah.bismillah.number).toBe(0);
      }
      for (const verse of surah.verses) {
        verses++;
        expect(verse.arabic.length).toBeGreaterThan(0);
        expect(verse.arabicFile).toBe(`source/surah/surah_${meta.number}.json`);
        expect(verse.translation).not.toBeNull();
        if (verse.translation) translations++;
        expect(verse.audio).not.toBeNull();
        if (verse.audio) {
          audio++;
          expect(verse.audio.url).toContain(sourceInfo.commit);
          expect(verse.audio.url).toContain(`/source/audio/${String(meta.number).padStart(3, "0")}/`);
        }
      }
    }

    expect(verses).toBe(6236);
    expect(translations).toBe(6236);
    expect(audio).toBe(6236);
    expect(bismillah).toBe(112);
  });

  it("honours the source's Bismillah convention", () => {
    expect(loadSurah(1).bismillah).toBeNull();
    expect(loadSurah(9).bismillah).toBeNull();
    const two = loadSurah(2);
    expect(two.bismillah).not.toBeNull();
    expect(two.bismillah?.translation).toBe(
      "In the name of God, the Gracious, the Merciful.",
    );
    expect(loadSurah(114).bismillah).not.toBeNull();
  });

  it("maps audio files one-to-one with verse numbers", () => {
    const surah = loadSurah(2);
    expect(surah.verses[0].audio?.file).toBe("001.mp3");
    expect(surah.verses[254].audio?.file).toBe("255.mp3");
    expect(surah.bismillah?.audio?.file).toBe("000.mp3");
  });

  it("keeps source and translation attribution explicit", () => {
    expect(sourceInfo.repository).toBe("https://github.com/semarketir/quranjson");
    expect(sourceInfo.commit).toHaveLength(40);
    expect(sourceInfo.translations.map((entry) => entry.id)).toEqual([
      "en.itani",
      "id.indonesian",
      "ar.muyassar",
    ]);
    const english = sourceInfo.translations.find((entry) => entry.languageCode === "en");
    expect(english?.translator).toBe("Talal Itani");
    expect(english?.source).toBe("Tanzil.net");
    expect(sourceInfo.audio.reciter).toBe("Saad Al-Ghamadi");
  });
});
