"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  LEGACY_STORAGE_KEYS,
  STORAGE_KEYS,
  createBookmarkId,
  parseBookmarks,
  parseLastRead,
  readStorage,
  removeStorage,
  writeStorage,
} from "@/lib/storage";
import type { BookmarkRecord, LastRead, VerseReference } from "@/types/quran";

type ReadingStateContextValue = {
  bookmarks: BookmarkRecord[];
  lastRead: LastRead | null;
  loaded: boolean;
  isBookmarked: (surahNumber: number, verseNumber: number) => boolean;
  bookmarkFor: (surahNumber: number, verseNumber: number) => BookmarkRecord | undefined;
  toggleBookmark: (reference: VerseReference, label?: string) => boolean;
  removeBookmark: (id: string) => void;
  updateBookmarkLabel: (id: string, label: string) => void;
  clearBookmarks: () => void;
  saveLastRead: (reference: VerseReference) => void;
  clearLastRead: () => void;
};

const ReadingStateContext = createContext<ReadingStateContextValue | null>(null);

export function ReadingStateProvider({ children }: { children: ReactNode }) {
  const [bookmarks, setBookmarks] = useState<BookmarkRecord[]>([]);
  const [lastRead, setLastRead] = useState<LastRead | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setBookmarks(
      readStorage(STORAGE_KEYS.bookmarks, parseBookmarks, LEGACY_STORAGE_KEYS.bookmarks) ?? [],
    );
    setLastRead(
      readStorage(STORAGE_KEYS.lastRead, parseLastRead, LEGACY_STORAGE_KEYS.lastRead),
    );
    setLoaded(true);

    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEYS.bookmarks) {
        if (!event.newValue) {
          setBookmarks([]);
          return;
        }
        try {
          setBookmarks(parseBookmarks(JSON.parse(event.newValue)));
        } catch {
          // Ignore malformed cross-tab state.
        }
      }
      if (event.key === STORAGE_KEYS.lastRead) {
        if (!event.newValue) {
          setLastRead(null);
          return;
        }
        try {
          setLastRead(parseLastRead(JSON.parse(event.newValue)));
        } catch {
          // Ignore malformed cross-tab state.
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    writeStorage(STORAGE_KEYS.bookmarks, bookmarks);
  }, [bookmarks, loaded]);

  useEffect(() => {
    if (!loaded || !lastRead) return;
    writeStorage(STORAGE_KEYS.lastRead, lastRead);
  }, [lastRead, loaded]);

  const isBookmarked = useCallback(
    (surahNumber: number, verseNumber: number) =>
      bookmarks.some(
        (bookmark) =>
          bookmark.reference.surahNumber === surahNumber &&
          bookmark.reference.verseNumber === verseNumber,
      ),
    [bookmarks],
  );

  const bookmarkFor = useCallback(
    (surahNumber: number, verseNumber: number) =>
      bookmarks.find(
        (bookmark) =>
          bookmark.reference.surahNumber === surahNumber &&
          bookmark.reference.verseNumber === verseNumber,
      ),
    [bookmarks],
  );

  const toggleBookmark = useCallback(
    (reference: VerseReference, label?: string) => {
      const existing = bookmarks.find(
        (bookmark) =>
          bookmark.reference.surahNumber === reference.surahNumber &&
          bookmark.reference.verseNumber === reference.verseNumber,
      );
      if (existing) {
        setBookmarks((current) => current.filter((bookmark) => bookmark.id !== existing.id));
        return false;
      }
      const next: BookmarkRecord = {
        id: createBookmarkId(),
        reference: { ...reference },
        createdAt: new Date().toISOString(),
        ...(label?.trim() ? { label: label.trim().slice(0, 120) } : {}),
      };
      setBookmarks((current) => [next, ...current]);
      return true;
    },
    [bookmarks],
  );

  const removeBookmark = useCallback((id: string) => {
    setBookmarks((current) => current.filter((bookmark) => bookmark.id !== id));
  }, []);

  const updateBookmarkLabel = useCallback((id: string, label: string) => {
    const trimmed = label.trim().slice(0, 120);
    setBookmarks((current) =>
      current.map((bookmark) =>
        bookmark.id === id
          ? {
              ...bookmark,
              ...(trimmed ? { label: trimmed } : { label: undefined }),
            }
          : bookmark,
      ),
    );
  }, []);

  const clearBookmarks = useCallback(() => {
    setBookmarks([]);
    removeStorage(STORAGE_KEYS.bookmarks);
  }, []);

  const saveLastRead = useCallback((reference: VerseReference) => {
    setLastRead((current) => {
      if (
        current &&
        current.reference.surahNumber === reference.surahNumber &&
        current.reference.verseNumber === reference.verseNumber
      ) {
        return current;
      }
      return { reference: { ...reference }, updatedAt: new Date().toISOString() };
    });
  }, []);

  const clearLastRead = useCallback(() => {
    setLastRead(null);
    removeStorage(STORAGE_KEYS.lastRead);
  }, []);

  const value = useMemo(
    () => ({
      bookmarks,
      lastRead,
      loaded,
      isBookmarked,
      bookmarkFor,
      toggleBookmark,
      removeBookmark,
      updateBookmarkLabel,
      clearBookmarks,
      saveLastRead,
      clearLastRead,
    }),
    [
      bookmarks,
      lastRead,
      loaded,
      isBookmarked,
      bookmarkFor,
      toggleBookmark,
      removeBookmark,
      updateBookmarkLabel,
      clearBookmarks,
      saveLastRead,
      clearLastRead,
    ],
  );

  return <ReadingStateContext.Provider value={value}>{children}</ReadingStateContext.Provider>;
}

export function useReadingState(): ReadingStateContextValue {
  const context = useContext(ReadingStateContext);
  if (!context) throw new Error("useReadingState must be used inside ReadingStateProvider");
  return context;
}
