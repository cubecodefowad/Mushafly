import type { ReactNode } from "react";

/**
 * A single rosette, drawn rather than shipped as an image so it takes the
 * frame's gilding colour in every palette and stays crisp at any size.
 */
function Rosette() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round">
        <ellipse cx="12" cy="12" rx="9.4" ry="3.2" />
        <ellipse cx="12" cy="12" rx="9.4" ry="3.2" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="12" rx="9.4" ry="3.2" transform="rotate(120 12 12)" />
        <circle cx="12" cy="12" r="2.1" />
      </g>
      <circle cx="12" cy="12" r="0.85" fill="currentColor" />
    </svg>
  );
}

const CORNERS = ["tl", "tr", "bl", "br"] as const;

/**
 * The reading page's ornamental border. It is purely decorative: the frame,
 * corners and medallions are hidden from assistive technology, and the text
 * inside is unchanged.
 *
 * The frame is always in the markup. `data-mushaf` (set before first paint by
 * `ThemeScript`) decides whether CSS draws it, so a stored design does not add
 * elements at hydration and shift the text. `plain` simply removes the border.
 */
export function MushafFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mushaf-frame">
      {CORNERS.map((corner) => (
        <span
          key={corner}
          className={`mushaf-ornament mushaf-corner mushaf-corner-${corner}`}
          aria-hidden="true"
        >
          <Rosette />
        </span>
      ))}
      <span className="mushaf-ornament mushaf-boss mushaf-boss-top" aria-hidden="true">
        <Rosette />
      </span>
      <span className="mushaf-ornament mushaf-boss mushaf-boss-bottom" aria-hidden="true">
        <Rosette />
      </span>
      {children}
    </div>
  );
}
