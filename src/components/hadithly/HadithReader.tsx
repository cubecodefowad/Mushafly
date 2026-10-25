"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Languages } from "lucide-react";
import { HadithArticle } from "@/components/hadithly/HadithArticle";
import { useSettings } from "@/components/settings/SettingsProvider";
import {
  DEFAULT_HADITH_LANGUAGE,
  formatCount,
  hadithDataUrl,
  hadithTranslationUrl,
} from "@/data/hadith-format";
import { HADITHLY_STORAGE_KEYS, writeStorage } from "@/lib/storage";
import type {
  HadithLanguage,
  HadithLanguageCode,
  HadithSectionPayload,
  HadithTranslationPayload,
} from "@/types/hadith";

/** A book can hold 700+ narrations, so the page paints them in windows. */
const WINDOW = 25;

type Props = {
  collection: string;
  collectionName: string;
  section: number;
  sectionName: string;
  total: number;
  /** The translations published for this collection, English first. */
  languages: HadithLanguage[];
};

type State =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; payload: HadithSectionPayload };

/**
 * English is stored beside the Arabic in the book file, so it needs no second
 * request. Every other language is its own file per book, fetched on demand.
 */
type TranslationState =
  | { status: "inline" }
  | { status: "loading" }
  | { status: "ready"; texts: Map<number, string> }
  | { status: "missing" }
  | { status: "error" };

/** Used only if a book somehow arrives without a language list. */
const ENGLISH: HadithLanguage = {
  code: "en",
  name: "English",
  native: "English",
  direction: "ltr",
  hadiths: 0,
};

function languageLabel(language: HadithLanguage): string {
  return language.native === language.name
    ? language.name
    : `${language.name} · ${language.native}`;
}

