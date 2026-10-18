"use client";

import { ruleInfo } from "@/data/tajweed-rules";

type Props = {
  rules: string[];
  unavailableCount: number;
};

export function TajweedLegend({ rules, unavailableCount }: Props) {
  if (rules.length === 0 && unavailableCount === 0) return null;

  return (
    <details className="group mt-7 border-t border-line pt-4">
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
          <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {rules.map((rule) => {
              const info = ruleInfo(rule);
              return (
                <li key={rule} className="flex items-start gap-2.5">
                  <span
                    aria-hidden="true"
                    className="mt-[0.45rem] h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: `var(--tw-${rule})` }}
                  />
                  <span>
                    <span
                      className="block text-xs font-medium"
                      style={{ color: `var(--tw-${rule})` }}
                    >
                      {info.label}
                    </span>
                    <span className="mt-0.5 block text-[0.6875rem] leading-relaxed text-muted">
                      {info.description}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
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
            guessed or reconstructed.{" "}
            <a
              href="/settings/#tajweed"
              className="text-accent underline decoration-line underline-offset-2"
            >
              Why?
            </a>
          </p>
        ) : null}
        <p className="mt-3 text-[0.6875rem] leading-relaxed text-muted">
          Rule names and colors are interface aids. Highlighted letters are
          always the original source characters; dotted underlines supplement
          color.
        </p>
      </div>
    </details>
  );
}
