import Link from "next/link";
import { TajweedRules } from "@/components/tajweed/TajweedRules";
import { TextMarks } from "@/components/tajweed/TextMarks";

/**
 * The reference that sits beside the surah while it is read: the same key as
 * the Tajweed and marks page, in the density a margin can hold.
 */
export function ReaderKey() {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="meta">Key</h2>
        <Link
          href="/tajweed/"
          className="text-[0.6875rem] text-accent underline decoration-line underline-offset-2 hover:text-ink"
        >
          Full guide
        </Link>
      </div>

      <p className="meta mt-4 text-[0.625rem]">Highlights</p>
      <div className="mt-2">
        <TajweedRules variant="compact" />
      </div>
      <p className="mt-2 text-[0.625rem] leading-relaxed text-muted">
        Colours appear when Tajweed is on.
      </p>

      <p className="meta mb-2 mt-4 text-[0.625rem]">Signs</p>
      <TextMarks variant="compact" />
    </div>
  );
}
