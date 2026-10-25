"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { formatCount, hadithRangeLabel, hadithSectionUrl } from "@/data/hadith-format";
import type { HadithSectionMeta } from "@/data/hadith";

type Props = {
  collectionId: string;
  sections: HadithSectionMeta[];
};

export function SectionDirectory({ collectionId, sections }: Props) {
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query.trim().toLowerCase());

  const filtered = deferred
    ? sections.filter((section) => {
        const haystack = `${section.number} ${section.name} ${section.first ?? ""} ${section.last ?? ""}`;
        return haystack.toLowerCase().includes(deferred);
      })
    : sections;

  return (
    <section aria-labelledby="hadith-books-title" className="mt-12">
      <div className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="meta">Contents</p>
          <h2 id="hadith-books-title" className="display mt-2 text-2xl">
            The books
          </h2>
        </div>
        {sections.length > 8 ? (
          <label className="relative block w-full sm:w-64">
            <span className="sr-only">Filter the books</span>
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
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <p className="py-14 text-center text-sm text-muted">
          No book matches “{query}”. Try a name or a number.
        </p>
      ) : (
        <ol className="divide-y divide-line">
          {filtered.map((section) => (
            <li key={section.number}>
              <Link
                href={hadithSectionUrl(collectionId, section.number)}
                className="group grid grid-cols-[2.25rem_1fr_auto] items-center gap-4 py-3.5 transition-colors hover:bg-highlight/30 sm:gap-5"
              >
                <span className="text-[0.6875rem] tabular-nums text-muted">
                  {String(section.number).padStart(2, "0")}
                </span>
                <span className="min-w-0">
                  <span className="block text-[0.9375rem] font-medium text-ink group-hover:text-accent-strong">
                    {section.name}
                  </span>
                  <span className="mt-0.5 block text-[0.6875rem] text-muted">
                    {formatCount(section.count)} {section.count === 1 ? "hadith" : "hadiths"} ·{" "}
                    {hadithRangeLabel(section)}
                  </span>
                </span>
                <ArrowRight
                  size={15}
                  strokeWidth={1.8}
                  className="text-muted transition-colors group-hover:text-accent"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ol>
      )}

      <p className="mt-5 text-xs text-muted">
        Showing {filtered.length} of {sections.length} books.
      </p>
    </section>
  );
}
