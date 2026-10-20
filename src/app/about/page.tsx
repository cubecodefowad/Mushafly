import Link from "next/link";
import { AccuracyNotice } from "@/components/legal/AccuracyNotice";
import { sourceInfo } from "@/data/attribution";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "About",
  description:
    "What Mushafly is, how it is built, what it stores, where its text comes from and how to report a problem.",
  path: "/about/",
});

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 pb-20 pt-12 sm:px-8 sm:pt-16">
      <p className="meta">About</p>
      <h1 className="display mt-3 text-4xl sm:text-5xl">About Mushafly</h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
        A quiet place to read the Quran: all 114 surahs in Arabic with 68
        translations across 29 languages, an Arabic commentary, source-derived
        Tajweed and verse-by-verse recitation, with nothing between you and the
        page.
      </p>

      <section aria-labelledby="what" className="mt-12">
        <h2 id="what" className="display text-2xl">What it is</h2>
        <div className="mt-4 space-y-3 rounded-xl border border-line bg-surface p-5 text-sm leading-relaxed text-muted">
          <p>
            Mushafly is a reading tool. It displays the Quranic text, 68
            translation datasets and an Arabic commentary, Tajweed highlighting
            and recitation; it is not a religious authority and it does not issue
            rulings or guidance. Where the source data cannot be applied reliably,
            a verse is shown as plain text rather than guessed at.
          </p>
          <p>
            The application is free. There is no account, no subscription and no
            advertising. Page views are counted anonymously and without cookies —
            the only measurement the app makes, described in full in the{" "}
            <Link href="/privacy/" className="underline decoration-line underline-offset-4 hover:text-ink">
              Privacy Policy
            </Link>
            , alongside the exact storage keys and the network requests the app
            can make.
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
            Corrections and reports are welcome, and email is the fastest way to
            reach us:{" "}
            <a
              className="text-accent underline decoration-line underline-offset-4"
              href="mailto:hello@mushafly.com"
            >
              hello@mushafly.com
            </a>
            .
          </p>
          <p>
            For a discrepancy in the Arabic text, the translation, the Tajweed
            annotation or the recitation, include the surah and verse, what you
            see and what you expect. Reports are checked against the pinned
            source record and passed upstream where the dataset itself is at
            fault. The same address reaches the people who build Mushafly for
            anything about how the app displays, searches or plays the content —
            see{" "}
            <Link href="/accuracy/" className="underline decoration-line underline-offset-4 hover:text-ink">
              Accuracy and Sources
            </Link>
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
