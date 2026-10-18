import { normalize } from "@/lib/normalize";

export type SearchEntry = {
  s: number;
  v: number;
  a: string;
  t: string;
  na: string;
  nt: string;
};

export type SearchIndex = {
  source: { repository: string; commit: string };
  entries: SearchEntry[];
};

export type SearchMode = "all" | "arabic" | "english";

export type SearchMatch = {
  entry: SearchEntry;
  score: number;
  matched: SearchMode;
};

export function searchQuran(
  entries: SearchEntry[],
  rawQuery: string,
  mode: SearchMode = "all",
  limit = 60,
): { matches: SearchMatch[]; total: number } {
  const query = normalize(rawQuery);
  if (query.length < 2) return { matches: [], total: 0 };
  const tokens = query.split(" ").filter(Boolean);

  const matches: SearchMatch[] = [];

  for (const entry of entries) {
    const fields: Array<{ text: string; matched: SearchMode }> =
      mode === "arabic"
        ? [{ text: entry.na, matched: "arabic" }]
        : mode === "english"
          ? [{ text: entry.nt, matched: "english" }]
          : [
              { text: entry.na, matched: "arabic" },
              { text: entry.nt, matched: "english" },
            ];

    let best = 0;
    let matched: SearchMode = fields[0].matched;
    const combined = fields.map((field) => field.text).join(" ");

    for (const field of fields) {
      const index = field.text.indexOf(query);
      if (index >= 0) {
        const score = 1000 - Math.min(index, 900);
        if (score > best) {
          best = score;
          matched = field.matched;
        }
      }
    }

    if (best === 0 && tokens.length > 1 && tokens.every((token) => combined.includes(token))) {
      best = 300 + Math.min(tokens.length, 20);
      matched = fields[0].matched;
    }

    if (best > 0) matches.push({ entry, score: best, matched });
  }

  matches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.entry.s !== b.entry.s) return a.entry.s - b.entry.s;
    return a.entry.v - b.entry.v;
  });

  return { matches: matches.slice(0, limit), total: matches.length };
}
