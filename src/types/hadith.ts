/** A language the datasets publish a hadith translation in. */
export type HadithLanguageCode =
  | "en"
  | "bn"
  | "fr"
  | "id"
  | "ru"
  | "ta"
  | "tr"
  | "ur";

/** One translation, with the labels the picker shows and its coverage. */
export type HadithLanguage = {
  code: HadithLanguageCode;
  name: string;
  native: string;
  direction: "ltr" | "rtl";
  /** How many narrations in this collection carry text in this language. */
  hadiths: number;
};

/** One grading row as published by the hadith-api editions. */
export type HadithGrade = {
  /** The scholar who graded the narration, for example "Al-Albani". */
  scholar: string;
  /** The grade itself, for example "Sahih" or "Daif". */
  grade: string;
};

/** A single narration inside a book file. */
export type HadithRecord = {
  /**
   * The collection's own numbering, used for anchors and citations. The
   * datasets number inserted narrations with a fraction (Bukhari 402.2), so
   * this is a number rather than an integer.
   */
  number: number;
  arabicNumber: number;
  /** Position inside the book, when the source provides one. */
  inBook: number | null;
  arabic: string | null;
  english: string | null;
  /** The published text itself contains a replacement character. */
  damaged?: boolean;
  grades?: HadithGrade[];
};

/**
 * The shape of one `public/hadith/{collection}/{language}/{section}.json`
 * file: the translation of a single book, fetched only when a reader asks for
 * that language.
 */
export type HadithTranslationPayload = {
  collection: string;
  section: number;
  language: HadithLanguageCode;
  direction: "ltr" | "rtl";
  hadiths: Array<{ number: number; text: string }>;
};

/** The shape of one `public/hadith/{collection}/{section}.json` file. */
export type HadithSectionPayload = {
  collection: string;
  section: number;
  name: string;
  hadiths: HadithRecord[];
};

/** Where the reader last stopped, kept on this device only. */
export type HadithProgress = {
  collection: string;
  /** Copied in at save time so the landing page needs no catalogue. */
  collectionName?: string;
  section: number;
  sectionName?: string;
  number: number;
  updatedAt: string;
};
