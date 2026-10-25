import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { HadithReader } from "@/components/hadithly/HadithReader";
import {
  adjacentSections,
  formatCount,
  HADITH_COLLECTIONS,
  HADITHLY_SOURCE,
  hadithCollection,
  hadithRangeLabel,
  hadithSection,
  hadithSectionUrl,
} from "@/data/hadith";
import { pageMetadata } from "@/lib/metadata";

export const dynamicParams = false;

export function generateStaticParams() {
  return HADITH_COLLECTIONS.flatMap((collection) =>
    collection.sections.map((section) => ({
      collection: collection.id,
      section: String(section.number),
    })),
  );
}

type PageProps = {
  params: Promise<{ collection: string; section: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { collection: collectionId, section: sectionNumber } = await params;
  const collection = hadithCollection(collectionId);
  const section = collection ? hadithSection(collection, sectionNumber) : undefined;
  if (!collection || !section) {
    return { title: "Book not found", robots: { index: false, follow: false } };
  }
  return pageMetadata({
    title: `${section.name} — ${collection.name}`,
    description: `${formatCount(section.count)} hadiths from ${section.name} in ${collection.name} (${hadithRangeLabel(section)}), in Arabic with translations into ${collection.languages.length} languages.`,
    path: hadithSectionUrl(collection.id, section.number),
  });
}

export default async function HadithBookPage({ params }: PageProps) {
  const { collection: collectionId, section: sectionNumber } = await params;
  const collection = hadithCollection(collectionId);
  const section = collection ? hadithSection(collection, sectionNumber) : undefined;
  if (!collection || !section) notFound();

  const { prev, next } = adjacentSections(collection, section.number);

  return (
    <>
      <header className="reader-column pb-1 pt-8 sm:pt-12">
        <nav className="flex items-center justify-between gap-4 text-xs">
          <Link
            href="/hadithly/"
            className="inline-flex items-center gap-1.5 text-muted hover:text-ink"
          >
            <ArrowLeft size={14} strokeWidth={1.8} aria-hidden />
            Hadithly
          </Link>
          <Link
            href={collection.sections.length === 1 ? "/hadithly/" : `/hadithly/${collection.id}/`}
            className="inline-flex items-center gap-1.5 text-muted hover:text-ink"
          >
            {collection.name}
          </Link>
        </nav>

        <div className="mt-8 border-b border-line pb-6">
          <p className="meta">
            {collection.name} · Book {section.number}
          </p>
          <h1 className="display mt-3 text-[1.9rem] leading-[1.2] text-ink sm:text-[2.35rem]">
            {section.name}
          </h1>
          <p className="mt-2 text-xs text-muted">
            {hadithRangeLabel(section)} · {formatCount(section.count)}{" "}
            {section.count === 1 ? "hadith" : "hadiths"}
          </p>
        </div>
      </header>

      <HadithReader
        collection={collection.id}
        collectionName={collection.name}
        section={section.number}
        sectionName={section.name}
        total={section.count}
        languages={collection.languages}
      />

      <nav
        aria-label="Adjacent books"
        className="reader-column mt-12 grid gap-3 border-t border-line pt-8 sm:grid-cols-2"
      >
        {prev ? (
          <Link
            href={hadithSectionUrl(collection.id, prev.number)}
            className="group rounded-lg border border-line bg-surface p-4 transition-colors hover:border-accent/40"
          >
            <span className="flex items-center gap-1.5 text-[0.6875rem] text-muted">
              <ArrowLeft size={13} strokeWidth={1.8} aria-hidden />
              Previous book
            </span>
            <span className="mt-1.5 block text-sm font-medium text-ink group-hover:text-accent-strong">
              {prev.name}
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={hadithSectionUrl(collection.id, next.number)}
            className="group rounded-lg border border-line bg-surface p-4 text-right transition-colors hover:border-accent/40"
          >
            <span className="flex items-center justify-end gap-1.5 text-[0.6875rem] text-muted">
              Next book
              <ArrowRight size={13} strokeWidth={1.8} aria-hidden />
            </span>
            <span className="mt-1.5 block text-sm font-medium text-ink group-hover:text-accent-strong">
              {next.name}
            </span>
          </Link>
        ) : null}
      </nav>

      <div className="reader-column mt-10 border-t border-line pt-5 text-[0.6875rem] leading-relaxed text-muted">
        <p>
          Text: Arabic, English and the other translations published in the{" "}
          <a
            href={`${HADITHLY_SOURCE.repository}/tree/${HADITHLY_SOURCE.revision}`}
            className="underline decoration-line underline-offset-2 hover:text-ink"
            target="_blank"
            rel="noreferrer"
          >
            {HADITHLY_SOURCE.name}
          </a>{" "}
          at revision {HADITHLY_SOURCE.revision.slice(0, 7)} ({HADITHLY_SOURCE.license}).
        </p>
        <p className="mt-2">
          Gradings are the dataset&apos;s own and name the scholar who issued them. A hadith is not
          the Quran: translations of it are human work, and a grade is a scholar&apos;s judgement,
          not revelation. Read the{" "}
          <Link href="/accuracy/#hadithly" className="underline decoration-line underline-offset-2 hover:text-ink">
            sources note
          </Link>
          .
        </p>
      </div>
    </>
  );
}
