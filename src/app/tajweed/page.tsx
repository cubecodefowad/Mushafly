import type { Metadata } from "next";
import Link from "next/link";
import { TextMarks } from "@/components/tajweed/TextMarks";
import { TajweedRules } from "@/components/tajweed/TajweedRules";
import { ORTHOGRAPHIC_MARKS, SAJDAH_VERSES } from "@/data/text-marks";

export const metadata: Metadata = {
  title: "Tajweed and marks",
  description:
    "What each Tajweed highlight colour means, and what every symbol printed in the Quranic text asks the reader to do.",
};

export default function TajweedPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 pb-20 pt-12 sm:px-8 sm:pt-16">
      <p className="meta">Reference</p>
      <h1 className="display mt-3 text-4xl sm:text-5xl">Tajweed and marks</h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
        The reader colours letters by Tajweed rule and leaves the source&apos;s
        pause marks in place. This page explains every colour and every symbol,
        so nothing on the page is unexplained.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <a
          href="#highlights"
          className="rounded-xl border border-line bg-surface p-4 transition-colors hover:border-accent/40"
        >
          <span className="meta">Highlight colours</span>
          <span className="mt-1 block text-sm text-ink">
            Where to stop, hold and nasalise
          </span>
        </a>
        <a
          href="#signs"
          className="rounded-xl border border-line bg-surface p-4 transition-colors hover:border-accent/40"
        >
          <span className="meta">Signs in the text</span>
          <span className="mt-1 block text-sm text-ink">
            Pause marks, hizb dividers, prostration
          </span>
        </a>
      </div>

      <section id="highlights" aria-labelledby="highlights-title" className="mt-12 scroll-mt-24">
        <h2 id="highlights-title" className="display text-2xl">Highlights</h2>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
          <p>
            When <span className="text-ink">Tajweed</span> is on, letters that
            carry a rule are coloured and given a dotted underline in the same
            colour, so the marking does not rely on colour alone. The rule names
            below are interface aids for the annotation supplied with the text;
            the letters themselves are always the original source characters.
          </p>
        </div>

        <div className="mt-6 rounded-xl border border-line bg-surface p-5">
          <TajweedRules />
        </div>

        <p className="mt-4 text-xs leading-relaxed text-muted">
          Highlighting can be turned off at any time from the reader, or from{" "}
          <Link href="/settings/#tajweed" className="text-accent underline decoration-line underline-offset-2">
            Settings
          </Link>
          . Where the source annotation does not align with a verse, that verse is
          shown as plain text and labelled — the app does not guess.
        </p>
      </section>

      <section id="signs" aria-labelledby="signs-title" className="mt-12 scroll-mt-24">
        <h2 id="signs-title" className="display text-2xl">Signs in the text</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          These are printed characters in the Uthmani text, not interface
          buttons. They tell a reciter how to carry the sentence, divide the
          passage, or where to prostrate.
        </p>

        <div className="mt-6 rounded-xl border border-line bg-surface p-5">
          <TextMarks />
        </div>

        <p className="mt-4 text-xs leading-relaxed text-muted">
          Pause signs are guidance for recitation, and schools of recitation
          differ in detail; follow the teaching you are studying with.{" "}
          <Link
            href="/surah/7/#verse-206"
            className="text-accent underline decoration-line underline-offset-2"
          >
            Al-A&apos;raf 7:206
          </Link>{" "}
          is the prostration mark at the end of a surah — the last sign in the
          last verse.
        </p>
      </section>

      <section aria-labelledby="sajdah" className="mt-12">
        <h2 id="sajdah" className="display text-2xl">The fifteen prostration verses</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Each reference below ends with the prostration sign in this text.
        </p>
        <ul className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {SAJDAH_VERSES.map((entry) => (
            <li key={`${entry.surah}:${entry.verse}`}>
              <Link
                href={`/surah/${entry.surah}/#verse-${entry.verse}`}
                className="block rounded-lg border border-line bg-surface px-2 py-2 text-center text-xs text-muted transition-colors hover:border-accent/40 hover:text-ink"
              >
                {entry.surah}:{entry.verse}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="fine" className="mt-12">
        <h2 id="fine" className="display text-2xl">Small marks</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          The smallest signs belong to the spelling of the Uthmani text rather
          than to the pause system. They are not instructions to the reader.
        </p>
        <ul className="mt-5 space-y-3 rounded-xl border border-line bg-surface p-5">
          {ORTHOGRAPHIC_MARKS.map((mark) => (
            <li key={mark.name} className="flex items-start gap-4">
              <span
                aria-hidden="true"
                className="font-arabic w-10 shrink-0 text-center text-xl text-ink"
              >
                {mark.glyph}
              </span>
              <span>
                <span className="block text-sm text-ink">{mark.name}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                  {mark.detail}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="caveat" className="mt-12">
        <h2 id="caveat" className="display text-2xl">A note on certainty</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Meanings here follow the conventional Madani Mushaf reading. They are
          a reading aid, not a ruling: for worship and study, verify against a
          printed Mushaf and the teaching you follow. If a symbol is
          unexplained, or a highlight looks wrong, please write to{" "}
          <a
            href="mailto:hello@mushafly.com"
            className="text-accent underline decoration-line underline-offset-4"
          >
            hello@mushafly.com
          </a>
          .
        </p>
      </section>

      <nav aria-label="Related" className="mt-12 flex flex-wrap gap-3 border-t border-line pt-6">
        <Link href="/accuracy/" className="button-secondary">Accuracy and Sources</Link>
        <Link href="/about/" className="button-secondary">About Mushafly</Link>
        <Link href="/" className="button-secondary">Return to the surahs</Link>
      </nav>
    </div>
  );
}
