"use client";

import { Bookmark } from "lucide-react";
import { useReadingState } from "@/components/bookmarks/ReadingStateProvider";
import type { VerseReference } from "@/types/quran";

type Props = {
  reference: VerseReference;
  onToggled?: (added: boolean) => void;
};

export function BookmarkButton({ reference, onToggled }: Props) {
  const { isBookmarked, toggleBookmark, loaded } = useReadingState();
  const bookmarked = isBookmarked(reference.surahNumber, reference.verseNumber);

  return (
    <button
      type="button"
      className="icon-button"
      aria-pressed={bookmarked}
      aria-label={
        bookmarked
          ? `Remove bookmark for verse ${reference.verseNumber}`
          : `Bookmark verse ${reference.verseNumber}`
      }
      title={bookmarked ? "Remove bookmark" : "Bookmark verse"}
      disabled={!loaded}
      onClick={() => {
        if (!loaded) return;
        const added = toggleBookmark(reference);
        onToggled?.(added);
      }}
    >
      <Bookmark
        size={16}
        strokeWidth={1.8}
        fill={bookmarked ? "currentColor" : "none"}
        aria-hidden
      />
    </button>
  );
}
