import { describe, expect, it } from "vitest";
import { excerptFor, normalize, normalizeWithMap } from "@/lib/normalize";

describe("search normalization", () => {
  it("removes Arabic vowel marks and folds common letter variants", () => {
    expect(normalize("ٱلرَّحْمَٰنِ ٱلرَّحِيمِ")).toBe("الرحمن الرحيم");
    expect(normalize("آمَنُوا۟")).toBe("امنوا");
    expect(normalize("مُوسَىٰ")).toBe("موسي");
    expect(normalize("صَلَوٰةَ")).toBe("صلوه");
  });

  it("folds English case, diacritics, and punctuation", () => {
    expect(normalize("The Most Gracious, the Most Merciful.")).toBe(
      "the most gracious the most merciful",
    );
    expect(normalize("Café — naïve")).toBe("cafe naive");
  });

  it("maps every normalized character back to the source string", () => {
    const source = "ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
    const { text, map } = normalizeWithMap(source);
    expect(map).toHaveLength(text.length);
    for (const index of map) {
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(source.length);
    }
  });

  it("builds excerpts from the original, not from the normalized copy", () => {
    const source =
      "وَٱصْبِرْ وَمَا صَبْرُكَ إِلَّا بِٱللَّهِ ۚ وَلَا تَحْزَنْ عَلَيْهِمْ وَلَا تَكُ فِى ضَيْقٍۢ مِّمَّا يَمْكُرُونَ";
    const excerpt = excerptFor(source, "الرحمن", 40);
    expect(excerpt).toBe(source.slice(0, 40).trimEnd() + "…");

    const centered = excerptFor(source, normalize("صبرك"), 60);
    expect(centered).toContain("صَبْرُكَ");
    expect(centered).not.toContain("صبرك");
  });

  it("does not modify the source string", () => {
    const source = "بِسْمِ ٱللَّهِ";
    normalize(source);
    expect(source).toBe("بِسْمِ ٱللَّهِ");
  });
});
