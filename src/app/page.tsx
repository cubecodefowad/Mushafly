import Link from "next/link";
import { ArrowRight, Bookmark, Search } from "lucide-react";
import { BrandMark } from "@/components/layout/BrandMark";
import { ContinueReading } from "@/components/home/ContinueReading";
import { SurahDirectory } from "@/components/home/SurahDirectory";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8">
      <section className="grid gap-10 pb-4 pt-14 sm:pt-20 lg:grid-cols-[1.25fr_0.75fr] lg:gap-16">
        <div>
          <div className="flex items-center gap-3">
            <BrandMark className="h-6 w-6" />
            <p className="meta">Mushafly</p>
          </div>
          <h1 className="display mt-6 max-w-xl text-[2.65rem] leading-[1.08] tracking-[-0.025em] sm:text-[3.5rem]">
            A quiet place to read the Quran.
          </h1>
          <p className="mt-5 max-w-lg text-[0.9375rem] leading-relaxed text-muted">
            All 114 surahs in Arabic, with the Itani English translation,
            source-derived Tajweed, and verse-by-verse recitation. Read slowly.
            Your place is kept privately on this device.
          </p>

          <form action="/search/" method="get" role="search" className="mt-8 flex max-w-lg gap-2">
            <label className="relative block flex-1">
              <span className="sr-only">Search Arabic or English</span>
              <Search
                size={16}
                strokeWidth={1.8}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
                aria-hidden
              />
              <input
                type="search"
                name="q"
                placeholder="Search Arabic or English…"
                className="input h-12 pl-10"
                autoComplete="off"
              />
            </label>
            <button type="submit" className="button-primary h-12 px-5" aria-label="Search">
              <span className="hidden sm:inline">Search</span>
              <ArrowRight size={16} strokeWidth={1.8} className="sm:hidden" aria-hidden />
            </button>
          </form>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
            <Link href="/bookmarks/" className="inline-flex items-center gap-1.5 hover:text-ink">
              <Bookmark size={13} strokeWidth={1.8} aria-hidden />
              Bookmarks
            </Link>
            <span aria-hidden>·</span>
            <span>114 surahs · 6,236 verses</span>
            <span aria-hidden>·</span>
            <span>Light &amp; dark</span>
          </div>
        </div>

        <div className="lg:pt-8">
          <ContinueReading />
        </div>
      </section>

      <SurahDirectory />
    </div>
  );
}
