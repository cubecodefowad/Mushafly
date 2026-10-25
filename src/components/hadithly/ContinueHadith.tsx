"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen } from "lucide-react";
import { HADITHLY_STORAGE_KEYS, parseHadithProgress, readStorage } from "@/lib/storage";
import { formatCount, hadithSectionUrl } from "@/data/hadith-format";
import type { HadithProgress } from "@/types/hadith";

export function ContinueHadith() {
  const [progress, setProgress] = useState<HadithProgress | null>(null);

  useEffect(() => {
    setProgress(readStorage(HADITHLY_STORAGE_KEYS.progress, parseHadithProgress));
  }, []);

  if (!progress) return null;

  return (
    <Link
      href={`${hadithSectionUrl(progress.collection, progress.section)}#hadith-${progress.number}`}
      className="group mt-10 flex items-center gap-4 rounded-xl border border-line bg-surface p-5 transition-colors hover:border-accent/40"
    >
      <BookOpen size={18} strokeWidth={1.6} className="shrink-0 text-accent" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="meta block">Continue reading</span>
        <span className="mt-1 block truncate text-sm text-ink">
          {progress.collectionName ?? progress.collection}
          {progress.sectionName ? ` · ${progress.sectionName}` : ""}
        </span>
        <span className="mt-0.5 block text-xs text-muted">
          Back to hadith {formatCount(progress.number)}
        </span>
      </span>
      <ArrowRight
        size={16}
        strokeWidth={1.8}
        className="shrink-0 text-muted transition-colors group-hover:text-ink"
        aria-hidden
      />
    </Link>
  );
}
