"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Highlighter,
  History,
  Languages,
  SlidersHorizontal,
} from "lucide-react";
import { AudioBar } from "@/components/audio/AudioBar";
import { useSurahAudio } from "@/components/audio/useSurahAudio";
import { useReadingState } from "@/components/bookmarks/ReadingStateProvider";
import { SurahHeader } from "@/components/reader/SurahHeader";
import { Verse } from "@/components/reader/Verse";
import { SettingsSheet } from "@/components/settings/SettingsSheet";
import { useSettings } from "@/components/settings/SettingsProvider";
import { TajweedLegend } from "@/components/tajweed/TajweedLegend";
import { ReaderKey } from "@/components/tajweed/ReaderKey";
import { AccuracyNotice } from "@/components/legal/AccuracyNotice";
import { sourceInfo } from "@/data/attribution";
import { TRANSLATIONS, translationInfo, translationUrl } from "@/data/translations";
import type { SurahView, TranslationLanguage, VerseView } from "@/types/quran";

type FetchedTranslation = {
  language: TranslationLanguage;
  verses: Record<string, string>;
};

export function Reader({ surah }: { surah: SurahView }) {
  const { settings, update } = useSettings();
  const { lastRead, saveLastRead } = useReadingState();
  const audio = useSurahAudio(surah);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [translation, setTranslation] = useState<FetchedTranslation | null>(null);
  const [translationStatus, setTranslationStatus] = useState<
    "idle" | "loading" | "error"
  >("idle");
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);
  const lastSavedAt = useRef(0);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2800);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  // English is part of the static page. The other datasets are same-origin
  // files fetched only when the reader selects them, so a surah page does not
  // carry three datasets in its HTML.
  const language = settings.translation;
  useEffect(() => {
    if (language === "en") {
      setTranslation(null);
      setTranslationStatus("idle");
      return;
    }

    const controller = new AbortController();
    setTranslationStatus("loading");
    fetch(translationUrl(language, surah.meta.number), { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Translation returned ${response.status}`);
        }
        return response.json() as Promise<{ verse: Record<string, string> }>;
      })
      .then((payload) => {
        setTranslation({ language, verses: payload.verse });
        setTranslationStatus("idle");
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setTranslation(null);
        setTranslationStatus("error");
      });

    return () => controller.abort();
  }, [language, surah.meta.number]);

  const activeTranslation = translationInfo(language);
  const translationFor = (verse: VerseView): string | null => {
    if (language === "en") return verse.translation;
    // While the selected dataset is in flight (or if it fails), the English
    // text already in the page stays readable; the status line says why.
    if (translation?.language !== language) return verse.translation;
    const text = translation.verses[verse.key];
    return typeof text === "string" && text.length > 0 ? text : null;
  };

  // Persist the last visible numbered verse.
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    let observer: IntersectionObserver | null = null;
    const timer = window.setTimeout(() => {
      observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
          if (!visible) return;
          const number = Number((visible.target as HTMLElement).dataset.verseNumber);
          if (!Number.isInteger(number) || number < 1) return;
          const now = Date.now();
          if (now - lastSavedAt.current < 700) return;
          lastSavedAt.current = now;
          saveLastRead({ surahNumber: surah.meta.number, verseNumber: number });
        },
        { rootMargin: "-28% 0px -58% 0px", threshold: 0 },
      );
      document
        .querySelectorAll<HTMLElement>(".verse[data-verse-number]")
        .forEach((element) => observer?.observe(element));
    }, 450);

    return () => {
      window.clearTimeout(timer);
      observer?.disconnect();
    };
  }, [saveLastRead, surah.meta.number]);

  // Anchor navigation from bookmarks/search, and remember that verse.
  useEffect(() => {
    const match = window.location.hash.match(/^#verse-(\d+)$/);
    if (!match) return;
    const number = Number(match[1]);
    if (!Number.isInteger(number) || number < 1 || number > surah.meta.verseCount) return;
    const element = document.getElementById(`verse-${number}`);
    if (!element) return;
    const frame = window.requestAnimationFrame(() => {
      element.scrollIntoView({ block: "start" });
      saveLastRead({ surahNumber: surah.meta.number, verseNumber: number });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [saveLastRead, surah.meta.number, surah.meta.verseCount]);

  // Follow the recitation when requested.
  useEffect(() => {
    if (!settings.autoScroll || audio.status !== "playing" || !audio.current) return;
    if (audio.current.number === 0) return;
    const element = document.getElementById(`verse-${audio.current.number}`);
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const topMargin = 150;
    const bottomMargin = window.innerHeight - 170;
    if (rect.top < topMargin || rect.bottom > bottomMargin) {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      element.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
    }
  }, [audio.current, audio.status, settings.autoScroll]);

  const togglePlay = useCallback(
    (verse: VerseView) => {
      audio.play(verse);
      if (verse.number > 0) {
        saveLastRead({ surahNumber: surah.meta.number, verseNumber: verse.number });
      }
    },
    [audio, saveLastRead, surah.meta.number],
  );

  const resumeInSurah =
    lastRead && lastRead.reference.surahNumber === surah.meta.number
      ? lastRead.reference.verseNumber
      : null;
  const resumeElsewhere =
    lastRead && lastRead.reference.surahNumber !== surah.meta.number ? lastRead.reference : null;

  return (
    <>
      <div className="reader-toolbar sticky top-16 z-20 border-b border-line bg-paper/90 backdrop-blur-md">
        <div className="reader-column flex h-14 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 text-xs text-muted">
            <span className="truncate">
              <span className="text-ink">{surah.meta.name}</span>
              <span className="hidden sm:inline"> · {surah.meta.verseCount} verses</span>
            </span>
            {audio.current ? (
              <span className="hidden items-center gap-1.5 text-accent sm:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-soft-pulse" aria-hidden />
                {audio.current.number === 0 ? "Bismillah" : `Verse ${audio.current.number}`}
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-0.5 sm:gap-1">
            {resumeInSurah ? (
              <button
                type="button"
                className="icon-button px-2"
                onClick={() => {
                  document
                    .getElementById(`verse-${resumeInSurah}`)
                    ?.scrollIntoView({ block: "start" });
                }}
                title={`Resume at verse ${resumeInSurah}`}
              >
                <History size={16} strokeWidth={1.8} aria-hidden />
                <span className="hidden text-[0.6875rem] lg:inline">Resume</span>
                <span className="sr-only">Resume at verse {resumeInSurah}</span>
              </button>
            ) : resumeElsewhere ? (
              <Link
                href={`/surah/${resumeElsewhere.surahNumber}/#verse-${resumeElsewhere.verseNumber}`}
                className="icon-button px-2"
                title={`Resume at ${resumeElsewhere.surahNumber}:${resumeElsewhere.verseNumber}`}
              >
                <History size={16} strokeWidth={1.8} aria-hidden />
                <span className="sr-only">
                  Resume at surah {resumeElsewhere.surahNumber}, verse{" "}
                  {resumeElsewhere.verseNumber}
                </span>
              </Link>
            ) : null}

            <button
              type="button"
              className="icon-button px-2"
              onClick={() => update({ tajweed: !settings.tajweed })}
              aria-pressed={settings.tajweed}
              aria-label="Tajweed highlighting"
              title="Tajweed highlighting"
            >
              <Highlighter size={16} strokeWidth={1.8} aria-hidden />
              <span className="hidden text-[0.6875rem] lg:inline">Tajweed</span>
            </button>
            <label
              className="icon-button cursor-pointer px-1.5"
              title="Translation language"
            >
              <Languages size={16} strokeWidth={1.8} aria-hidden />
              <select
                aria-label="Translation language"
                value={settings.showTranslation ? settings.translation : "off"}
                onChange={(event) => {
                  const value = event.target.value;
                  if (value === "off") {
                    update({ showTranslation: false });
                  } else {
                    update({
                      translation: value as TranslationLanguage,
                      showTranslation: true,
                    });
                  }
                }}
                className="cursor-pointer appearance-none bg-transparent pr-0 text-[0.6875rem] text-current focus-visible:outline-none"
              >
                <option value="off">Off</option>
                {TRANSLATIONS.map((entry) => (
                  <option key={entry.languageCode} value={entry.languageCode}>
                    {entry.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                strokeWidth={2}
                className="pointer-events-none -ml-1 text-muted"
                aria-hidden
              />
            </label>
            <button
              type="button"
              className="icon-button px-2"
              onClick={() => setSettingsOpen(true)}
              aria-label="Open reading settings"
              title="Reading settings"
            >
              <SlidersHorizontal size={16} strokeWidth={1.8} aria-hidden />
              <span className="hidden text-[0.6875rem] lg:inline">Settings</span>
            </button>
          </div>
        </div>
      </div>

      <SurahHeader surah={surah} />

      <div className="mx-auto w-full max-w-[92rem] lg:grid lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:gap-6 lg:px-6 xl:gap-10">
        <div className="min-w-0">
            <div className="reader-column">
              {settings.tajweed ? (
                <TajweedLegend
                  rules={surah.tajweedRules}
                  unavailableCount={surah.unavailableTajweedCount}
                />
              ) : null}
              {translationStatus === "loading" ? (
                <p role="status" className="mt-4 text-xs text-muted">
                  Loading {activeTranslation.name}…
                </p>
              ) : translationStatus === "error" ? (
                <p role="status" className="mt-4 text-xs text-muted">
                  The {activeTranslation.name} could not be loaded, so the English
                  translation remains on screen. Reading is unaffected.
                </p>
              ) : null}
            </div>

            <div className="reader-column mt-2">
              {surah.bismillah ? (
                <Verse
                  surah={surah}
                  verse={surah.bismillah}
                  settings={settings}
                  active={audio.current?.key === surah.bismillah.key}
                  playing={audio.status === "playing" && audio.current?.key === surah.bismillah.key}
                  onTogglePlay={togglePlay}
                  translation={
                    language === "en" ? undefined : translationFor(surah.bismillah)
                  }
                  translationLanguage={language}
                />
              ) : null}

              {surah.verses.map((verse) => (
                <Verse
                  key={verse.key}
                  surah={surah}
                  verse={verse}
                  settings={settings}
                  active={audio.current?.key === verse.key}
                  playing={audio.status === "playing" && audio.current?.key === verse.key}
                  onTogglePlay={togglePlay}
                  translation={language === "en" ? undefined : translationFor(verse)}
                  translationLanguage={language}
                  onBookmarkToggled={(added) =>
                    showToast(
                      added
                        ? `Bookmarked ${surah.meta.number}:${verse.number}`
                        : `Removed bookmark ${surah.meta.number}:${verse.number}`,
                    )
                  }
                />
              ))}
            </div>

            <nav
              aria-label="Adjacent surahs"
              className="reader-column mt-12 grid gap-3 border-t border-line pt-8 sm:grid-cols-2"
            >
              {surah.prev ? (
                <Link
                  href={`/surah/${surah.prev.number}/`}
                  className="group rounded-lg border border-line bg-surface p-4 transition-colors hover:border-accent/40"
                >
                  <span className="flex items-center gap-1.5 text-[0.6875rem] text-muted">
                    <ArrowLeft size={13} strokeWidth={1.8} aria-hidden />
                    Previous surah
                  </span>
                  <span className="mt-1.5 flex items-baseline justify-between gap-3">
                    <span className="text-sm font-medium text-ink group-hover:text-accent-strong">
                      {surah.prev.name}
                    </span>
                    <span lang="ar" dir="rtl" className="font-arabic text-xl text-muted">
                      {surah.prev.arabicName}
                    </span>
                  </span>
                </Link>
              ) : (
                <span />
              )}
              {surah.next ? (
                <Link
                  href={`/surah/${surah.next.number}/`}
                  className="group rounded-lg border border-line bg-surface p-4 text-right transition-colors hover:border-accent/40"
                >
                  <span className="flex items-center justify-end gap-1.5 text-[0.6875rem] text-muted">
                    Next surah
                    <ArrowRight size={13} strokeWidth={1.8} aria-hidden />
                  </span>
                  <span className="mt-1.5 flex items-baseline justify-between gap-3">
                    <span lang="ar" dir="rtl" className="font-arabic text-xl text-muted">
                      {surah.next.arabicName}
                    </span>
                    <span className="text-sm font-medium text-ink group-hover:text-accent-strong">
                      {surah.next.name}
                    </span>
                  </span>
                </Link>
              ) : null}
            </nav>

            <div className="reader-column mt-10 border-t border-line pt-5 text-[0.6875rem] leading-relaxed text-muted">
              <p>
                Arabic, Tajweed and audio from{" "}
                <a
                  href={`${sourceInfo.repository}/tree/${sourceInfo.commit}`}
                  className="underline decoration-line underline-offset-2 hover:text-ink"
                  target="_blank"
                  rel="noreferrer"
                >
                  quranjson
                </a>{" "}
                at revision {sourceInfo.commit.slice(0, 7)}. Translations and
                commentary:{" "}
                {sourceInfo.translations
                  .map(
                    (entry) =>
                      `${entry.languageCode === "ar" ? "Arabic commentary" : entry.label}: ${entry.translator} (${entry.source})`,
                  )
                  .join("; ")}
                . Recitation: {sourceInfo.audio.reciter}.
              </p>
              <p className="mt-2">
                Verse text is rendered from the pinned source records. Search and
                highlighting never modify the displayed Quranic string.
              </p>
              <AccuracyNotice compact className="mt-4 border-t border-line pt-4" />
            </div>
        </div>

        <aside
          aria-label="Tajweed and mark key"
          className="hidden lg:block"
        >
          {/* The panel stops above the recitation bar when it is showing. */}
          <div
            className={`sticky top-[7.5rem] overflow-y-auto overscroll-contain pb-6 pr-1 ${
              audio.current ? "max-h-[calc(100dvh-16rem)]" : "max-h-[calc(100dvh-9rem)]"
            }`}
          >
            <ReaderKey />
          </div>
        </aside>
      </div>

      <div className={audio.current ? "h-28" : "h-6"} aria-hidden="true" />

      <AudioBar audio={audio} surah={surah} />
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className={`fixed left-1/2 z-50 -translate-x-1/2 rounded-full border border-line bg-surface px-4 py-2 text-xs text-ink shadow-lg ${
            audio.current ? "bottom-28" : "bottom-8"
          }`}
        >
          {toast}
        </div>
      ) : null}
    </>
  );
}
