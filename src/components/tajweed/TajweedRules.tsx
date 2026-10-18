import type { CSSProperties } from "react";
import { TAJWEED_RULES, ruleInfo } from "@/data/tajweed-rules";

const ALL_RULES = Object.keys(TAJWEED_RULES);

/**
 * The colour key for the Tajweed highlighting, in two densities: the full list
 * with explanations on the reference page, and a compact swatch key for the
 * reader's side panel.
 */
export function TajweedRules({
  rules = ALL_RULES,
  variant = "full",
}: {
  rules?: string[];
  variant?: "full" | "compact";
}) {
  if (rules.length === 0) return null;

  if (variant === "compact") {
    return (
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        {rules.map((rule) => {
          const info = ruleInfo(rule);
          return (
            <li key={rule} className="flex min-w-0 items-center gap-1.5">
              <span
                aria-hidden="true"
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: `var(--tw-${rule})` }}
              />
              <span
                className="truncate text-[0.6875rem] leading-5"
                style={{ color: `var(--tw-${rule})` }}
                title={info.description}
              >
                {info.label}
              </span>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <ul className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
      {rules.map((rule) => {
        const info = ruleInfo(rule);
        return (
          <li key={rule} className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="mt-[0.35rem] h-3 w-3 shrink-0 rounded-full"
              style={{ background: `var(--tw-${rule})` } as CSSProperties}
            />
            <span className="min-w-0">
              <span
                className="block text-sm font-medium"
                style={{ color: `var(--tw-${rule})` }}
              >
                {info.label}
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-muted">
                {info.description}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
