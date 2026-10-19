"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { Link2, Pause, Play } from "lucide-react";
import { BookmarkButton } from "@/components/bookmarks/BookmarkButton";
import { translationInfo } from "@/data/translations";
import type {
  ReaderSettings,
  SurahView,
  TranslationLanguage,
  VerseView,
} from "@/types/quran";

type Props = {
  surah: SurahView;
  verse: VerseView;
  settings: ReaderSettings;
  active: boolean;
  playing: boolean;
  onTogglePlay: (verse: VerseView) => void;
  onBookmarkToggled?: (added: boolean) => void;
  /** Text in the selected language; English comes from the static page. */
  translation?: string | null;
  translationLanguage?: TranslationLanguage;
};

function TajweedText({
  verse,
  enabled,
  bismillah = false,
}: {
  verse: VerseView;
  enabled: boolean;
  bismillah?: boolean;
}) {
  const showTajweed = enabled && verse.tajweed.status === "ok";
  const segments = showTajweed ? verse.tajweed.segments : [{ text: verse.arabic }];

  return (
    <p lang="ar" dir="rtl" className={`quran-text${bismillah ? " bismillah" : ""}`}>
      {segments.map((segment, index) =>
        segment.rule ? (
          <span
            key={index}
            className="tajweed-mark"
            data-rule={segment.rule}
            style={{ "--rule-color": `var(--tw-${segment.rule})` } as CSSProperties}
          >
            {segment.text}
          </span>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </p>
  );
}

export function Verse({
  surah,
  verse,
  settings,
  active,
  playing,
  onTogglePlay,
  onBookmarkToggled,
  translation = verse.translation,
  translationLanguage = "en",
}: Props) {
  const isBismillah = verse.number === 0;
  const info = translationInfo(translationLanguage);
  const rtl = info.direction === "rtl";
  const label = isBismillah
    ? "Bismillah"
    : `Surah ${surah.meta.name}, verse ${verse.number}`;
  const id = isBismillah ? "bismillah" : `verse-${verse.number}`;

  return (
    <article
      id={id}
      className={isBismillah ? "verse text-center" : "verse"}
      data-verse-number={verse.number}
      data-active={active ? "true" : undefined}
      aria-labelledby={`${id}-label`}
    >
      <p id={`${id}-label`} className="sr-only">
        {label}
      </p>

      <div
        className={`mb-1 flex items-center gap-2 ${
          isBismillah ? "justify-center" : "justify-between"
        }`}
      >
        {isBismillah ? (
          <span className="meta">Bismillah</span>
        ) : (
          <span className="flex items-center gap-2.5">
            <span className="verse-number" aria-hidden="true">
              {verse.number}
            </span>
            {active ? (
              <span className="text-[0.625rem] uppercase tracking-[0.14em] text-accent">
                {playing ? "Playing" : "Selected"}
              </span>
            ) : null}
          </span>
        )}

        <div className="verse-actions flex items-center gap-0.5">
          <button
            type="button"
            className="icon-button"
            onClick={() => onTogglePlay(verse)}
            aria-label={
              active && playing
                ? `Pause verse ${verse.number === 0 ? "Bismillah" : verse.number}`
                : `Play verse ${verse.number === 0 ? "Bismillah" : verse.number}`
            }
            aria-pressed={active && playing}
            title={verse.audio ? "Play recitation" : (verse.audioUnavailableReason ?? "Audio unavailable")}
            disabled={!verse.audio}
          >
            {active && playing ? (
              <Pause size={16} strokeWidth={1.8} aria-hidden />
            ) : (
              <Play size={16} strokeWidth={1.8} aria-hidden />
            )}
          </button>

          {!isBismillah ? (
            <>
              <BookmarkButton
                reference={{ surahNumber: surah.meta.number, verseNumber: verse.number }}
                onToggled={onBookmarkToggled}
              />
              <Link
                href={`#${id}`}
                className="icon-button"
                aria-label={`Link to verse ${verse.number}`}
                title="Link to this verse"
              >
                <Link2 size={16} strokeWidth={1.8} aria-hidden />
              </Link>
            </>
          ) : null}
        </div>
      </div>

      <TajweedText verse={verse} enabled={settings.tajweed} bismillah={isBismillah} />

      {settings.tajweed && verse.tajweed.status === "unavailable" ? (
        <p className="mt-2 text-[0.6875rem] leading-relaxed text-muted">
          Tajweed highlighting is unavailable for this verse: the source
          annotations do not align with the displayed text.
        </p>
      ) : null}

      {settings.showTranslation ? (
        translation ? (
          <p
            lang={translationLanguage}
            dir={info.direction}
            className={`translation-text mt-3 ${rtl ? "translation-arabic" : ""} ${
              isBismillah ? "text-center" : ""
            }`}
          >
            {translation}
          </p>
        ) : isBismillah ? null : (
          <p className="mt-3 text-xs text-muted">
            Translation unavailable in the selected dataset.
          </p>
        )
      ) : null}
    </article>
  );
}
