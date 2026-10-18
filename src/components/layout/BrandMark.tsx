/**
 * The Mushafly mark. It is decorative: the wordmark next to it carries the
 * name, so the leaf is hidden from assistive technology.
 *
 * The artwork has one variant per theme. A single background-image element is
 * used instead of two <img> tags so a visit fetches only the variant it shows.
 * Generated from assets/brand/ by scripts/generate-brand-assets.mjs.
 */
export function BrandMark({ className = "h-7 w-7" }: { className?: string }) {
  return <span aria-hidden="true" className={`brand-mark shrink-0 ${className}`} />;
}