export function HadithReader({
  collection,
  collectionName,
  section,
  sectionName,
  total,
  languages,
}: Props) {
  const { settings, update } = useSettings();
  const [state, setState] = useState<State>({ status: "loading" });
  const [translation, setTranslation] = useState<TranslationState>({ status: "inline" });
  const [attempt, setAttempt] = useState(0);
  const [shown, setShown] = useState(WINDOW);
  const [copied, setCopied] = useState<number | null>(null);
  const [pendingHash, setPendingHash] = useState<number | null>(null);
  const lastSavedAt = useRef(0);
  const copyTimer = useRef<number | null>(null);

  // A collection is translated into a subset of the languages, so a choice
  // made in Bukhari falls back to English in a collection without it. The
  // setting itself is left alone for the next collection that has it.
  const language = useMemo(
    () =>
      languages.find((item) => item.code === settings.hadithTranslation) ??
      languages.find((item) => item.code === DEFAULT_HADITH_LANGUAGE) ??
      languages[0] ??
      ENGLISH,
    [languages, settings.hadithTranslation],
  );

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });

    fetch(hadithDataUrl(collection, section), { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`The book returned ${response.status}`);
        return response.json() as Promise<HadithSectionPayload>;
      })
      .then((payload) => setState({ status: "ready", payload }))
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setState({ status: "error" });
      });

    return () => controller.abort();
  }, [collection, section, attempt]);

  useEffect(() => {
    if (language.code === "en") {
      setTranslation({ status: "inline" });
      return;
    }

    const controller = new AbortController();
    setTranslation({ status: "loading" });

    fetch(hadithTranslationUrl(collection, language.code, section), { signal: controller.signal })
      .then((response) => {
        // A language that skipped this book has no file at all; that is a fact
        // about the dataset, not a failed request.
        if (response.status === 404) return null;
        if (!response.ok) throw new Error(`The translation returned ${response.status}`);
        return response.json() as Promise<HadithTranslationPayload>;
      })
      .then((payload) => {
        if (!payload) {
          setTranslation({ status: "missing" });
          return;
        }
        setTranslation({
          status: "ready",
          texts: new Map(payload.hadiths.map((hadith) => [hadith.number, hadith.text])),
        });
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setTranslation({ status: "error" });
      });

    return () => controller.abort();
  }, [collection, section, language, attempt]);

  useEffect(() => {
    setShown(WINDOW);
    setPendingHash(null);
  }, [collection, section]);

  useEffect(() => {
    return () => {
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
    };
  }, []);

  // A link such as /hadithly/bukhari/2/#hadith-32 opens the book far enough to
  // reach that hadith instead of landing on the first twenty-five.
  useEffect(() => {
    if (state.status !== "ready") return;
    const match = window.location.hash.match(/^#hadith-([\d.]+)$/);
    if (!match) return;
    const number = Number(match[1]);
    if (!Number.isFinite(number)) return;
    const index = state.payload.hadiths.findIndex((hadith) => hadith.number === number);
    if (index < 0) return;
    setShown((current) => Math.max(current, index + 1));
    setPendingHash(number);
  }, [state]);

  useEffect(() => {
    if (pendingHash === null) return;
    const element = document.getElementById(`hadith-${pendingHash}`);
    if (!element) return;

    let cancelled = false;
    const align = () => {
      if (!cancelled) element.scrollIntoView({ block: "start" });
    };

    // The revealed window and the Arabic face both change the layout after the
    // first scroll, so the row is re-aligned once the fonts settle and once
    // more after the browser has finished laying the window out.
    align();
    document.fonts?.ready.then(align).catch(() => {});
    const timer = window.setTimeout(() => {
      align();
      setPendingHash(null);
    }, 500);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [pendingHash]);

  // Remember the hadith that is actually on screen, not the one that was
  // clicked, so "continue reading" survives a long scroll.
  useEffect(() => {
    if (state.status !== "ready" || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (!visible) return;
        const number = Number((visible.target as HTMLElement).dataset.hadithNumber);
        if (!Number.isFinite(number) || number < 1) return;
        const now = Date.now();
        if (now - lastSavedAt.current < 800) return;
        lastSavedAt.current = now;
        writeStorage(HADITHLY_STORAGE_KEYS.progress, {
          collection,
          collectionName,
          section,
          sectionName,
          number,
          updatedAt: new Date().toISOString(),
        });
      },
      { rootMargin: "-25% 0px -60% 0px", threshold: 0 },
    );

    document
      .querySelectorAll<HTMLElement>("[data-hadith-number]")
      .forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [state.status, collection, collectionName, section, sectionName, shown]);

  const copyLink = useCallback((number: number) => {
    const url = `${window.location.origin}${window.location.pathname}#hadith-${number}`;
    const finish = (ok: boolean) => {
      setCopied(ok ? number : null);
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
      if (ok) copyTimer.current = window.setTimeout(() => setCopied(null), 2400);
    };
    navigator.clipboard
      ?.writeText(url)
      .then(() => finish(true))
      .catch(() => finish(false));
  }, []);

  const hadiths = state.status === "ready" ? state.payload.hadiths : [];
  const translationTexts = translation.status === "ready" ? translation.texts : null;
  const translationPending = translation.status === "loading";

  return (
    <div className="reader-column">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3 text-xs text-muted">
        <p>
          {formatCount(total)} {total === 1 ? "hadith" : "hadiths"} · Arabic and{" "}
          {language.name}
        </p>
        <div className="flex items-center gap-2">
          {languages.length > 1 ? (
            <label className="flex items-center gap-1.5">
              <span className="sr-only">Translation language</span>
              <select
                className="input h-9 w-auto min-h-0 py-0 pl-2.5 pr-7 text-[0.6875rem]"
                value={language.code}
                onChange={(event) =>
                  update({ hadithTranslation: event.target.value as HadithLanguageCode })
                }
                title="Translation language"
              >
                {languages.map((item) => (
                  <option key={item.code} value={item.code}>
                    {languageLabel(item)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <button
            type="button"
            className="icon-button px-2"
            onClick={() => update({ showTranslation: !settings.showTranslation })}
            aria-pressed={settings.showTranslation}
            title={settings.showTranslation ? "Hide the translation" : "Show the translation"}
          >
            <Languages size={15} strokeWidth={1.8} aria-hidden />
            <span className="text-[0.6875rem]">
              {settings.showTranslation ? "Translation on" : "Translation off"}
            </span>
          </button>
        </div>
      </div>

      {settings.showTranslation ? (
        translation.status === "loading" ? (
          <p role="status" className="py-3 text-xs text-muted">
            Loading the {language.name} translation…
          </p>
        ) : translation.status === "missing" ? (
          <p className="py-3 text-xs text-muted">
            The dataset publishes no {language.name} translation of this book. The Arabic above
            is complete.
          </p>
        ) : translation.status === "error" ? (
          <div role="alert" className="mt-3 rounded-lg border border-line bg-surface p-4">
            <p className="text-xs leading-relaxed text-muted">
              The {language.name} translation of this book could not be loaded. The Arabic text is
              unaffected.
            </p>
            <button
              type="button"
              className="button-secondary mt-3"
              onClick={() => setAttempt((value) => value + 1)}
            >
              Try again
            </button>
          </div>
        ) : null
      ) : null}

      {state.status === "loading" ? (
        <div role="status" aria-live="polite" className="py-10">
          <p className="text-xs text-muted">Loading this book from this device…</p>
          <div className="mt-5 space-y-3" aria-hidden="true">
            <div className="skeleton h-4 w-2/3" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-5/6" />
            <div className="skeleton mt-6 h-3 w-1/2" />
            <div className="skeleton h-3 w-4/5" />
          </div>
        </div>
      ) : state.status === "error" ? (
        <div role="alert" className="my-10 rounded-lg border border-line bg-surface p-5">
          <p className="text-sm text-ink">This book could not be read.</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            The file for {collectionName} {sectionName} did not load. Everything else on this page
            is unaffected.
          </p>
          <button
            type="button"
            className="button-secondary mt-4"
            onClick={() => setAttempt((value) => value + 1)}
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          <div>
            {hadiths.slice(0, shown).map((hadith) => (
              <HadithArticle
                key={hadith.number}
                hadith={hadith}
                collectionName={collectionName}
                sectionName={sectionName}
                showTranslation={settings.showTranslation}
                language={language}
                translationText={
                  language.code === "en"
                    ? hadith.english
                    : (translationTexts?.get(hadith.number) ?? null)
                }
                translationPending={translationPending}
                onCopyLink={copyLink}
              />
            ))}
          </div>

          {shown < hadiths.length ? (
            <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-line pt-5">
              <button
                type="button"
                className="button-secondary"
                onClick={() => setShown((current) => current + WINDOW)}
              >
                Read {Math.min(WINDOW, hadiths.length - shown)} more
              </button>
              <p className="text-xs text-muted">
                Showing {formatCount(Math.min(shown, hadiths.length))} of{" "}
                {formatCount(hadiths.length)} in this book.
              </p>
            </div>
          ) : hadiths.length > WINDOW ? (
            <p className="mt-6 border-t border-line pt-5 text-xs text-muted">
              End of this book · {formatCount(hadiths.length)} hadiths.
            </p>
          ) : null}
        </>
      )}

      <p role="status" aria-live="polite" className="h-5 text-xs text-muted">
        {copied ? `Link to hadith ${copied} copied.` : ""}
      </p>
    </div>
  );
}
