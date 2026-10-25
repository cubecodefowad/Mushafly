import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SectionDirectory } from "@/components/hadithly/SectionDirectory";
import {
  formatCount,
  HADITH_COLLECTIONS,
  HADITHLY_SOURCE,
  hadithCollection,
} from "@/data/hadith";
import { pageMetadata } from "@/lib/metadata";

export const dynamicParams = false;

export function generateStaticParams() {
  return HADITH_COLLECTIONS.map((collection) => ({ collection: collection.id }));
}

type PageProps = {
  params: Promise<{ collection: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { collection: id } = await params;
  const collection = hadithCollection(id);
  if (!collection) {
    return { title: "Collection not found", robots: { index: false, follow: false } };
  }
  return pageMetadata({
    title: `${collection.name} — Hadithly`,
    description: `${collection.name} (${collection.arabicName}) by ${collection.author}: ${formatCount(collection.hadiths)} hadiths in ${collection.sections.length} books, in Arabic with translations into ${collection.languages.length} languages.`,
    path: `/hadithly/${collection.id}/`,
  });
}

export default async function CollectionPage({ params }: PageProps) {
  const { collection: id } = await params;
  const collection = hadithCollection(id);
  if (!collection) notFound();

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-8">
      <nav className="flex items-center justify-between gap-4 pt-8 text-xs sm:pt-12">
        <Link href="/hadithly/" className="inline-flex items-center gap-1.5 text-muted hover:text-ink">
          <ArrowLeft size={14} strokeWidth={1.8} aria-hidden />
          Hadithly
        </Link>
        <Link href="/hadithly/" className="text-muted hover:text-ink">
          All collections
        </Link>
      </nav>

      <header className="mt-8 text-center sm:mt-10">
        <p className="meta">
          {collection.author}
          {collection.died ? ` · ${collection.died}` : ""}
        </p>
        <h1
          lang="ar"
          dir="rtl"
          className="font-arabic mt-4 text-[2.5rem] leading-[1.35] text-ink sm:text-[3rem]"
        >
          {collection.arabicName}
        </h1>
        <p className="display mt-1 text-2xl text-ink/90 sm:text-[1.8rem]">{collection.name}</p>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted">{collection.blurb}</p>
        <p className="mt-3 text-xs text-muted">
          {formatCount(collection.hadiths)} hadiths · {collection.sections.length}{" "}
          {collection.sections.length === 1 ? "book" : "books"}
        </p>
        <p className="mt-1 text-xs text-muted">
          Translations: {collection.languages.map((language) => language.name).join(", ")}
        </p>
        <div className="ornament mt-6" aria-hidden="true">
          <span className="ornament-diamond" />
        </div>
      </header>

      <SectionDirectory collectionId={collection.id} sections={collection.sections} />

      <p className="mt-12 border-t border-line pt-5 text-[0.6875rem] leading-relaxed text-muted">
        Arabic and its translations from{" "}
        <a
          href={`${HADITHLY_SOURCE.repository}/tree/${HADITHLY_SOURCE.revision}`}
          className="underline decoration-line underline-offset-2 hover:text-ink"
          target="_blank"
          rel="noreferrer"
        >
          {HADITHLY_SOURCE.name}
        </a>{" "}
        at revision {HADITHLY_SOURCE.revision.slice(0, 7)}. Book divisions and their names are the
        dataset&apos;s own, not an editorial regrouping.
      </p>
    </div>
  );
}
