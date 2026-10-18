import type { Metadata } from "next";
import { BookmarksClient } from "@/components/bookmarks/BookmarksClient";

export const metadata: Metadata = {
  title: "Bookmarks",
  description: "Your saved Quran verses, stored only in this browser.",
};

export default function BookmarksPage() {
  return <BookmarksClient />;
}
