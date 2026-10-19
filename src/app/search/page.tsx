import { Suspense } from "react";
import { SearchClient } from "@/components/search/SearchClient";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Search",
  description:
    "Search the Arabic Quran and the Itani English translation by verse, surah or phrase.",
  path: "/search/",
});

function SearchFallback() {
  return (
    <div className="mx-auto max-w-3xl px-5 pb-20 pt-12 sm:px-8 sm:pt-16" role="status">
      <p className="meta">Search</p>
      <h1 className="display mt-3 text-4xl sm:text-5xl">Find a verse.</h1>
      <div className="skeleton mt-10 h-14 w-full" />
      <div className="mt-8 space-y-4">
        <div className="skeleton h-24 w-full" />
        <div className="skeleton h-24 w-full" />
      </div>
      <span className="sr-only">Loading search…</span>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchClient />
    </Suspense>
  );
}
