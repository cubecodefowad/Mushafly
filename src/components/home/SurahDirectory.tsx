"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { Search } from "lucide-react";
import surahMeta from "@/data/generated/surah-meta.json";

type Meta = {
  number: number;
  name: string;
  arabicName: string;
  verseCount: number;
  place: string;
  type: string;
};

const SURAHS = surahMeta as Meta[];

export function SurahDirectory() {
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query.trim().toLowerCase());

  const filtered = deferred
    ? SURAHS.filter((surah) => {
        const haystack = `${surah.number} ${surah.name} ${surah.arabicName} ${surah.place}`.toLowerCase();
        return haystack.includes(deferred);
      })
    : SURAHS;

  return (
    <section aria-labelledby="surah-directory-title" className="mt-16">
      <div className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="meta">Directory</p>
          <h2 id="surah-directory-title" className="display mt-2 text-3xl">
            The Surahs
          </h2>
        </div>
        <label className="relative block w-full sm:w-64">
          <span className="sr-only">Filter surahs</span>
          <Search
            size={15}
            strokeWidth={1.8}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter by name or number"
            className="input pl-9"
            autoComplete="off"
          />
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted">
          No surah matches “{query}”. Try a name, number, or Arabic title.
        </div>
      ) : (
        <ol className="divide-y divide-line">
          {filtered.map((surah) => (
            <li key={surah.number}>
              <Link
                href={`/surah/${surah.number}/`}
                className="group grid grid-cols-[2.25rem_1fr_auto] items-center gap-4 py-3.5 transition-colors hover:bg-highlight/30 sm:gap-5"
              >
                <span className="text-[0.6875rem] tabular-nums text-muted">
                  {String(surah.number).padStart(3, "0")}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[0.9375rem] font-medium text-ink group-hover:text-accent-strong">
                    {surah.name}
                  </span>
                  <span className="mt-0.5 block text-[0.6875rem] text-muted">
                    {surah.place} · {surah.verseCount} verses
                  </span>
                </span>
                <span
                  lang="ar"
                  dir="rtl"
                  className="font-arabic text-[1.35rem] text-ink/85 transition-colors group-hover:text-accent"
                >
                  {surah.arabicName}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}

      <p className="mt-5 text-xs text-muted">
        Showing {filtered.length} of {SURAHS.length} surahs.
      </p>
    </section>
  );
}
