export type TranslationLanguage = "en" | "id" | "ar";

export type TranslationInfo = {
  languageCode: TranslationLanguage;
  id: string;
  /** Short, stable name for compact controls. */
  label: string;
  name: string;
  translator: string;
  source: string;
  lastUpdate?: string;
  direction: "ltr" | "rtl";
};

export type SurahMeta = {
  number: number;
  name: string;
  arabicName: string;
  verseCount: number;
  place: string;
  type: string;
  bismillah: boolean;
  sourceFile: string;
};

export type VerseReference = {
  surahNumber: number;
  verseNumber: number;
};

export type AudioReference = {
  file: string;
  url: string;
  size: number;
  unit: string;
};

export type TajweedReason =
  | "out-of-bounds"
  | "overlap"
  | "unknown-rule"
  | "alignment"
  | "missing-annotations";

export type RenderSegment = {
  text: string;
  rule?: string;
};

export type TajweedRender = {
  /** "none" means the source supplied no annotations for this verse. */
  status: "ok" | "none" | "unavailable";
  reason?: TajweedReason;
  segments: RenderSegment[];
  appliedRules: string[];
};

export type VerseView = {
  /** 0 for the unnumbered Bismillah row. */
  number: number;
  key: string;
  arabic: string;
  /** English, rendered into the static page as the default translation. */
  translation: string | null;
  arabicFile: string;
  translationFile: string;
  tajweed: TajweedRender;
  audio: AudioReference | null;
  audioUnavailableReason?: string;
};

export type SurahView = {
  meta: SurahMeta;
  bismillah: VerseView | null;
  verses: VerseView[];
  prev: SurahMeta | null;
  next: SurahMeta | null;
  tajweedRules: string[];
  unavailableTajweedCount: number;
  source: SourceInfo;
};

export type SourceInfo = {
  repository: string;
  commit: string;
  license: string;
  translations: TranslationInfo[];
  audio: {
    reciter: string;
    source: string;
    licenseUrl: string;
    bitrate?: string;
  };
};

export type BookmarkRecord = {
  id: string;
  reference: VerseReference;
  label?: string;
  createdAt: string;
};

export type LastRead = {
  reference: VerseReference;
  updatedAt: string;
};

export type ThemePreference = "system" | "light" | "dark";

export type ReaderSettings = {
  arabicSize: number;
  translationSize: number;
  translation: TranslationLanguage;
  showTranslation: boolean;
  tajweed: boolean;
  autoScroll: boolean;
  theme: ThemePreference;
};
