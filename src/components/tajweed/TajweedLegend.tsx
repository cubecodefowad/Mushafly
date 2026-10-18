"use client";

import Link from "next/link";
import { TextMarks } from "@/components/tajweed/TextMarks";
import { TajweedRules } from "@/components/tajweed/TajweedRules";

type Props = {
  rules: string[];
  unavailableCount: number;
};

export function TajweedLegend({ rules, unavailableCount }: Props) {
  if (rules.length === 0 && unavailableCount === 0) return null;

  return (
    <details className="group mt-7 border-t border-line pt-4 lg:open:pb-2">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs text-muted [&::-webkit-details-marker]:hidden">
        <span>
          Tajweed key
          {rules.length > 0 ? ` · ${rules.length} rule${rules.length === 1 ? "" : "s"}` : ""}
        </span>
        <span className="text-[0.6875rem] text-accent group-open:hidden">Show</span>
        <span className="hidden text-[0.6875rem] text-accent group-open:inline">Hide</span>
      </summary>

      <div className="mt-4 rounded-lg border border-line bg-surface p-4">
        {rules.length > 0 ? (
          <TajweedRules rules={rules} variant="compact" />
        ) : (
          <p className="text-xs text-muted">
            No source annotations for this surah could be applied faithfully.
          </p>
        )}

        {unavailableCount > 0 ? (
          <p className="mt-4 border-t border-line pt-3 text-[0.6875rem] leading-relaxed text-muted">
            {unavailableCount} verse{unavailableCount === 1 ? "" : "s"} in this
            surah are shown as plain source text because the repository&apos;s
            Tajweed ranges do not align with the displayed verse. Nothing is
            guessed or reconstructed.
          </p>
        ) : null}

        <div className="mt-4 border-t border-line pt-3">
          <p className="meta mb-2">Signs in the text</p>
          <TextMarks variant="compact" />
        </div>

        <p className="mt-4 border-t border-line pt-3 text-[0.6875rem] leading-relaxed text-muted">
          Highlighted letters are always the original source characters; a
          dotted underline repeats the colour.{" "}
          <Link
            href="/tajweed/"
            className="text-accent underline decoration-line underline-offset-2"
          >
            Full guide
          </Link>
        </p>
      </div>
    </details>
  );
}
