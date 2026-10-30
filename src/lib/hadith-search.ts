import { normalize } from "@/lib/normalize";

/**
 * Search over the derived Hadithly index.
 *
 * The index is postings lists only: one file per language and collection, plus
 * a catalogue that maps each document id back to a book and hadith number. It
 * is never displayed. Result text is read from the original book files, which
 * is why this module returns references rather than strings.
 */

export type HadithSearchDocs = {
  source: { name: string; repository: string; revision: string };
  collections: Record<string, Array<[number, number]>>;
};

export type HadithSearchShard = {
  language: string;
  collection: string;
  /** How many narrations the postings refer to. */
  docs: number;
  /** `[term, postings]`, sorted by term, postings delta-encoded in base 36. */
  terms: Array<[string, string]>;
};

export type HadithSearchHit = {
  collection: string;
  section: number;
  number: number;
};

/** A single letter matches nearly everything, so queries start at two. */
export const HADITH_SEARCH_MIN_LENGTH = 2;

export function decodePostings(encoded: string): number[] {
  const ids: number[] = [];
  let previous = 0;
  for (const part of encoded.split(".")) {
    previous += parseInt(part, 36);
    ids.push(previous);
  }
  return ids;
}

/** First index whose term is not before `target`, over a term-sorted array. */
function lowerBound(terms: Array<[string, string]>, target: string): number {
  let low = 0;
  let high = terms.length;
  while (low < high) {
    const middle = (low + high) >> 1;
    if (terms[middle][0] < target) low = middle + 1;
    else high = middle;
  }
  return low;
}

/**
 * The documents holding a token. The final token of a query is matched as a
 * prefix so that "forgive" finds "forgiveness" while the reader is typing; every
 * earlier token must match whole.
 */
function collect(
  terms: Array<[string, string]>,
  token: string,
  prefix: boolean,
): { ids: Set<number>; df: number } {
  const ids = new Set<number>();
  for (let index = lowerBound(terms, token); index < terms.length; index++) {
    const term = terms[index][0];
    if (prefix ? !term.startsWith(token) : term !== token) break;
    for (const id of decodePostings(terms[index][1])) ids.add(id);
  }
  return { ids, df: ids.size };
}

export function searchHadiths(
  shards: Iterable<HadithSearchShard>,
  collections: HadithSearchDocs["collections"],
  rawQuery: string,
  limit = 40,
): { hits: HadithSearchHit[]; total: number } {
  const tokens = normalize(rawQuery)
    .split(" ")
    .filter((token) => token.length >= HADITH_SEARCH_MIN_LENGTH);
  if (!tokens.length) return { hits: [], total: 0 };

  const found = new Map<string, HadithSearchHit>();

  for (const shard of shards) {
    const documents = collections[shard.collection];
    if (!documents?.length || !shard.terms.length) continue;

    const matches = tokens.map((token, position) =>
      collect(shard.terms, token, position === tokens.length - 1),
    );
    if (matches.some((match) => match.ids.size === 0)) continue;

    const smallest = matches.reduce((smallest, match) =>
      match.ids.size < smallest.ids.size ? match : smallest,
    );
    others: for (const id of smallest.ids) {
      for (const match of matches) {
        if (match === smallest) continue;
        if (!match.ids.has(id)) continue others;
      }

      const reference = documents[id];
      if (!reference) continue;

      // A narration found in Arabic and again in the translation is one result.
      const key = `${shard.collection}/${id}`;
      if (found.has(key)) continue;
      found.set(key, {
        collection: shard.collection,
        section: reference[0],
        number: reference[1],
      });
    }
  }

  // The index carries no word positions, so there is no phrase relevance to
  // rank by. Results are listed in the library's own reading order: Bukhari
  // first, then each collection's books and their numbering.
  const order = new Map(Object.keys(collections).map((id, index) => [id, index]));
  const hits = [...found.values()].sort(
    (a, b) =>
      (order.get(a.collection) ?? 0) - (order.get(b.collection) ?? 0) ||
      a.section - b.section ||
      a.number - b.number,
  );

  return { hits: hits.slice(0, limit), total: hits.length };
}
