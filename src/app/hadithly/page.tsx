import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Library, Search } from "lucide-react";
import { ContinueHadith } from "@/components/hadithly/ContinueHadith";
import {
  formatCount,
  HADITHLY_GROUPS,
  HADITHLY_LANGUAGES,
  HADITHLY_SOURCE,
  HADITHLY_TOTALS,
  HADITH_COLLECTIONS,
} from "@/data/hadith";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Hadithly — hadith, read beside the Quran",
  description:
    "Read the Six Books, the Muwatta and three collections of forty narrations in Arabic, with the published translations in eight languages and each scholar's grading beside the text.",
  path: "/hadithly/",
});

export default function HadithlyPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8">
      <nav className="flex items-center justify-between gap-4 pt-8 text-xs sm:pt-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-muted hover:text-ink"
        >
          <ArrowLeft size={14} strokeWidth={1.8} aria-hidden />
          Mushafly · the Quran
        </Link>
        <Link
          href="/hadithly/search/"
          className="inline-flex items-center gap-1.5 text-muted hover:text-ink"
        >
          <Search size={13} strokeWidth={1.8} aria-hidden />
          Search the hadiths
        </Link>
      </nav>

      <header className="max-w-2xl pb-2 pt-10 sm:pt-14">
        <div className="flex items-center gap-3">
          <Library size={18} strokeWidth={1.6} className="text-accent" aria-hidden />
          <p className="meta">Hadithly</p>
        </div>
        <h1 className="display mt-6 text-[2.45rem] leading-[1.08] tracking-[-0.02em] sm:text-[3.1rem]">
          The sayings, kept beside the Quran.
        </h1>
        <p className="mt-5 text-[0.9375rem] leading-relaxed text-muted">
          Ten collections in Arabic, each with the translations the dataset publishes: the Six
          Books, the Muwatta, and three sets of forty narrations.{" "}
          {formatCount(HADITHLY_TOTALS.hadiths)} hadiths across{" "}
          {formatCount(HADITHLY_TOTALS.sections)} books, read from this device.
        </p>
        <p className="mt-3 text-xs text-muted">
          {HADITHLY_TOTALS.languages} translations from the {HADITHLY_SOURCE.name} datasets ·{" "}
          {HADITHLY_SOURCE.license.split(" (")[0]} · no account
        </p>

        <ul
          aria-label="Translations available"
          className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-2 text-[0.6875rem] text-muted"
        >
          {HADITHLY_LANGUAGES.map((language) => (
            <li key={language.code} className="inline-flex items-baseline gap-1.5">
              <span className="text-ink/80">{language.name}</span>
              {language.native !== language.name ? (
                <span
                  lang={language.code}
                  className={
                    language.direction === "rtl" ? "font-arabic text-[0.8rem]" : undefined
                  }
                >
                  {language.native}
                </span>
              ) : null}
              <span className="tabular-nums">{formatCount(language.hadiths)}</span>
              <span className="sr-only">hadiths</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[0.6875rem] text-muted">
          The number is how many narrations carry that translation. Not every collection was
          translated into every language, and the reader says so where it stops.
        </p>
      </header>

      <ContinueHadith />

      {HADITHLY_GROUPS.map((group) => {
        const collections = HADITH_COLLECTIONS.filter((collection) => collection.group === group.id);
        return (
          <section key={group.id} aria-labelledby={`hadithly-${group.id}`} className="mt-14">
            <div className="flex flex-col gap-2 border-b border-line pb-4 sm:flex-row sm:items-end sm:justify-between">
              <h2 id={`hadithly-${group.id}`} className="display text-2xl">
                {group.title}
              </h2>
              <p className="max-w-sm text-xs text-muted">{group.description}</p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {collections.map((collection) => (
                <Link key={collection.id} href={collection.href} className="collection-card group">
                  <div>
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-[0.9375rem] font-medium text-ink group-hover:text-accent-strong">
                        {collection.name}
                      </p>
                      <span
                        lang="ar"
                        dir="rtl"
                        className="font-arabic shrink-0 text-[1.2rem] leading-tight text-ink/80"
                      >
                        {collection.arabicName}
                      </span>
                    </div>
                    <p className="mt-1 text-[0.6875rem] text-muted">
                      {collection.author}
                      {collection.died ? ` · ${collection.died}` : ""}
                    </p>

                    <p className="mt-4 text-xs leading-relaxed text-muted">{collection.blurb}</p>
                  </div>

                  <p className="mt-4 flex items-center justify-between text-[0.6875rem] text-muted">
                    <span>
                      {`${formatCount(collection.hadiths)} hadiths · ${
                        collection.sections.length
                      } ${collection.sections.length === 1 ? "book" : "books"}`}
                    </span>
                    <ArrowRight
                      size={14}
                      strokeWidth={1.8}
                      className="text-muted transition-colors group-hover:text-accent"
                      aria-hidden
                    />
                  </p>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      <section className="mt-16 max-w-2xl border-t border-line pt-8" aria-labelledby="hadithly-reading">
        <h2 id="hadithly-reading" className="display text-xl">
          How this reads
        </h2>
        <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
          <li>
            Each narration shows the Arabic first, then the published translation. The picker above
            the text offers every language the dataset has for that collection, and the translation
            button turns it off when you want only the Arabic.
          </li>
          <li>
            Coverage is uneven. A collection that was never translated into the language you picked
            says so, and a narration with no text in it shows the Arabic alone — never a silent
            fallback to English.
          </li>
          <li>
            Gradings are printed exactly as the dataset records them, with the scholar named on
            every chip, so you can see who judged a report authentic or weak. Hadithly does not
            grade narrations itself.
          </li>
          <li>
            Nothing is rewritten, abridged or paraphrased. Where an edition has no text in the
            chosen language, or no grading at all, the page says so instead of filling the gap.
          </li>
          <li>
            Your place is remembered on this device only, in the same private storage as your Quran
            bookmarks. There is no account and no server.
          </li>
        </ul>

        <p className="mt-6 text-xs leading-relaxed text-muted">
          Source:{" "}
          <a
            className="underline decoration-line underline-offset-2 hover:text-ink"
            href={`${HADITHLY_SOURCE.repository}/tree/${HADITHLY_SOURCE.revision}`}
            target="_blank"
            rel="noreferrer"
          >
            {HADITHLY_SOURCE.name}
          </a>{" "}
          at revision {HADITHLY_SOURCE.revision.slice(0, 7)} ({HADITHLY_SOURCE.license}). The
          Arabic comes from the <span className="text-ink/80">ara-*</span> editions and each
          translation from its own <span className="text-ink/80">bn-*</span>,{" "}
          <span className="text-ink/80">eng-*</span>,{" "}
          <span className="text-ink/80">fr-*</span> and so on, all pinned and copied here at build
          time. Open the{" "}
          <Link
            href="/accuracy/#hadithly"
            className="underline decoration-line underline-offset-2 hover:text-ink"
          >
            sources note
          </Link>{" "}
          for what that does and does not guarantee.
        </p>
      </section>
    </div>
  );
}
