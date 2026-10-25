import generated from "@/data/generated/hadith-index.json";
import {
  DEFAULT_HADITH_LANGUAGE,
  HADITH_LANGUAGE_CODES,
  formatCount,
  gradeTone,
  hadithDataUrl,
  hadithRangeLabel,
  hadithSectionUrl,
  hadithTranslationUrl,
  isHadithLanguage,
} from "@/data/hadith-format";
import type { HadithLanguage } from "@/types/hadith";

// Re-exported so server pages and tests have a single catalogue import. Client
// components import the helpers from `@/data/hadith-format` directly, which
// keeps the index out of their bundles.
export {
  DEFAULT_HADITH_LANGUAGE,
  formatCount,
  gradeTone,
  hadithDataUrl,
  hadithRangeLabel,
  hadithSectionUrl,
  hadithTranslationUrl,
  isHadithLanguage,
};

/**
 * Hadithly stands on the hadith-api datasets, which publish ten collections in
 * Arabic and up to seven further translations. Only the parts that cannot be
 * derived from the data live here: how each collection should be introduced in
 * the interface, which library it belongs to, and where its files are.
 */

export type HadithCollectionId =
  | "bukhari"
  | "muslim"
  | "abudawud"
  | "tirmidhi"
  | "nasai"
  | "ibnmajah"
  | "malik"
  | "nawawi"
  | "qudsi"
  | "dehlawi";

export type HadithSectionMeta = {
  number: number;
  name: string;
  count: number;
  first: number | null;
  last: number | null;
};

export type HadithCollection = {
  id: HadithCollectionId;
  name: string;
  arabicName: string;
  author: string;
  /** The compiler's death year, in the two calendars readers cite. */
  died: string | null;
  group: "six" | "more";
  blurb: string;
  hadiths: number;
  /** The translations published for this collection, English first. */
  languages: HadithLanguage[];
  sections: HadithSectionMeta[];
  /** Direct entry point: a single-book collection opens on that book. */
  href: string;
};

type Curated = Omit<HadithCollection, "hadiths" | "languages" | "sections" | "href">;

const CURATED: Curated[] = [
  {
    id: "bukhari",
    name: "Sahih al-Bukhari",
    arabicName: "صحيح البخاري",
    author: "Muhammad ibn Isma'il al-Bukhari",
    died: "256 AH · 870 CE",
    group: "six",
    blurb:
      "The most rigorously authenticated collection, in 97 books from the first revelation to the oneness of God.",
  },
  {
    id: "muslim",
    name: "Sahih Muslim",
    arabicName: "صحيح مسلم",
    author: "Muslim ibn al-Hajjaj",
    died: "261 AH · 875 CE",
    group: "six",
    blurb:
      "The second of the two Sahihs, gathered with unusual care for the chains of transmission.",
  },
  {
    id: "abudawud",
    name: "Sunan Abu Dawud",
    arabicName: "سنن أبي داود",
    author: "Abu Dawud al-Sijistani",
    died: "275 AH · 889 CE",
    group: "six",
    blurb:
      "Narrations chosen for jurisprudence: purification, prayer, trade, marriage and conduct.",
  },
  {
    id: "tirmidhi",
    name: "Jami' al-Tirmidhi",
    arabicName: "جامع الترمذي",
    author: "Abu 'Isa al-Tirmidhi",
    died: "279 AH · 892 CE",
    group: "six",
    blurb:
      "A comprehensive collection whose later gradings accompany almost every narration here.",
  },
  {
    id: "nasai",
    name: "Sunan al-Nasa'i",
    arabicName: "سنن النسائي",
    author: "Ahmad ibn Shu'ayb al-Nasa'i",
    died: "303 AH · 915 CE",
    group: "six",
    blurb: "A Sunan noted for precision in transmission and a critical eye on narrators.",
  },
  {
    id: "ibnmajah",
    name: "Sunan Ibn Majah",
    arabicName: "سنن ابن ماجه",
    author: "Ibn Majah al-Qazwini",
    died: "273 AH · 887 CE",
    group: "six",
    blurb:
      "The sixth of the Six Books, strongest in additional narrations on law and etiquette.",
  },
  {
    id: "malik",
    name: "Al-Muwatta",
    arabicName: "الموطأ",
    author: "Malik ibn Anas",
    died: "179 AH · 795 CE",
    group: "more",
    blurb:
      "One of the earliest arranged collections, joining hadith with the practice of Madinah.",
  },
  {
    id: "nawawi",
    name: "Forty Hadith of al-Nawawi",
    arabicName: "الأربعون النووية",
    author: "Yahya ibn Sharaf al-Nawawi",
    died: "676 AH · 1277 CE",
    group: "more",
    blurb: "Forty-two narrations al-Nawawi chose as the pillars of the religion.",
  },
  {
    id: "qudsi",
    name: "Forty Hadith Qudsi",
    arabicName: "الأربعون القدسية",
    author: "An anonymous compilation",
    died: null,
    group: "more",
    blurb:
      "Sayings the Prophet ﷺ reported from his Lord: distinct from the Quran, and not part of it.",
  },
  {
    id: "dehlawi",
    name: "Forty Hadith of Shah Waliullah Dehlawi",
    arabicName: "الأربعون الدهلوية",
    author: "Shah Waliullah al-Dehlawi",
    died: "1176 AH · 1762 CE",
    group: "more",
    blurb:
      "Forty narrations the eighteenth-century reformer chose as a summary of the prophetic way.",
  },
];

