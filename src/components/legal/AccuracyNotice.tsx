import Link from "next/link";

/**
 * The accuracy disclaimer, written once so the wording on the dedicated page,
 * the About page and the reader footer cannot drift apart. `compact` changes
 * the typography only, never the text.
 */
export function AccuracyNotice({
  compact = false,
  showHeading = true,
  className = "",
}: {
  compact?: boolean;
  showHeading?: boolean;
  className?: string;
}) {
  const body = compact
    ? "space-y-2 text-[0.6875rem] leading-relaxed text-muted"
    : "space-y-4 text-sm leading-relaxed text-muted";
  const link =
    "underline decoration-line underline-offset-4 hover:text-ink";

  return (
    <section
      aria-labelledby={showHeading ? "accuracy-sources" : undefined}
      className={className}
    >
      {showHeading ? (
        <h2
          id="accuracy-sources"
          className={compact ? "meta mb-2" : "display text-2xl"}
        >
          Accuracy and Sources
        </h2>
      ) : null}

      <div className={body}>
        <p>
          We have taken great care to preserve the accuracy and integrity of the
          Quranic text and the translations presented in this application. The
          Quranic text and associated data are sourced from the{" "}
          <a
            className={link}
            href="https://github.com/semarketir/quranjson"
            target="_blank"
            rel="noreferrer"
          >
            QuranJSON repository
          </a>
          , and we strive to ensure that the content is displayed faithfully to
          its source.
        </p>
        <p>
          Despite these efforts, errors or technical issues may occasionally
          occur. If you notice any discrepancy in the Quranic text, translation,
          recitation, or other content, please{" "}
          <Link href="/about/#contact" className={link}>
            contact us
          </Link>
          . We sincerely appreciate your help in identifying and correcting any
          issues, and we will investigate reported concerns carefully and
          promptly.
        </p>
        <p>
          Our goal is to provide a reliable and respectful reading experience,
          and we are committed to continually improving the accuracy and
          integrity of this application.
        </p>
        <p className="text-ink">
          <strong>
            May Allah accept this effort and forgive us for any shortcomings.
          </strong>
        </p>
      </div>

      {compact ? (
        <p className="mt-2 text-[0.6875rem]">
          <Link
            href="/accuracy/"
            className="text-accent underline decoration-line underline-offset-2 hover:text-ink"
          >
            Read the full accuracy note
          </Link>
        </p>
      ) : null}
    </section>
  );
}
