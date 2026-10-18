import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { SurahView } from "@/types/quran";

export function SurahHeader({ surah }: { surah: SurahView }) {
  return (
    <header className="reader-column pb-2 pt-8 sm:pt-12">
      <div className="flex items-center justify-between gap-4 text-xs">
        <Link href="/" className="inline-flex items-center gap-1.5 text-muted hover:text-ink">
          <ArrowLeft size={14} strokeWidth={1.8} aria-hidden />
          All surahs
        </Link>
        <div className="flex items-center gap-4 text-muted">
          {surah.prev ? (
            <Link
              href={`/surah/${surah.prev.number}/`}
              className="inline-flex items-center gap-1 hover:text-ink"
              aria-label={`Previous surah: ${surah.prev.name}`}
            >
              <ArrowLeft size={14} strokeWidth={1.8} aria-hidden />
              <span className="hidden sm:inline">{surah.prev.name}</span>
              <span className="sm:hidden">Prev</span>
            </Link>
          ) : null}
          {surah.next ? (
            <Link
              href={`/surah/${surah.next.number}/`}
              className="inline-flex items-center gap-1 hover:text-ink"
              aria-label={`Next surah: ${surah.next.name}`}
            >
              <span className="hidden sm:inline">{surah.next.name}</span>
              <span className="sm:hidden">Next</span>
              <ArrowRight size={14} strokeWidth={1.8} aria-hidden />
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mt-10 text-center sm:mt-14">
        <p className="meta">
          Surah {surah.meta.number} · {surah.meta.verseCount} verses
        </p>
        <h1
          lang="ar"
          dir="rtl"
          className="font-arabic mt-5 text-[2.9rem] leading-[1.4] text-ink sm:text-[3.6rem]"
        >
          {surah.meta.arabicName}
        </h1>
        <p className="display mt-1 text-2xl text-ink/90 sm:text-[1.8rem]">{surah.meta.name}</p>
        <p className="mt-3 text-xs text-muted">
          {surah.meta.place} · {surah.meta.type}
        </p>
        <div className="ornament mt-7" aria-hidden="true">
          <span className="ornament-diamond" />
        </div>
      </div>
    </header>
  );
}
