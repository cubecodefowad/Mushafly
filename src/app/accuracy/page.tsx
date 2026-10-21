import Link from "next/link";
import { AccuracyNotice } from "@/components/legal/AccuracyNotice";
import { sourceInfo } from "@/data/attribution";
import { RECITERS } from "@/data/reciters";
import { TANZIL_EXCLUDED, TANZIL_TRANSLATIONS } from "@/data/translations";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Accuracy and Sources",
  description:
    "Where Mushafly's Quranic text, translation, Tajweed and recitation come from, and how to report a discrepancy.",
  path: "/accuracy/",
});

export default function AccuracyPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 pb-20 pt-12 sm:px-8 sm:pt-16">
      <p className="meta">About</p>
      <h1 className="display mt-3 text-4xl sm:text-5xl">Accuracy and Sources</h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
        Mushafly displays text it did not write. This page states where every
        part of it comes from, what has been checked, and what to do if
        something looks wrong.
      </p>

      <div className="mt-10 rounded-xl border border-line bg-surface p-5">
        <AccuracyNotice showHeading={false} />
      </div>

      <section aria-labelledby="provenance" className="mt-10">
        <h2 id="provenance" className="display text-2xl">Exactly what is pinned</h2>
        <div className="mt-4 space-y-3 rounded-xl border border-line bg-surface p-5 text-sm leading-relaxed text-muted">
          <p>
            Every surah page is generated at build time from revision{" "}
            <code className="rounded bg-surface-muted px-1 py-0.5 text-[0.75rem]">
              {sourceInfo.commit.slice(0, 7)}
            </code>{" "}
            of the{" "}
            <a
              className="underline decoration-line underline-offset-4 hover:text-ink"
              href={`${sourceInfo.repository}/tree/${sourceInfo.commit}`}
              target="_blank"
              rel="noreferrer"
            >
              QuranJSON dataset
            </a>
            . Nothing is fetched from a Quran API at runtime and no text is
            rewritten, normalised or filled in by the application.
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Arabic text and surah metadata: the dataset&apos;s verse records.</li>
            {sourceInfo.translations.map((translation) => (
              <li key={translation.languageCode}>
                {translation.languageCode === "ar"
                  ? "Arabic commentary"
                  : `${translation.label} translation`}
                : {translation.translator} — {translation.name} ({translation.id},{" "}
                {translation.source}).
              </li>
            ))}
            <li>
              {TANZIL_TRANSLATIONS.length} translations from{" "}
              <a
                className="underline decoration-line underline-offset-4 hover:text-ink"
                href="https://tanzil.net/trans/"
                target="_blank"
                rel="noreferrer"
              >
                Tanzil.net/trans
              </a>
              , converted from Tanzil XML without rewriting their text.{" "}
              {TANZIL_EXCLUDED.length > 0
                ? `${TANZIL_EXCLUDED.length} further Tanzil datasets were not integrated because their source has empty verse records (${TANZIL_EXCLUDED.map((entry) => `${entry.id}: ${entry.emptyVerses.join(", ")}`).join("; ")}).`
                : ""}
            </li>
            <li>
              Tajweed highlighting: the dataset&apos;s annotated ranges, applied to
              the characters they describe.
            </li>
            <li>
              Recitation: {RECITERS.map((reciter) => `${reciter.name} (${reciter.source})`).join(" or ")}
              , streamed one ayah per file. The default comes from the pinned
              dataset; the other reciters are read from everyayah.com and are not
              copied into this build.
            </li>
          </ul>
          <p>
            A build fails if the pinned data is malformed or if any surah is
            missing verses, so a published copy always matches the records it
            was built from. That is a guarantee about fidelity to the source, not
            a claim of textual authenticity — for worship and study, always
            verify against a printed Mushaf.
          </p>
        </div>
      </section>

      <section aria-labelledby="report" className="mt-10">
        <h2 id="report" className="display text-2xl">Reporting a discrepancy</h2>
        <div className="mt-4 space-y-3 rounded-xl border border-line bg-surface p-5 text-sm leading-relaxed text-muted">
          <p>
            Please include the surah and verse number, what you see, and what you
            expect. The more precisely a report points at the text, the faster it
            can be traced to the source record behind it.
          </p>
          <p>
            Email{" "}
            <a
              href="mailto:hello@mushafly.com"
              className="text-accent underline decoration-line underline-offset-4"
            >
              hello@mushafly.com
            </a>{" "}
            with the surah and verse. Reports are checked against the pinned
            source record; the{" "}
            <Link
              href="/about/#contact"
              className="underline decoration-line underline-offset-4 hover:text-ink"
            >
              contact section
            </Link>{" "}
            explains what reaches us that way.
          </p>
        </div>
      </section>

      <nav aria-label="Related" className="mt-12 flex flex-wrap gap-3 border-t border-line pt-6">
        <Link href="/about/" className="button-secondary">About Mushafly</Link>
        <Link href="/terms/" className="button-secondary">Terms of Service</Link>
        <Link href="/privacy/" className="button-secondary">Privacy Policy</Link>
      </nav>
    </div>
  );
}