type GeneratedCollection = {
  id: string;
  hadiths: number;
  sectionCount: number;
  damaged: number;
  languages: HadithLanguage[];
  sections: HadithSectionMeta[];
};

const GENERATED = generated as {
  source: {
    name: string;
    repository: string;
    revision: string;
    license: string;
    english: string;
    arabic: string;
    translations: string;
  };
  /** Every translation with its coverage across the whole library. */
  languages: Array<HadithLanguage & { collections: number }>;
  totals: {
    collections: number;
    sections: number;
    hadiths: number;
    damaged: number;
    languages: number;
  };
  collections: GeneratedCollection[];
};

export const HADITHLY_SOURCE = GENERATED.source;
export const HADITHLY_TOTALS = GENERATED.totals;
export const HADITHLY_LANGUAGES = GENERATED.languages;

const DATA = new Map(GENERATED.collections.map((collection) => [collection.id, collection]));

const MISSING = CURATED.filter((collection) => !DATA.has(collection.id)).map(
  (collection) => collection.id,
);
if (MISSING.length) {
  throw new Error(
    `Hadithly has no local data for ${MISSING.join(", ")}. Run \`npm run data:hadith\`.`,
  );
}

export const HADITH_COLLECTIONS: HadithCollection[] = CURATED.map((collection) => {
  const data = DATA.get(collection.id)!;
  return {
    ...collection,
    hadiths: data.hadiths,
    // Ordered for the picker rather than alphabetically: English, then the
    // languages most readers of this app look for.
    languages: [...data.languages].sort(
      (a, b) => HADITH_LANGUAGE_CODES.indexOf(a.code) - HADITH_LANGUAGE_CODES.indexOf(b.code),
    ),
    sections: data.sections,
    href:
      data.sections.length === 1
        ? `/hadithly/${collection.id}/${data.sections[0].number}/`
        : `/hadithly/${collection.id}/`,
  };
});

const COLLECTIONS_BY_ID = new Map(HADITH_COLLECTIONS.map((collection) => [collection.id, collection]));

export const HADITHLY_GROUPS = [
  {
    id: "six" as const,
    title: "The Six Books",
    description:
      "The canonical Sunni collections, in the order readers usually meet them.",
  },
  {
    id: "more" as const,
    title: "Also in the library",
    description: "The Muwatta and three short collections of forty narrations.",
  },
];

export function hadithCollection(id: string): HadithCollection | undefined {
  return COLLECTIONS_BY_ID.get(id as HadithCollectionId);
}

export function hadithSection(
  collection: HadithCollection,
  number: number | string,
): HadithSectionMeta | undefined {
  return collection.sections.find((section) => section.number === Number(number));
}

export function adjacentSections(
  collection: HadithCollection,
  number: number,
): { prev: HadithSectionMeta | null; next: HadithSectionMeta | null } {
  const index = collection.sections.findIndex((section) => section.number === number);
  if (index < 0) return { prev: null, next: null };
  return {
    prev: index > 0 ? collection.sections[index - 1] : null,
    next: index + 1 < collection.sections.length ? collection.sections[index + 1] : null,
  };
}

