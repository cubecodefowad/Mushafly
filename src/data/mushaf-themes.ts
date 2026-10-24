/**
 * Mushaf page designs.
 *
 * Each design pairs a paper and ink palette (defined in `globals.css` under
 * `[data-mushaf="…"]`) with an ornamental frame on the reading page. The names
 * point at regional manuscript traditions; these are original designs inspired
 * by bound mushafs, not facsimiles of a particular edition.
 *
 * `ThemeScript` keeps a matching whitelist in its inline pre-hydration code;
 * update both when adding a design, or the stored choice is lost on first paint.
 */
export const MUSHAF_THEMES = [
  {
    id: "plain",
    label: "Plain",
    description: "No frame. The quiet page as it is.",
  },
  {
    id: "madinah",
    label: "Madinah",
    description: "Emerald paper, gold leaf, rosette corners.",
  },
  {
    id: "andalus",
    label: "Andalus",
    description: "Aged parchment, bronze rules.",
  },
  {
    id: "ottoman",
    label: "Ottoman",
    description: "Ivory and indigo, gilded frame.",
  },
] as const;

export type MushafTheme = (typeof MUSHAF_THEMES)[number]["id"];

export const DEFAULT_MUSHAF_THEME: MushafTheme = "plain";

const IDS = MUSHAF_THEMES.map((theme) => theme.id) as MushafTheme[];

export function isMushafTheme(value: unknown): value is MushafTheme {
  return typeof value === "string" && IDS.includes(value as MushafTheme);
}

export function mushafThemeInfo(id: MushafTheme) {
  return MUSHAF_THEMES.find((theme) => theme.id === id) ?? MUSHAF_THEMES[0];
}
