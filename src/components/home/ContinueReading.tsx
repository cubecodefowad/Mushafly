"use client";

import Link from "next/link";
import { ArrowRight, Bookmark, BookOpen } from "lucide-react";
import { useReadingState } from "@/components/bookmarks/ReadingStateProvider";
import surahMeta from "@/data/generated/surah-meta.json";

export function ContinueReading() {
  const { lastRead, bookmarks, loaded } = useReadingState();

  if (!loaded) {
    return (
      <div className="rounded-xl border border-line bg-surface p-6">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton mt-4 h-7 w-40" />
        <div className="skeleton mt-3 h-3 w-28" />
        <div className="skeleton mt-6 h-9 w-36" />
      </div>
    );
  }

  if (!lastRead) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-line bg-surface p-6 sm:p-7">
        <div className="absolute inset-y-0 right-0 w-24 paper-grain opacity-40" aria-hidden />
        <p className="meta">Begin here</p>
        <h2 className="display mt-3 text-2xl">Al-Fatiha</h2>
        <p className="mt-1 text-sm text-muted">
          Seven verses to open the Book. Your place will be remembered as you
          read.
        </p>
        <Link href="/surah/1/" className="button-primary mt-6">
          <BookOpen size={16} strokeWidth={1.8} aria-hidden />
          Start reading
        </Link>
        <p className="mt-4 flex items-center gap-2 text-xs text-muted">
          <Bookmark size={13} strokeWidth={1.8} aria-hidden />
          No account needed. Bookmarks stay on this device.
        </p>
      </div>
    );
  }

  const meta = (surahMeta as Array<{ number: number; name: string; arabicName: string }>)[
    lastRead.reference.surahNumber - 1
  ];
  const readCount = bookmarks.length;

  return (
    <div className="animate-fade-up rounded-xl border border-line bg-surface p-6 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="meta">Continue reading</p>
          <h2 className="display mt-3 text-2xl">{meta?.name ?? "The Quran"}</h2>
          <p className="mt-1 text-sm text-muted">
            Surah {lastRead.reference.surahNumber} · Verse {lastRead.reference.verseNumber}
          </p>
        </div>
        <span
          className="font-arabic pt-1 text-3xl text-accent"
          lang="ar"
          dir="rtl"
          aria-hidden="true"
        >
          {meta?.arabicName}
        </span>
      </div>
      <Link
        href={`/surah/${lastRead.reference.surahNumber}/#verse-${lastRead.reference.verseNumber}`}
        className="button-primary mt-6"
      >
        Resume reading
        <ArrowRight size={15} strokeWidth={1.8} aria-hidden />
      </Link>
      <div className="mt-5 flex items-center justify-between border-t border-line pt-4 text-xs text-muted">
        <span>
          {readCount === 0
            ? "No bookmarks yet"
            : `${readCount} bookmark${readCount === 1 ? "" : "s"}`}
        </span>
        <Link href="/bookmarks/" className="text-accent hover:text-accent-strong">
          View bookmarks
        </Link>
      </div>
    </div>
  );
}
