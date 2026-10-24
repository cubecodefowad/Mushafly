"use client";

import { Check } from "lucide-react";
import { MUSHAF_THEMES, type MushafTheme } from "@/data/mushaf-themes";

/**
 * Picker for the reading page design. Every preview is the real palette: the
 * swatch carries the same `data-mushaf` attribute as the document, so the
 * thumbnail cannot drift from the page it selects.
 */
export function MushafPicker({
  value,
  onChange,
  variant = "grid",
  className = "",
  ariaLabel = "Mushaf border",
}: {
  value: MushafTheme;
  onChange: (value: MushafTheme) => void;
  variant?: "grid" | "compact";
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`grid gap-2 ${
        variant === "grid" ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2"
      } ${className}`}
    >
      {MUSHAF_THEMES.map((theme) => {
        const active = value === theme.id;
        return (
          <button
            key={theme.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(theme.id)}
            className={`rounded-lg border px-2 pb-2 pt-2 text-left transition-colors ${
              active
                ? "border-accent bg-highlight/50"
                : "border-line hover:border-accent/40"
            }`}
          >
            <span
              className="mushaf-swatch"
              data-mushaf={theme.id}
              aria-hidden="true"
            />
            <span className="mt-2 flex items-center justify-between gap-1">
              <span className="text-xs font-medium text-ink">{theme.label}</span>
              {active ? (
                <Check size={12} strokeWidth={2} className="text-accent" aria-hidden />
              ) : null}
            </span>
            {variant === "grid" ? (
              <span className="mt-0.5 block text-[0.6875rem] leading-snug text-muted">
                {theme.description}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
