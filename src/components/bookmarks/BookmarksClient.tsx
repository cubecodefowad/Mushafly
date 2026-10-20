"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Bookmark, Check, Pencil, Trash2, X } from "lucide-react";
import { useReadingState } from "@/components/bookmarks/ReadingStateProvider";
import { useSettings } from "@/components/settings/SettingsProvider";
import surahMeta from "@/data/generated/surah-meta.json";
import { translationInfo, translationUrl } from "@/data/translations";
import type { TranslationLanguage } from "@/types/quran";

type SurahTexts = {
  arabic: Record<string, string>;
  translation: Record<string, string>;
};

const SURAHS = surahMeta as Array<{ number: number; name: string; arabicName: string }>;
const pad3 = (n: number) => String(n).padStart(3, "0");

export function BookmarksClient() {
  const {
    bookmarks,
    loaded,
    removeBookmark,
    updateBookmarkLabel,
  } = useReadingState();
  const { settings } = useSettings();
  const language = settings.translation;
  const activeTranslation = translationInfo(language);
  const cache = useRef(new Map<string, SurahTexts>());
  const [texts, setTexts] = useState<Record<string, { a: string; t: string }>>({});
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [confirming, setConfirming] = useState<string | null>(null);

  useEffect(() => {
    if (!loaded || bookmarks.length === 0) return;
    const surahs = [...new Set(bookmarks.map((bookmark) => bookmark.reference.surahNumber))];
    const cacheKey = (surah: number) => `${language}:${surah}`;
    const missing = surahs.filter((surah) => !cache.current.has(cacheKey(surah)));
    if (missing.length === 0) {
      setTexts(buildTexts(bookmarks, cache.current, language));
      return;
    }

    const controller = new AbortController();
    setFetching(true);
    setError(null);
    // Do not leave the previous language on screen while the new one loads.
    setTexts(buildTexts(bookmarks, cache.current, language));

    Promise.all(
      missing.map(async (surah) => {
        const file = pad3(surah);
        const [arabicResponse, translationResponse] = await Promise.all([
          fetch(`/quran/surah/${file}.json`, { signal: controller.signal }),
          fetch(translationUrl(language, surah), { signal: controller.signal }),
        ]);
        if (!arabicResponse.ok || !translationResponse.ok) {
          throw new Error(`Source files for surah ${surah} could not be loaded.`);
        }
        const arabic = (await arabicResponse.json()) as { verse: Record<string, string> };
        const translated = (await translationResponse.json()) as {
          verse: Record<string, string>;
        };
        cache.current.set(cacheKey(surah), {
          arabic: arabic.verse,
          translation: translated.verse,
        });
      }),
    )
      .then(() => {
        setTexts(buildTexts(bookmarks, cache.current, language));
        setFetching(false);
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError(
          reason instanceof Error
            ? reason.message
            : "Saved verse text could not be loaded from the pinned source files.",
        );
        setFetching(false);
      });

    return () => controller.abort();
  }, [bookmarks, loaded, language]);

  useEffect(() => {
    if (!loaded) return;
    setTexts(buildTexts(bookmarks, cache.current, language));
  }, [bookmarks, loaded, language]);

  if (!loaded) {
    return (
      <div className="mx-auto max-w-3xl px-5 pb-20 pt-12 sm:px-8 sm:pt-16">
        <p className="meta">Your reading</p>
        <h1 className="display mt-3 text-4xl sm:text-5xl">Bookmarks</h1>
        <div className="mt-10 space-y-4">
          <div className="skeleton h-32 w-full" />
          <div className="skeleton h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 pb-20 pt-12 sm:px-8 sm:pt-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="meta">Your reading</p>
          <h1 className="display mt-3 text-4xl sm:text-5xl">Bookmarks</h1>
        </div>
        {bookmarks.length > 0 ? (
          <p className="text-xs text-muted">
            {bookmarks.length} saved verse{bookmarks.length === 1 ? "" : "s"} · local to this browser
          </p>
        ) : null}
      </div>

      {error ? (
        <div className="mt-8 rounded-lg border border-line bg-surface p-4 text-sm">
          <p>{error}</p>
          <p className="mt-1 text-xs text-muted">
            Your references are still saved. Reading the Quran does not depend on
            this lookup.
          </p>
        </div>
      ) : null}

      {bookmarks.length === 0 ? (
        <div className="mt-10 rounded-xl border border-line bg-surface p-8 text-center">
          <Bookmark size={22} strokeWidth={1.5} className="mx-auto text-accent" aria-hidden />
          <p className="display mt-4 text-2xl">Nothing saved yet.</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
            Use the bookmark control beside any verse. References are kept in
            this browser; no account or server is involved.
          </p>
          <Link href="/surah/1/" className="button-primary mt-6">
            Read Al-Fatiha
          </Link>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-line border-y border-line">
          {bookmarks.map((bookmark) => {
            const { surahNumber, verseNumber } = bookmark.reference;
            const surah = SURAHS[surahNumber - 1];
            const text = texts[`${surahNumber}:${verseNumber}`];
            const isLoading = fetching && !text;

            return (
              <li key={bookmark.id} className="py-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="meta">
                      Surah {surahNumber} · {surah?.name} · Verse {verseNumber}
                    </p>
                    {bookmark.label ? (
                      <p className="mt-2 text-sm font-medium text-accent">{bookmark.label}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => {
                        setEditing(bookmark.id);
                        setDraft(bookmark.label ?? "");
                        setConfirming(null);
                      }}
                      aria-label="Edit bookmark label"
                      title="Edit label"
                    >
                      <Pencil size={15} strokeWidth={1.8} aria-hidden />
                    </button>
                    {confirming === bookmark.id ? (
                      <span className="flex items-center gap-1">
                        <button
                          type="button"
                          className="icon-button text-accent"
                          onClick={() => {
                            removeBookmark(bookmark.id);
                            setConfirming(null);
                          }}
                          aria-label="Confirm remove bookmark"
                          title="Confirm remove"
                        >
                          <Check size={16} strokeWidth={2} aria-hidden />
                        </button>
                        <button
                          type="button"
                          className="icon-button"
                          onClick={() => setConfirming(null)}
                          aria-label="Keep bookmark"
                          title="Keep bookmark"
                        >
                          <X size={16} strokeWidth={1.8} aria-hidden />
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => setConfirming(bookmark.id)}
                        aria-label="Remove bookmark"
                        title="Remove bookmark"
                      >
                        <Trash2 size={15} strokeWidth={1.8} aria-hidden />
                      </button>
                    )}
                  </div>
                </div>

                {editing === bookmark.id ? (
                  <form
                    className="mt-3 flex gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      updateBookmarkLabel(bookmark.id, draft);
                      setEditing(null);
                    }}
                  >
                    <input
                      className="input"
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      placeholder="Optional label"
                      aria-label="Bookmark label"
                      maxLength={120}
                      autoFocus
                    />
                    <button type="submit" className="button-secondary shrink-0">
                      Save
                    </button>
                  </form>
                ) : null}

                {isLoading ? (
                  <div className="mt-4 space-y-2" role="status">
                    <div className="skeleton h-6 w-3/4" />
                    <div className="skeleton h-4 w-1/2" />
                    <span className="sr-only">Loading saved verse…</span>
                  </div>
                ) : text ? (
                  <>
                    <p
                      lang="ar"
                      dir="rtl"
                      className="font-arabic mt-3 line-clamp-3 text-[1.5rem] leading-[2] text-ink"
                    >
                      {text.a}
                    </p>
                    <p
                      lang={activeTranslation.htmlLang ?? language}
                      dir={activeTranslation.direction}
                      className={`mt-2 line-clamp-2 text-sm leading-relaxed text-muted ${
                        activeTranslation.direction === "rtl"
                          ? activeTranslation.htmlLang === "ur"
                            ? "font-urdu"
                            : "font-arabic"
                          : ""
                      }`}
                    >
                      {text.t}
                    </p>
                  </>
                ) : (
                  <p className="mt-4 text-xs text-muted">
                    Verse text is unavailable from the local source files. The
                    reference itself is intact.
                  </p>
                )}

                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-[0.6875rem] text-muted">
                    Saved {new Date(bookmark.createdAt).toLocaleDateString("en", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <Link
                    href={`/surah/${surahNumber}/#verse-${verseNumber}`}
                    className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent-strong"
                  >
                    Open verse
                    <ArrowUpRight size={13} strokeWidth={1.8} aria-hidden />
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-8 text-[0.6875rem] leading-relaxed text-muted">
        Bookmarks reference surah and verse numbers only; Quranic text is always
        read from the pinned source files. Malformed saved data is ignored.
      </p>
    </div>
  );
}

function buildTexts(
  bookmarks: Array<{ reference: { surahNumber: number; verseNumber: number } }>,
  cache: Map<string, SurahTexts>,
  language: TranslationLanguage,
): Record<string, { a: string; t: string }> {
  const output: Record<string, { a: string; t: string }> = {};
  for (const bookmark of bookmarks) {
    const { surahNumber, verseNumber } = bookmark.reference;
    const source = cache.get(`${language}:${surahNumber}`);
    if (!source) continue;
    const key = `verse_${verseNumber}`;
    const a = source.arabic[key];
    const t = source.translation[key];
    if (typeof a === "string" && typeof t === "string" && t.length > 0) {
      output[`${surahNumber}:${verseNumber}`] = { a, t };
    }
  }
  return output;
}
