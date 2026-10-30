import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { HadithSearchClient } from "@/components/hadithly/HadithSearchClient";
import { HADITHLY_LANGUAGES, HADITHLY_TOTALS, HADITH_COLLECTIONS } from "@/data/hadith";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Search the hadith",
  description:
    "Search the Arabic text and every published translation of the Six Books, the Muwatta and three collections of forty narrations.",
  path: "/hadithly/search/",
});

// Only what a result line needs travels to the browser: the collection and book
// names, and which translations each collection publishes.
const COLLECTIONS = HADITH_COLLECTIONS.map((collection) => ({
  id: collection.id,
  name: collection.name,
  languages: collection.languages.map((language) => language.code),
  books: collection.sections.map((section) => ({
    number: section.number,
    name: section.name,
  })),
}));

function SearchFallback() {
  return (
    <div className="mx-auto max-w-3xl px-5 pb-20 pt-8 sm:px-8 sm:pt-12" role="status">
      <nav className="text-xs">
        <Link href="/hadithly/" className="inline-flex items-center gap-1.5 text-muted hover:text-ink">
          <ArrowLeft size={14} strokeWidth={1.8} aria-hidden />
          Hadithly
        </Link>
      </nav>
      <p className="meta pt-10">Search</p>
      <h1 className="display mt-3 text-4xl sm:text-5xl">Find a narration.</h1>
      <div className="skeleton mt-10 h-14 w-full" />
      <div className="mt-8 space-y-4">
        <div className="skeleton h-24 w-full" />
        <div className="skeleton h-24 w-full" />
      </div>
      <span className="sr-only">Loading search…</span>
    </div>
  );
}

export default function HadithSearchPage() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <HadithSearchClient
        collections={COLLECTIONS}
        languages={HADITHLY_LANGUAGES}
        total={HADITHLY_TOTALS.hadiths}
      />
    </Suspense>
  );
}
