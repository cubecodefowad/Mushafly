import { BookmarksClient } from "@/components/bookmarks/BookmarksClient";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Bookmarks",
  description: "Your saved Quran verses, stored only in this browser.",
  path: "/bookmarks/",
  noIndex: true,
});

export default function BookmarksPage() {
  return <BookmarksClient />;
}
