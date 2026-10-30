"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowUpRight, Search } from "lucide-react";
import { useSettings } from "@/components/settings/SettingsProvider";
import {
  HADITH_SEARCH_DOCS_URL,
  formatCount,
  hadithDataUrl,
  hadithSearchShardUrl,
  hadithTranslationUrl,
  hadithUrl,
} from "@/data/hadith-format";
import {
  HADITH_SEARCH_MIN_LENGTH,
  searchHadiths,
  type HadithSearchDocs,
  type HadithSearchHit,
  type HadithSearchShard,
} from "@/lib/hadith-search";
import { excerptFor, normalize } from "@/lib/normalize";
import type {
  HadithLanguage,
  HadithLanguageCode,
  HadithRecord,
  HadithSectionPayload,
  HadithTranslationPayload,
} from "@/types/hadith";

/** One result paints one book, so a query reads at most this many. */
const MAX_BOOKS = 10;
/** How many matches to consider before keeping the ones in fetched books. */
const MAX_HITS = 120;
const MAX_SHOWN = 40;
const MAX_BOOK_CACHE = 60;
const LOAD_CONCURRENCY = 5;

type SearchCollection = {
  id: string;
  name: string;
  languages: HadithLanguageCode[];
  books: Array<{ number: number; name: string }>;
};

type Props = {
  collections: SearchCollection[];
  languages: HadithLanguage[];
  total: number;
};

type BookText = {
  records: Map<number, HadithRecord>;
  /** Null for English, which sits inside the book file, or when absent. */
  translation: Map<number, string> | null;
};

type Shortlist = {
  books: Array<{ collection: string; section: number }>;
  hits: HadithSearchHit[];
};

const EXAMPLES = [
  { label: "Intention", query: "intention" },
  { label: "Patience", query: "patience" },
  { label: "الرحمن", query: "الرحمن" },
];

function bookKey(language: string, collection: string, section: number): string {
  return `${language}/${collection}/${section}`;
}

