import type { MarkOptical } from "@/data/text-marks";

/**
 * A single sign from the Uthmani text, centred optically.
 *
 * The signs are superscript glyphs designed to sit above a letter. A key has
 * no base letter, so their natural ink floats at different heights; the
 * per-mark offset in `text-marks.ts` moves each one's ink, not its advance box,
 * to the middle of the cell. The fixed-height wrapper keeps the cells aligned
 * with the first line of the label.
 */
export function MarkGlyph({
  glyph,
  optical,
  className = "",
}: {
  glyph: string;
  optical: MarkOptical;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      data-mark-glyph=""
      className={`font-arabic flex shrink-0 items-center justify-center whitespace-nowrap text-ink ${className}`}
      style={{ lineHeight: 1 }}
    >
      <span
        style={{
          display: "inline-block",
          lineHeight: 1,
          transform: `translate(${optical.x}em, ${optical.y}em)`,
        }}
      >
        {glyph}
      </span>
    </span>
  );
}
