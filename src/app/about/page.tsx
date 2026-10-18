import type { Metadata } from "next";
import Link from "next/link";
import { AccuracyNotice } from "@/components/legal/AccuracyNotice";
import { sourceInfo } from "@/data/attribution";

export const metadata: Metadata = {
  title: "About",
  description:
    "What Mushafly is, how it is built, what it stores, where its text comes from and how to report a problem.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 pb-20 pt-12 sm:px-8 sm:pt-16">
      <p className="meta">About</p>
      <h1 className="display mt-3 text-4xl sm:text-5xl">About Mushafly</h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
        A quiet place to read the Quran: all 114 surahs in Arabic, an English
        translation, source-derived Tajweed and verse-by-verse recitation, with
        nothing between you and the page.
      </p>

      <section aria-labelledby="what" className="mt-12">
        <h2 id="what" className="display text-2xl">What it is</h2>
        <div className="mt-4 space-y-3 rounded-xl border border-line bg-surface p-5 text-sm leading-relaxed text-muted">
          <p>
            Mushafly is a reading tool. It displays the Quranic text, a
            translation, Tajweed highlighting and recitation; it is not a
            religious authority and it does not issue rulings, tafsir or
            guidance. Where the source data cannot be applied reliably, a verse
            is shown as plain text rather than guessed at.
          </p>
          <p>
            The application is free. There is no account, no subscription, no
            advertising and no analytics. Bookmarks, your last-read position and
            reading preferences stay in your browser — see the{" "}
            <Link href="/privacy/" className="underline decoration-line underline-offset-4 hover:text-ink">
              Privacy Policy
            </Link>{" "}
            for the exact keys and the one third-party request the app can make.
          </p>
        </div>
      </section>

      <section aria-labelledby="built" className="mt-10">
        <h2 id="built" className="display text-2xl">How it is built</h2>
        <div className="mt-4 space-y-3 rounded-xl border border-line bg-surface p-5 text-sm leading-relaxed text-muted">
          <p>
            Mushafly is a static site. Every surah is prerendered from a pinned
            revision of the{" "}
            <a
              className="underline decoration-line underline-offset-4 hover:text-ink"
              href={`${sourceInfo.repository}/tree/${sourceInfo.commit}`}
              target="_blank"
              rel="noreferrer"
            >
              QuranJSON dataset
            </a>{" "}
            at build time, so reading and search work without a backend and
            without a Quran API. The search index is fetched only once you type a
            query.
          </p>
          <p>
            The software is open source under the MIT license; the Quranic
            content, translation and recitation remain third-party works under
            their own terms, listed in Settings under{" "}
            <Link href="/settings/#attribution" className="underline decoration-line underline-offset-4 hover:text-ink">
              attribution
            </Link>
            .
          </p>
        </div>
      </section>

      <div className="mt-10 rounded-xl border border-line bg-surface p-5">
        <AccuracyNotice />
      </div>

      <section aria-labelledby="contact" className="mt-10 scroll-mt-24">
        <h2 id="contact" className="display text-2xl">Contact</h2>
        <div className="mt-4 space-y-3 rounded-xl border border-line bg-surface p-5 text-sm leading-relaxed text-muted">
          <p>
            Corrections and reports are welcome. For a discrepancy in the Arabic
            text, the translation, the Tajweed ranges or the recitation audio,
            open an issue on the dataset that supplies them:{" "}
            <a
              className="underline decoration-line underline-offset-4 hover:text-ink"
              href={`${sourceInfo.repository}/issues`}
              target="_blank"
              rel="noreferrer"
            >
              {sourceInfo.repository.replace("https://github.com/", "")}
            </a>
            . Mention the surah and verse so it can be traced to the source
            record.
          </p>
          <p>
            For anything about how Mushafly itself displays, searches or plays
            the content — layout, broken links, unreadable text, playback
            problems — describe it at{" "}
            <Link href="/accuracy/" className="underline decoration-line underline-offset-4 hover:text-ink">
              Accuracy and Sources
            </Link>{" "}
            or through the project&apos;s issue tracker:{" "}
            <a
              className="underline decoration-line underline-offset-4 hover:text-ink"
              href="https://github.com/cubecodefowad/Mushafly/issues"
              target="_blank"
              rel="noreferrer"
            >
              cubecodefowad/Mushafly
            </a>
            .
          </p>
        </div>
      </section>

      <nav aria-label="Related" className="mt-12 flex flex-wrap gap-3 border-t border-line pt-6">
        <Link href="/accuracy/" className="button-secondary">Accuracy and Sources</Link>
        <Link href="/terms/" className="button-secondary">Terms of Service</Link>
        <Link href="/privacy/" className="button-secondary">Privacy Policy</Link>
      </nav>
    </div>
  );
}