export function HadithSearchClient({ collections, languages, total }: Props) {
  const searchParams = useSearchParams();
  const { settings } = useSettings();
  const initial = (searchParams.get("q") ?? "").trim();
  const paramQuery = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initial);
  const [debounced, setDebounced] = useState(initial);
  const [wanted, setWanted] = useState(initial.length >= HADITH_SEARCH_MIN_LENGTH);
  const [attempt, setAttempt] = useState(0);

  // Arabic plus at most one translation is loaded at a time: all nine languages
  // together would cost more than the corpus the reader is searching.
  const [picked, setPicked] = useState<HadithLanguageCode | "ar" | null>(null);
  const active = picked ?? settings.hadithTranslation;
  const codes = useMemo(() => (active === "ar" ? ["ar"] : ["ar", active]), [active]);
  const language = languages.find((item) => item.code === active) ?? languages[0];
  const translationOn = active !== "ar";

  const [docs, setDocs] = useState<HadithSearchDocs | null>(null);
  const [version, setVersion] = useState(0);
  const [loading, setLoading] = useState(initial.length >= HADITH_SEARCH_MIN_LENGTH);
  const [failed, setFailed] = useState(0);
  const [error, setError] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const docsRef = useRef<HadithSearchDocs | null>(null);
  const shards = useRef(new Map<string, HadithSearchShard>());
  const broken = useRef(new Set<string>());
  const bookCache = useRef(new Map<string, BookText | null>());
  const pendingBooks = useRef(new Map<string, Promise<BookText | null>>());
  const [bookTexts, setBookTexts] = useState(new Map<string, BookText | null>());
  const unmounted = useRef(false);

  useEffect(() => {
    unmounted.current = false;
    return () => {
      unmounted.current = true;
    };
  }, []);

  const catalogue = useMemo(() => {
    const reference = new Map<string, { name: string; books: Map<number, string> }>();
    for (const collection of collections) {
      reference.set(collection.id, {
        name: collection.name,
        books: new Map(collection.books.map((book) => [book.number, book.name])),
      });
    }
    return reference;
  }, [collections]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(query);
      if (query.trim().length >= HADITH_SEARCH_MIN_LENGTH) setWanted(true);
    }, 220);
    return () => window.clearTimeout(timer);
  }, [query]);

  // A client-side navigation to /hadithly/search/?q=... replaces stale results.
  useEffect(() => {
    setQuery(paramQuery);
    setDebounced(paramQuery);
    if (paramQuery.trim().length >= HADITH_SEARCH_MIN_LENGTH) setWanted(true);
  }, [paramQuery]);

  useEffect(() => {
    if (!debounced.trim()) {
      window.history.replaceState(null, "", "/hadithly/search/");
      return;
    }
    window.history.replaceState(
      null,
      "",
      `/hadithly/search/?q=${encodeURIComponent(debounced.trim())}`,
    );
  }, [debounced]);

  useEffect(() => {
    if (!wanted) return;

    const controller = new AbortController();
    const jobs = collections.flatMap((collection) =>
      codes
        .filter((code) => code === "ar" || collection.languages.includes(code as HadithLanguageCode))
        .map((code) => `${code}/${collection.id}`),
    );
    const missing = jobs.filter((key) => !shards.current.has(key) && !broken.current.has(key));

    setLoading(true);
    setError(false);
    setFailed(broken.current.size);
    setProgress({ done: jobs.length - missing.length, total: jobs.length });

    if (!missing.length && docsRef.current) {
      setLoading(false);
      return () => controller.abort();
    }

    const load = async () => {
      try {
        if (!docsRef.current) {
          const response = await fetch(HADITH_SEARCH_DOCS_URL, { signal: controller.signal });
          if (!response.ok) throw new Error(`The catalogue returned ${response.status}`);
          docsRef.current = (await response.json()) as HadithSearchDocs;
          if (controller.signal.aborted) return;
          setDocs(docsRef.current);
        }
      } catch {
        if (controller.signal.aborted) return;
        setError(true);
        setLoading(false);
        return;
      }

      let next = 0;
      let done = jobs.length - missing.length;
      const worker = async () => {
        while (next < missing.length) {
          const key = missing[next++];
          const [code, collection] = key.split("/");
          try {
            const response = await fetch(hadithSearchShardUrl(code, collection), {
              signal: controller.signal,
            });
            if (!response.ok) throw new Error(`${key} returned ${response.status}`);
            shards.current.set(key, (await response.json()) as HadithSearchShard);
          } catch {
            if (controller.signal.aborted) return;
            broken.current.add(key);
          }
          done += 1;
          if (controller.signal.aborted) return;
          setProgress({ done, total: jobs.length });
          setFailed(broken.current.size);
          setVersion((value) => value + 1);
        }
      };

      await Promise.all(Array.from({ length: Math.min(LOAD_CONCURRENCY, missing.length) }, worker));
      if (!controller.signal.aborted) {
        setLoading(false);
        setVersion((value) => value + 1);
      }
    };

    void load();
    return () => controller.abort();
  }, [attempt, codes, collections, wanted]);

  // Only the postings for the selected languages count: a previous language's
  // shards stay cached, but they must not answer this query.
  const shardList = useMemo(() => {
    const loaded: HadithSearchShard[] = [];
    for (const code of codes) {
      for (const collection of collections) {
        const shard = shards.current.get(`${code}/${collection.id}`);
        if (shard) loaded.push(shard);
      }
    }
    return loaded;
  }, [codes, collections, version]);

  const tokens = useMemo(
    () =>
      normalize(debounced)
        .split(" ")
        .filter((token) => token.length >= HADITH_SEARCH_MIN_LENGTH),
    [debounced],
  );

  const results = useMemo(() => {
    if (!docs || !tokens.length) return null;
    return searchHadiths(shardList, docs.collections, debounced, MAX_HITS);
  }, [docs, shardList, tokens, debounced]);

  // Results paint real records: only the books holding a visible match are
  // fetched, and only once per language.
  const shortlist = useMemo<Shortlist>(() => {
    if (!results) return { books: [], hits: [] };
    const seen = new Set<string>();
    const books: Shortlist["books"] = [];
    for (const hit of results.hits) {
      const key = `${hit.collection}/${hit.section}`;
      if (seen.has(key)) continue;
      if (books.length >= MAX_BOOKS) break;
      seen.add(key);
      books.push({ collection: hit.collection, section: hit.section });
    }
    return {
      books,
      hits: results.hits
        .filter((hit) => seen.has(`${hit.collection}/${hit.section}`))
        .slice(0, MAX_SHOWN),
    };
  }, [results]);

  const wantedBooks = useMemo(
    () =>
      shortlist.books.map((book) => ({
        ...book,
        key: bookKey(active, book.collection, book.section),
      })),
    [active, shortlist],
  );

  useEffect(() => {
    if (!wantedBooks.length) return;
    if (bookCache.current.size > MAX_BOOK_CACHE) {
      bookCache.current.clear();
      setBookTexts(new Map());
    }

    const load = async (collection: string, section: number): Promise<BookText | null> => {
      try {
        const [bookResponse, translationResponse] = await Promise.all([
          fetch(hadithDataUrl(collection, section)),
          active === "en"
            ? Promise.resolve(null)
            : fetch(hadithTranslationUrl(collection, active as HadithLanguageCode, section)),
        ]);
        if (!bookResponse.ok) throw new Error(`The book returned ${bookResponse.status}`);

        const payload = (await bookResponse.json()) as HadithSectionPayload;
        let translation: Map<number, string> | null = null;
        if (translationResponse?.ok) {
          const translated = (await translationResponse.json()) as HadithTranslationPayload;
          translation = new Map(translated.hadiths.map((hadith) => [hadith.number, hadith.text]));
        }

        return {
          records: new Map(payload.hadiths.map((hadith) => [hadith.number, hadith])),
          translation,
        };
      } catch {
        return null;
      }
    };

    for (const { key, collection, section } of wantedBooks) {
      if (bookCache.current.has(key) || pendingBooks.current.has(key)) continue;
      const promise = load(collection, section).then((value) => {
        bookCache.current.set(key, value);
        pendingBooks.current.delete(key);
        if (!unmounted.current) {
          setBookTexts((current) => new Map(current).set(key, value));
        }
        return value;
      });
      pendingBooks.current.set(key, promise);
    }
  }, [active, wantedBooks]);

  const focus = tokens[0] ?? "";

  const retry = () => {
    broken.current.clear();
    setFailed(0);
    setAttempt((value) => value + 1);
  };

  return (
    <div className="mx-auto max-w-3xl px-5 pb-20 pt-8 sm:px-8 sm:pt-12">
      <nav className="text-xs">
        <Link href="/hadithly/" className="inline-flex items-center gap-1.5 text-muted hover:text-ink">
          <ArrowLeft size={14} strokeWidth={1.8} aria-hidden />
          Hadithly
        </Link>
      </nav>

      <header className="pt-10">
        <p className="meta">Search</p>
        <h1 className="display mt-3 text-4xl sm:text-5xl">Find a narration.</h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
          Search the Arabic text and the translation you choose across all{" "}
          {formatCount(total)} narrations. Diacritics and Arabic letter variants are matched on a
          derived index; the narrated text shown below is the published record, never a rewrite.
        </p>
      </header>

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
            placeholder="Arabic word, English phrase, or name…"
            className="input h-14 pl-11 pr-4 text-base sm:pr-32"
            aria-label="Search the hadiths"
            autoComplete="off"
            autoFocus={false}
          />
          <span className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 text-[0.6875rem] text-muted sm:block">
            {loading
              ? `Loading index ${progress.done}/${progress.total}`
              : docs
                ? `${formatCount(total)} narrations`
                : "Index on demand"}
          </span>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-xs text-muted">
          <span>Searching</span>
          <select
            className="input h-9 w-auto min-h-0 py-0 pl-2.5 pr-7 text-[0.6875rem]"
            value={active}
            onChange={(event) => setPicked(event.target.value as HadithLanguageCode | "ar")}
            title="Language to search"
            aria-label="Search language"
          >
            <option value="ar">Arabic only</option>
            {languages.map((item) => (
              <option key={item.code} value={item.code}>
                Arabic + {item.name}
              </option>
            ))}
          </select>
        </label>
        {!loading && results ? (
          <p className="text-[0.6875rem] text-muted" role="status" aria-live="polite">
            {`${results.total.toLocaleString()} match${results.total === 1 ? "" : "es"}`}
          </p>
        ) : null}
      </div>

      <div className="mt-8">
        {error ? (
          <div className="rounded-lg border border-line bg-surface p-6" role="alert">
            <p className="text-sm font-medium">The search index could not be loaded.</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Reading and navigation still work. The index is a derived file and holds no
              additional hadith text.
            </p>
            <button type="button" onClick={retry} className="button-secondary mt-4">
              Try again
            </button>
          </div>
        ) : loading ? (
          <div className="space-y-4" role="status" aria-live="polite">
            <p className="text-xs text-muted">
              Loading the index · {progress.done} of {progress.total} files
            </p>
            <div className="skeleton h-24 w-full" />
            <div className="skeleton h-24 w-full" />
            <div className="skeleton h-24 w-full" />
          </div>
        ) : !tokens.length ? (
          <div className="rounded-lg border border-line bg-surface p-6 sm:p-8">
            <p className="text-sm text-muted">
              Enter at least {HADITH_SEARCH_MIN_LENGTH} letters. Arabic diacritics are optional, so
              <span className="font-arabic mx-1 text-lg text-ink" lang="ar" dir="rtl">
                الرحمن
              </span>
              finds the same narrations as the fully vocalised form.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {EXAMPLES.map((example) => (
                <button
                  key={example.query}
                  type="button"
                  onClick={() => {
                    setQuery(example.query);
                    setDebounced(example.query);
                    setWanted(true);
                  }}
                  className="rounded-full border border-line px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent/40 hover:text-ink"
                >
                  {example.label}
                </button>
              ))}
            </div>
            <p className="mt-5 text-[0.6875rem] leading-relaxed text-muted">
              {translationOn
                ? `Arabic and ${language.name} are searched. Switch the language above to search another translation, or limit the search to Arabic.`
                : "Only the Arabic text is searched. Pick a translation above to search its text too."}
            </p>
          </div>
        ) : results && results.total === 0 ? (
          <div className="rounded-lg border border-line bg-surface p-8 text-center">
            <p className="display text-xl">No narrations match “{debounced.trim()}”.</p>
            <p className="mt-2 text-sm text-muted">
              Try a shorter word, a different spelling, or switch the language filter. Arabic
              search ignores vowel marks; only Arabic and the selected translation are indexed.
            </p>
          </div>
        ) : results ? (
          <div>
            {failed ? (
              <p className="mb-4 border-l-2 border-line pl-3 text-[0.6875rem] leading-relaxed text-muted">
                {failed} of the index files did not load, so this list may be incomplete.
                <button
                  type="button"
                  onClick={retry}
                  className="ml-1 underline decoration-line underline-offset-2 hover:text-ink"
                >
                  Try again
                </button>
              </p>
            ) : null}

            <ol className="divide-y divide-line border-y border-line">
              {shortlist.hits.map((hit) => {
                const collection = catalogue.get(hit.collection);
                const book = bookTexts.get(bookKey(active, hit.collection, hit.section));
                const record = book?.records.get(hit.number);
                const translated =
                  active === "en"
                    ? record?.english ?? null
                    : book?.translation?.get(hit.number) ?? null;

                return (
                  <li key={`${hit.collection}:${hit.section}:${hit.number}`}>
                    <Link
                      href={hadithUrl(hit.collection, hit.section, hit.number)}
                      className="group block py-5 transition-colors hover:bg-highlight/25"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="meta">
                          {collection?.name ?? hit.collection} ·{" "}
                          {collection?.books.get(hit.section) ?? `Book ${hit.section}`} · Hadith{" "}
                          {hit.number}
                        </p>
                        <ArrowUpRight
                          size={15}
                          strokeWidth={1.8}
                          className="text-muted transition-colors group-hover:text-accent"
                          aria-hidden
                        />
                      </div>

                      {book === undefined ? (
                        <div className="mt-3 space-y-2" aria-hidden="true">
                          <div className="skeleton h-3.5 w-4/5" />
                          <div className="skeleton h-3 w-3/5" />
                        </div>
                      ) : book === null ? (
                        <p className="mt-2 text-xs text-muted">
                          The text of this book could not be loaded. The citation still opens it.
                        </p>
                      ) : record ? (
                        <>
                          {record.arabic ? (
                            <p
                              lang="ar"
                              dir="rtl"
                              className="font-arabic mt-2.5 text-[1.3rem] leading-[1.95] text-ink"
                            >
                              {excerptFor(record.arabic, focus, 175)}
                            </p>
                          ) : null}
                          {translationOn && translated ? (
                            <p
                              lang={active}
                              dir={language.direction}
                              className={`translation-text mt-1.5 text-sm ${
                                language.code === "ur"
                                  ? "translation-urdu"
                                  : language.direction === "rtl"
                                    ? "translation-rtl"
                                    : ""
                              }`}
                            >
                              {excerptFor(translated, focus, 210)}
                            </p>
                          ) : null}
                        </>
                      ) : (
                        <p className="mt-2 text-xs text-muted">
                          This narration is no longer in the book file.
                        </p>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ol>

            <p className="mt-4 text-xs leading-relaxed text-muted">
              {results.total > shortlist.hits.length
                ? `Showing ${shortlist.hits.length} of ${results.total.toLocaleString()} matches, from the first ${shortlist.books.length} books. Refine the query to narrow the list.`
                : `All ${results.total.toLocaleString()} match${results.total === 1 ? "" : "es"} shown.`}
            </p>
          </div>
        ) : null}
      </div>

      <p className="mt-10 border-t border-line pt-5 text-[0.6875rem] leading-relaxed text-muted">
        Search reads a derived index of normalized text; nothing in it is displayed. Grades,
        translations and Arabic are taken from the published editions when a result is opened.
      </p>
    </div>
  );
}
