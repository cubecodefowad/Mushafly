import { TEXT_MARKS } from "@/data/text-marks";

/**
 * The symbols printed in the source text, with what each one asks the reader to
 * do. `compact` is the reader's side key; `full` is the reference page.
 */
export function TextMarks({ variant = "full" }: { variant?: "full" | "compact" }) {
  if (variant === "compact") {
    return (
      <ul className="space-y-1.5">
        {TEXT_MARKS.map((mark) => (
          <li key={mark.glyph} className="flex items-start gap-2.5">
            <span
              aria-hidden="true"
              className="font-arabic mt-[-0.15rem] w-5 shrink-0 text-center text-lg leading-6 text-ink"
            >
              {mark.glyph}
            </span>
            <span className="min-w-0">
              <span className="block text-[0.6875rem] leading-4 text-ink">
                {mark.name}
              </span>
              <span className="block text-[0.625rem] leading-4 text-muted">
                {mark.short}
              </span>
            </span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="divide-y divide-line">
      {TEXT_MARKS.map((mark) => (
        <li key={mark.glyph} className="flex items-start gap-5 py-4 first:pt-0 last:pb-0">
          <span
            aria-hidden="true"
            className="font-arabic mt-1 w-9 shrink-0 text-center text-[2.1rem] leading-none text-ink"
          >
            {mark.glyph}
          </span>
          <span className="min-w-0">
            <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-sm font-medium text-ink">{mark.name}</span>
              <span lang="ar" dir="rtl" className="font-arabic text-sm text-muted">
                {mark.arabic}
              </span>
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-muted">
              {mark.detail}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
