"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Loader2, Search } from "lucide-react";
import surahMeta from "@/data/generated/surah-meta.json";
import { excerptFor, normalize } from "@/lib/normalize";
import { searchQuran, type SearchIndex, type SearchMode } from "@/lib/search";

const SURAHS = surahMeta as Array<{ number: number; name: string; arabicName: string }>;
const MODES: Array<{ value: SearchMode; label: string }> = [
  { value: "all", label: "All" },
  { value: "arabic", label: "Arabic" },
  { value: "english", label: "English" },
];

const EXAMPLES = [
  { label: "Mercy", query: "mercy" },
  { label: "Patience", query: "patience" },
  { label: "الرحمن", query: "الرحمن" },
];

export function SearchClient() {
  const searchParams = useSearchParams();
  const initial = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initial);
  const [debounced, setDebounced] = useState(initial);
  const paramQuery = searchParams.get("q") ?? "";
  const [mode, setMode] = useState<SearchMode>("all");
  const [index, setIndex] = useState<SearchIndex | null>(null);
  // The index is a large derived file, so it is only fetched once a query exists.
  const [wanted, setWanted] = useState(() => initial.trim().length >= 2);
  const [loading, setLoading] = useState(() => initial.trim().length >= 2);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!wanted) return;
    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;
    setLoading(true);
    setError(null);

    fetch("/quran/search-index.json", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Search index returned ${response.status}`);
        return response.json() as Promise<SearchIndex>;
      })
      .then((payload) => {
        setIndex(payload);
        setLoading(false);
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError("The search index could not be loaded.");
        setLoading(false);
      });

    return () => controller.abort();
  }, [attempt, wanted]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(query);
      if (query.trim().length >= 2) setWanted(true);
    }, 220);
    return () => window.clearTimeout(timer);
  }, [query]);

  // A client-side navigation to /search/?q=... should replace stale results.
  useEffect(() => {
    setQuery(paramQuery);
    setDebounced(paramQuery);
    if (paramQuery.trim().length >= 2) setWanted(true);
  }, [paramQuery]);

  useEffect(() => {
    if (!debounced.trim()) {
      window.history.replaceState(null, "", "/search/");
      return;
    }
    window.history.replaceState(
      null,
      "",
      `/search/?q=${encodeURIComponent(debounced.trim())}`,
    );
  }, [debounced]);

  const results = useMemo(() => {
    if (!index || !normalize(debounced).trim()) return null;
    return searchQuran(index.entries, debounced, mode);
  }, [index, debounced, mode]);

  const retry = useCallback(() => {
    setWanted(true);
    setAttempt((value) => value + 1);
  }, []);
  const normalizedQuery = normalize(debounced).trim();

  return (
    <div className="mx-auto max-w-3xl px-5 pb-20 pt-12 sm:px-8 sm:pt-16">
      <p className="meta">Search</p>
      <h1 className="display mt-3 text-4xl sm:text-5xl">Find a verse.</h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
        Search the Arabic source text or the Itani English translation.
        Diacritics and common Arabic letter variants are matched on a derived
        index; the displayed Quranic text is never altered.
      </p>

      <form
        role="search"
        className="mt-8"
        onSubmit={(event) => {
          event.preventDefault();
          setDebounced(query);
        }}
      >
        <div className="relative">
          <Search
            size={18}
            strokeWidth={1.8}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Arabic word, English phrase, or verse reference…"
            className="input h-14 pl-11 pr-4 text-base sm:pr-28"
            aria-label="Search the Quran"
            autoComplete="off"
            autoFocus={false}
          />
          <span className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 text-[0.6875rem] text-muted sm:block">
            {loading
              ? "Loading index"
              : index
                ? `${index.entries.length.toLocaleString()} verses`
                : "Index on demand"}
          </span>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="segmented" role="group" aria-label="Search language">
          {MODES.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={mode === item.value}
              onClick={() => setMode(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
        {!loading && index ? (
          <p className="text-[0.6875rem] text-muted" role="status" aria-live="polite">
            {results ? `${results.total.toLocaleString()} match${results.total === 1 ? "" : "es"}` : ""}
          </p>
        ) : null}
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="space-y-4" aria-label="Loading search index" role="status">
            <div className="skeleton h-24 w-full" />
            <div className="skeleton h-24 w-full" />
            <div className="skeleton h-24 w-full" />
            <span className="sr-only">Loading search index…</span>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-line bg-surface p-6">
            <p className="text-sm font-medium">{error}</p>
            <p className="mt-1 text-xs text-muted">
              Reading and navigation still work. The index is a derived file and
              contains no additional Quranic text.
            </p>
            <button type="button" onClick={retry} className="button-secondary mt-4">
              Try again
            </button>
          </div>
        ) : !normalizedQuery ? (
          <div className="rounded-lg border border-line bg-surface p-6 sm:p-8">
            <p className="text-sm text-muted">
              Enter at least two letters. Arabic diacritics are optional, so
              <span className="font-arabic mx-1 text-lg text-ink" lang="ar" dir="rtl">
                الرحمن
              </span>
              finds the same verses as the fully vocalized form.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {EXAMPLES.map((example) => (
                <button
                  key={example.query}
                  type="button"
                  onClick={() => {
                    setQuery(example.query);
                    setDebounced(example.query);
                  }}
                  className="rounded-full border border-line px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent/40 hover:text-ink"
                >
                  {example.label}
                </button>
              ))}
            </div>
          </div>
        ) : results && results.matches.length === 0 ? (
          <div className="rounded-lg border border-line bg-surface p-8 text-center">
            <p className="display text-xl">No verses match “{debounced.trim()}”.</p>
            <p className="mt-2 text-sm text-muted">
              Try a shorter word, a different spelling, or switch the language
              filter. Arabic search ignores vowel marks.
            </p>
          </div>
        ) : results ? (
          <div>
            <ol className="divide-y divide-line border-y border-line">
              {results.matches.map(({ entry, matched }) => {
                const surah = SURAHS[entry.s - 1];
                const arabicExcerpt = excerptFor(
                  entry.a,
                  matched === "arabic" || mode !== "english" ? normalizedQuery : "",
                  175,
                );
                const englishExcerpt = excerptFor(
                  entry.t,
                  matched === "english" || mode !== "arabic" ? normalizedQuery : "",
                  190,
                );
                return (
                  <li key={`${entry.s}:${entry.v}`}>
                    <Link
                      href={`/surah/${entry.s}/#verse-${entry.v}`}
                      className="group block py-5 transition-colors hover:bg-highlight/25"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="meta">
                          Surah {entry.s} · {surah?.name} · Verse {entry.v}
                        </p>
                        <ArrowUpRight
                          size={15}
                          strokeWidth={1.8}
                          className="text-muted transition-colors group-hover:text-accent"
                          aria-hidden
                        />
                      </div>
                      <p
                        lang="ar"
                        dir="rtl"
                        className="font-arabic mt-2.5 text-[1.35rem] leading-[1.95] text-ink"
                      >
                        {arabicExcerpt}
                      </p>
                      <p lang="en" dir="ltr" className="mt-1.5 text-sm leading-relaxed text-muted">
                        {englishExcerpt}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ol>
            {results.total > results.matches.length ? (
              <p className="mt-4 text-xs text-muted">
                Showing the first {results.matches.length} of {results.total} matches.
                Refine the query to narrow the results.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
