import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { TANZIL_EXCLUDED, TANZIL_TRANSLATIONS } from "@/data/translations";
import surahMetaJson from "@/data/generated/surah-meta.json";

const TRANSLATION_ROOT = path.join(process.cwd(), "public", "quran", "translation");
const pad3 = (n: number) => String(n).padStart(3, "0");

type TranslationFile = {
  name: string;
  index: string;
  verse: Record<string, string>;
  count: number;
};

const surahMeta = surahMetaJson as Array<{ number: number; verseCount: number }>;

function readTranslation(id: string, surah: number): TranslationFile {
  return JSON.parse(
    fs.readFileSync(path.join(TRANSLATION_ROOT, id, `${pad3(surah)}.json`), "utf8"),
  ) as TranslationFile;
}

describe("Tanzil translation datasets", () => {
  it("registers every integrated dataset and keeps exclusions explicit", () => {
    expect(TANZIL_TRANSLATIONS).toHaveLength(65);
    expect(TANZIL_EXCLUDED.map((entry) => entry.id).sort()).toEqual([
      "ku.asan",
      "sq.mehdiu",
    ]);
    for (const excluded of TANZIL_EXCLUDED) {
      expect(fs.existsSync(path.join(TRANSLATION_ROOT, excluded.id))).toBe(false);
      expect(excluded.emptyVerses.length).toBeGreaterThan(0);
    }
  });

  it("stores 114 surah files and 6,236 non-empty verses for every dataset", () => {
    for (const translation of TANZIL_TRANSLATIONS) {
      const dir = path.join(TRANSLATION_ROOT, translation.languageCode);
      expect(fs.existsSync(dir), translation.id).toBe(true);
      const files = fs.readdirSync(dir).filter((file) => file.endsWith(".json"));
      expect(files, translation.id).toHaveLength(114);

      let rows = 0;
      for (const meta of surahMeta) {
        const data = readTranslation(translation.languageCode, meta.number);
        expect(data.index, `${translation.id} ${meta.number}`).toBe(pad3(meta.number));
        expect(data.count, `${translation.id} ${meta.number}`).toBe(meta.verseCount);

        const keys = Object.keys(data.verse);
        expect(keys, `${translation.id} ${meta.number}`).toHaveLength(meta.verseCount);
        for (let verse = 1; verse <= meta.verseCount; verse++) {
          const text = data.verse[`verse_${verse}`];
          expect(typeof text, `${translation.id} ${meta.number}:${verse}`).toBe("string");
          expect(text.length, `${translation.id} ${meta.number}:${verse}`).toBeGreaterThan(0);
          expect(text.includes("\uFFFD"), `${translation.id} ${meta.number}:${verse}`).toBe(
            false,
          );
          rows++;
        }
      }
      expect(rows, translation.id).toBe(6236);
    }
  });

  it("preserves sample Urdu and other source text exactly", () => {
    expect(readTranslation("ur.junagarhi", 1).verse.verse_1).toBe(
      "شروع کرتا ہوں اللہ تعالیٰ کے نام سے جو بڑا مہربان نہایت رحم واﻻ ہے",
    );
    expect(readTranslation("ur.junagarhi", 2).verse.verse_255).toBe(
      "اللہ تعالیٰ ہی معبود برحق ہے جس کے سوا کوئی معبود نہیں جو زنده اور سب کا تھامنے واﻻ ہے، جسے نہ اونگھ آئے نہ نیند، اس کی ملکیت میں زمین اور آسمانوں کی تمام چیزیں ہیں۔ کون ہے جو اس کی اجازت کے بغیر اس کے سامنے شفاعت کرسکے، وه جانتا ہے جو ان کے سامنے ہے اور جو ان کے پیچھے ہے اور وه اس کے علم میں سے کسی چیز کا احاطہ نہیں کرسکتے مگر جتنا وه چاہے، اس کی کرسی کی وسعت نے زمین و آسمان کو گھیر رکھا ہے اور اللہ تعالیٰ ان کی حفاﻇت سے نہ تھکتا اور نہ اکتاتا ہے، وه تو بہت بلند اور بہت بڑا ہے",
    );
    expect(readTranslation("ur.junagarhi", 114).verse.verse_6).toBe(
      "(خواه) وه جن میں سے ہو یا انسان میں سے",
    );
    expect(readTranslation("ur.maududi", 1).verse.verse_1).toBe(
      "اللہ کے نام سے جو رحمان و رحیم ہے",
    );
    expect(readTranslation("en.sahih", 1).verse.verse_1).toBe(
      "In the name of Allah, the Entirely Merciful, the Especially Merciful.",
    );
    expect(readTranslation("ar.jalalayn", 1).verse.verse_1).toBe(
      "«بسم الله الرحمن الرحيم»",
    );
  });

  it("marks right-to-left datasets and leaves text direction to the reader", () => {
    const rtl = new Set(["ar", "fa", "ku", "ps", "sd", "ug", "ur"]);
    for (const translation of TANZIL_TRANSLATIONS) {
      const expected = rtl.has(translation.id.split(".")[0]) ? "rtl" : "ltr";
      expect(translation.direction, translation.id).toBe(expected);
      expect(translation.htmlLang, translation.id).toBe(
        translation.id.split(".")[0] === "ku" ? "ckb" : translation.id.split(".")[0],
      );
    }
  });
});
