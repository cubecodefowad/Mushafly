"use client";

import { Link2 } from "lucide-react";
import { GradeChips } from "@/components/hadithly/GradeChips";
import type { HadithLanguage, HadithRecord } from "@/types/hadith";

type Props = {
  hadith: HadithRecord;
  collectionName: string;
  sectionName: string;
  showTranslation: boolean;
  /** The translation the reader picked, with its label and direction. */
  language: HadithLanguage;
  /** This hadith in that language, or null when the edition has no text. */
  translationText: string | null;
  /** The book's translation file is still being fetched. */
  translationPending: boolean;
  onCopyLink: (number: number) => void;
};

/** Direction and typeface for a translation, reusing the Quran reader's rules. */
function translationClass(language: HadithLanguage): string {
  if (language.direction !== "rtl") return "translation-text mt-3";
  if (language.code === "ur") return "translation-text translation-urdu mt-3";
  return "translation-text translation-rtl mt-3";
}

export function HadithArticle({
  hadith,
  collectionName,
  sectionName,
  showTranslation,
  language,
  translationText,
  translationPending,
  onCopyLink,
}: Props) {
  const label = `${collectionName}, ${sectionName}, hadith ${hadith.number}`;
  const differs = hadith.arabicNumber !== hadith.number;

  return (
    <article
      id={`hadith-${hadith.number}`}
      className="hadith-article"
      data-hadith-number={hadith.number}
      aria-labelledby={`hadith-${hadith.number}-label`}
    >
      <h3 id={`hadith-${hadith.number}-label`} className="sr-only">
        {label}
      </h3>

      <div className="mb-2 flex items-start justify-between gap-3">
        <span
          className="verse-number"
          title={differs ? `Hadith ${hadith.number} · Arabic numbering ${hadith.arabicNumber}` : undefined}
        >
          {hadith.number}
        </span>

        <div className="hadith-actions flex items-center gap-0.5">
          <button
            type="button"
            className="icon-button"
            onClick={() => onCopyLink(hadith.number)}
            aria-label={`Copy link to hadith ${hadith.number}`}
            title="Copy link to this hadith"
          >
            <Link2 size={15} strokeWidth={1.8} aria-hidden />
          </button>
        </div>
      </div>

      {hadith.arabic ? (
        <p lang="ar" dir="rtl" className="hadith-arabic">
          {hadith.arabic}
        </p>
      ) : (
        <p className="text-xs text-muted">The Arabic text is missing from this edition.</p>
      )}

      {showTranslation ? (
        translationPending ? (
          <div className="mt-4 space-y-2" aria-hidden="true">
            <div className="skeleton h-3 w-4/5" />
            <div className="skeleton h-3 w-3/5" />
          </div>
        ) : translationText ? (
          <p lang={language.code} dir={language.direction} className={translationClass(language)}>
            {translationText}
          </p>
        ) : (
          <p className="mt-3 text-xs text-muted">
            No {language.name} translation was published for this hadith.
          </p>
        )
      ) : null}

      {hadith.damaged ? (
        <p className="mt-3 text-[0.6875rem] leading-relaxed text-muted">
          The published text for this narration contains a damaged character. It is shown as
          published rather than silently repaired.
        </p>
      ) : null}

      {hadith.grades?.length ? <GradeChips grades={hadith.grades} /> : null}
    </article>
  );
}
