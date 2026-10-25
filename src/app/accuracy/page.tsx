import Link from "next/link";
import { AccuracyNotice } from "@/components/legal/AccuracyNotice";
import { sourceInfo } from "@/data/attribution";
import {
  formatCount,
  HADITHLY_LANGUAGES,
  HADITHLY_SOURCE,
  HADITHLY_TOTALS,
  HADITH_COLLECTIONS,
} from "@/data/hadith";
import { RECITERS } from "@/data/reciters";
import { TANZIL_EXCLUDED, TANZIL_TRANSLATIONS } from "@/data/translations";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Accuracy and Sources",
  description:
    "Where Mushafly's Quranic text, translation, Tajweed, recitation and hadith come from, and how to report a discrepancy.",
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
              Recitation: {RECITERS.length} editions, streamed one ayah per file.
              Saad Al-Ghamadi is the default and comes from the pinned dataset;
              the other editions are read from everyayah.com and are not copied
              into this build. Before an edition is offered, its folder is
              checked for all 6,236 ayah files. Arabic Hafs, the Warsh reading
              and translated recitations are listed separately because only the
              first matches the Arabic text this reader displays.
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

      <section aria-labelledby="hadithly" className="mt-10">
        <h2 id="hadithly" className="display text-2xl">Hadithly</h2>
        <div className="mt-4 space-y-3 rounded-xl border border-line bg-surface p-5 text-sm leading-relaxed text-muted">
          <p>
            Hadithly is a separate library on this site, not part of the Quran text. It holds{" "}
            {formatCount(HADITHLY_TOTALS.hadiths)} hadiths in{" "}
            {formatCount(HADITHLY_TOTALS.sections)} books across{" "}
            {HADITH_COLLECTIONS.length} collections, copied at build time from revision{" "}
            <code className="rounded bg-surface-muted px-1 py-0.5 text-[0.75rem]">
              {HADITHLY_SOURCE.revision.slice(0, 7)}
            </code>{" "}
            of the{" "}
            <a
              className="underline decoration-line underline-offset-4 hover:text-ink"
              href={`${HADITHLY_SOURCE.repository}/tree/${HADITHLY_SOURCE.revision}`}
              target="_blank"
              rel="noreferrer"
            >
              {HADITHLY_SOURCE.name}
            </a>{" "}
            datasets, which are released into the public domain. The Arabic comes from the
            edition&apos;s <span className="text-ink/80">ara-*</span> files, the English from its
            corresponding <span className="text-ink/80">eng-*</span> files, and every other
            translation from its own edition (<span className="text-ink/80">urd-*</span>,{" "}
            <span className="text-ink/80">tur-*</span>,{" "}
            <span className="text-ink/80">ben-*</span> and so on). None is generated, summarised or
            machine-translated here, and a language the datasets do not publish is never offered.
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              Books and their names are the dataset&apos;s own divisions. Hadithly does not regroup
              chapters, and a narration the dataset leaves outside a chapter is placed in the
              chapter whose published numbering contains it rather than in an invented one.
            </li>
            <li>
              The number beside a hadith is the collection&apos;s numbering as published. Where an
              edition also records a different Arabic numbering, it is kept and used for nothing
              else, so a citation always matches the dataset.
            </li>
            <li>
              Gradings such as <em>sahih</em>, <em>hasan</em> or <em>daif</em> are printed with the
              name of the scholar who issued them. They are human verdicts on a chain of
              transmission, not revelation, and scholars differ; Hadithly never issues its own.
            </li>
            <li>
              All {HADITHLY_TOTALS.languages} published translations are copied:{" "}
              {HADITHLY_LANGUAGES.map((language, index) => (
                <span key={language.code}>
                  {index > 0 ? (index === HADITHLY_LANGUAGES.length - 1 ? " and " : ", ") : ""}
                  {language.name} ({formatCount(language.hadiths)})
                </span>
              ))}
              , counting the narrations each edition actually translates. Coverage is uneven in the
              same way, so a collection is only offered in the languages published for it, and a
              narration with no text in the chosen language says so instead of falling back to
              another one.
            </li>
            <li>
              Every translation is a human work published in the dataset. A translation shows one
              rendering of a meaning, so the Arabic is always shown first, the language is named
              beside the text, and the translation can be switched off entirely.
            </li>
          </ul>
          <p>
            Fidelity here means matching the pinned dataset, not establishing authenticity. For
            study or worship, verify a narration against a printed edition and its published
            gradings.
          </p>
        </div>
      </section>

      <section aria-labelledby="report" className="mt-10">
        <h2 id="report" className="display text-2xl">Reporting a discrepancy</h2>
        <div className="mt-4 space-y-3 rounded-xl border border-line bg-surface p-5 text-sm leading-relaxed text-muted">
          <p>
            Please include the surah and verse number, or the hadith collection,
            book and number, along with what you see and what you expect. The more
            precisely a report points at the text, the faster it can be traced to
            the source record behind it.
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
