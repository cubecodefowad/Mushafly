import Link from "next/link";
import { sourceInfo } from "@/data/attribution";
import { RECITERS } from "@/data/reciters";
import { TANZIL_EXCLUDED, TANZIL_TRANSLATIONS } from "@/data/translations";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Terms of Service",
  description:
    "The terms for using Mushafly, and what the app does and does not claim about the text it displays.",
  path: "/terms/",
});

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 pb-20 pt-12 sm:px-8 sm:pt-16">
      <p className="meta">Legal</p>
      <h1 className="display mt-3 text-4xl sm:text-5xl">Terms of Service</h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
        These terms cover your use of Mushafly, a free Quran reading
        application. By using it you accept them. If you do not accept them,
        please do not use the application.
      </p>

      <p className="mt-6 text-xs text-muted">Effective 18 October 2026.</p>

      <section aria-labelledby="what" className="mt-12">
        <h2 id="what" className="display text-2xl">What Mushafly is</h2>
        <div className="mt-4 space-y-3 rounded-xl border border-line bg-surface p-5 text-sm leading-relaxed text-muted">
          <p>
            Mushafly displays Quranic text with translations in 29 languages,
            including English, Indonesian, Urdu and an Arabic commentary,
            source-derived Tajweed highlighting and verse-by-verse recitation.
            It is a reading tool. It is not a religious authority and it does not
            issue rulings, tafsir or religious guidance.
          </p>
          <p>
            The application is free. There is no subscription, no advertising and
            no account.
          </p>
        </div>
      </section>

      <section aria-labelledby="text" className="mt-10">
        <h2 id="text" className="display text-2xl">The text you read here</h2>
        <div className="mt-4 space-y-3 rounded-xl border border-line bg-surface p-5 text-sm leading-relaxed text-muted">
          <p>
            All Quranic content — Arabic text, surah metadata, the English and
            Indonesian translations, the Arabic commentary, Tajweed ranges and
            audio — is taken unmodified from a single pinned open dataset and
            its upstream sources, currently
            revision{" "}
            <code className="rounded bg-surface-muted px-1 py-0.5 text-[0.75rem]">
              {sourceInfo.commit.slice(0, 7)}
            </code>{" "}
            of{" "}
            <a
              className="underline decoration-line underline-offset-4 hover:text-ink"
              href={`${sourceInfo.repository}/tree/${sourceInfo.commit}`}
              target="_blank"
              rel="noreferrer"
            >
              {sourceInfo.repository.replace("https://github.com/", "")}
            </a>
            . Mushafly does not generate, rewrite, correct, normalize or fill in
            Quranic text, and it never substitutes machine-generated content for
            it.
          </p>
          <p>
            The dataset is a third-party work. Its translations and commentary
            are by{" "}
            {sourceInfo.translations
              .map((entry) => `${entry.translator} (${entry.id})`)
              .join(", ")}
            , and recitation is by Saad Al-Ghamadi (the pinned default) and the{" "}
            {RECITERS.length - 1} other editions streamed from everyayah.com. A
            further {TANZIL_TRANSLATIONS.length}{" "}
            translations come from{" "}
            <a
              className="underline decoration-line underline-offset-4 hover:text-ink"
              href="https://tanzil.net/trans/"
              target="_blank"
              rel="noreferrer"
            >
              Tanzil.net/trans
            </a>{" "}
            under Tanzil&apos;s non-commercial terms;{" "}
            {TANZIL_EXCLUDED.length} additional datasets were not integrated
            because their source contained empty verse records. These are
            separate works with their own terms; see{" "}
            <Link href="/settings/#attribution" className="underline decoration-line underline-offset-4">
              full attribution
            </Link>
            . Mushafly&apos;s own software is released under the MIT license.
          </p>
          <p>
            <span className="text-ink">For worship and study, always verify
            against a printed Mushaf.</span>{" "}
            Transcription, translation, Tajweed annotation and audio are
            human-made works and can contain errors. Where the dataset cannot be
            applied reliably, Mushafly shows the verse as plain text and says so
            instead of guessing. A clean build check means the app matches the
            pinned dataset; it is not a claim of textual authenticity. See{" "}
            <Link href="/accuracy/" className="underline decoration-line underline-offset-4 hover:text-ink">
              Accuracy and Sources
            </Link>{" "}
            for provenance and how to report a discrepancy.
          </p>
        </div>
      </section>

      <section aria-labelledby="use" className="mt-10">
        <h2 id="use" className="display text-2xl">Acceptable use</h2>
        <div className="mt-4 space-y-3 rounded-xl border border-line bg-surface p-5 text-sm leading-relaxed text-muted">
          <p>You may read, search, bookmark and share links to Mushafly, and you may redistribute the application under the terms of its license.</p>
          <p>You must not:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>present the translation, Tajweed annotation or audio as an authoritative Mushaf or as a religious ruling;</li>
            <li>modify Quranic text displayed by the application and present the result as Quran;</li>
            <li>use the application to harass, defame, or misrepresent the content or any person or group;</li>
            <li>interfere with the host&apos;s service, or use it in a way that is unlawful where you are.</li>
          </ul>
        </div>
      </section>

      <section aria-labelledby="data" className="mt-10">
        <h2 id="data" className="display text-2xl">Your data and availability</h2>
        <div className="mt-4 space-y-3 rounded-xl border border-line bg-surface p-5 text-sm leading-relaxed text-muted">
          <p>
            Bookmarks, reading position and preferences belong to you and are
            stored locally in your browser, as described in the{" "}
            <Link href="/privacy/" className="underline decoration-line underline-offset-4 hover:text-ink">
              Privacy Policy
            </Link>
            . Clearing site data removes them, and we cannot restore them because
            we never receive them.
          </p>
          <p>
            Audio is streamed from a third-party host and can be unavailable. The
            application is provided &quot;as is&quot;, without warranties of any
            kind, and access may be changed, interrupted or discontinued at any
            time.
          </p>
        </div>
      </section>

      <section aria-labelledby="liability" className="mt-10">
        <h2 id="liability" className="display text-2xl">Limitation of liability</h2>
        <div className="mt-4 space-y-3 rounded-xl border border-line bg-surface p-5 text-sm leading-relaxed text-muted">
          <p>
            To the fullest extent permitted by law, the authors and distributors
            of Mushafly are not liable for any loss arising from use of the
            application or reliance on the content it displays, including errors
            in a third-party dataset, unavailable audio, or data lost from your
            browser.
          </p>
          <p>
            Third-party content remains subject to its own licenses and terms,
            listed in the attribution panel in Settings and in the project&apos;s
            third-party notices.
          </p>
        </div>
      </section>

      <section aria-labelledby="changes" className="mt-10">
        <h2 id="changes" className="display text-2xl">Changes to these terms</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          These terms may be updated as the application changes; the effective
          date above will change with them. Continued use after an update means
          you accept the current version.
        </p>
      </section>

      <nav aria-label="Related" className="mt-12 flex flex-wrap gap-3 border-t border-line pt-6">
        <Link href="/accuracy/" className="button-secondary">Accuracy and Sources</Link>
        <Link href="/privacy/" className="button-secondary">Privacy Policy</Link>
        <Link href="/about/" className="button-secondary">About</Link>
      </nav>
    </div>
  );
}
