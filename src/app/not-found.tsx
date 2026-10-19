import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The requested page is not part of Mushafly.",
};

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-28 text-center">
      <p className="meta">Not found</p>
      <h1 className="display mt-4 text-4xl">This page is not in the Book.</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        The address may be mistyped, or the surah number is outside 1–114. The
        Quran text itself is unchanged.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="button-primary">
          Browse the surahs
        </Link>
        <Link href="/search/" className="button-secondary">
          Search
        </Link>
      </div>
    </div>
  );
}
