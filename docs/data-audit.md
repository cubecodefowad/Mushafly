# Quran data audit

This document records what was actually found in the selected source revision
before the reader was implemented. It is not a claim that the upstream data is
authentic or free of errors; it documents how Mushafly handles the data faithfully.

## Pin

| | |
|---|---|
| Repository | <https://github.com/semarketir/quranjson> |
| Commit | `7ca6f46ec9a1a029cdb220c2531d509f4a5b5e98` |
| Commit date | 2021-02-16 |
| License | MIT (Copyright 2015 Semar Ketir) |
| Source files (non-MP3) | 806, hashed in `src/data/source-lock.json` |
| MP3 files | 6,348 (425 MB), not bundled |
| Runtime translations | `en.itani`, `id.indonesian`, `ar.muyassar` |
| Runtime audio | Ghamadi, `versebyversequran.com` |

No other Quran content source, API, fallback repository or generated text is
used.

## File map

```text
source/
├── surah.json                         metadata, 114 records
├── juz.json                           30 records
├── surah/surah_<1..114>.json          Arabic
├── translation/en/en_translation_<n>.json
├── translation/id/id_translation_<n>.json
├── translation/ar/ar_translation_<n>.json   (commentary; no verse_0)
├── tajweed/surah_<1..114>.json
└── audio/<001..114>/index.json + <verse>.mp3
```

Each directory also contains a `.sources` file describing attribution.

## Surah metadata — `source/surah.json`

Array of 114 objects:

```jsonc
{
  "place": "Mecca",
  "type": "Makkiyah",
  "count": 7,                 // numbered verses, excludes verse_0
  "title": "Al-Fatiha",
  "titleAr": "الفاتحة",
  "index": "001",
  "pages": "1",               // upstream field; not used for navigation
  "juz": [{ "index": "01", "verse": { "start": "verse_1", "end": "verse_7" } }]
}
```

`count` sums to **6,236**. Mushafly displays `title`, `titleAr`, `index`, `count`,
`place` and `type` exactly as supplied. Page numbers are not inferred or
displayed as navigation.

`source/juz.json` has 30 records with `start`/`end` objects of
`{index, verse, name}`. The validator checks that every boundary points to a
real surah and verse.

## Arabic — `source/surah/surah_<n>.json`

```jsonc
{
  "index": "001",
  "name": "al-Fatihah",
  "verse": {
    "verse_0": "<Bismillah, only where the source includes it>",
    "verse_1": "<exact source string>",
    "…": "…",
    "verse_<count>": "<exact source string>"
  },
  "count": 7,
  "juz": [ … ]
}
```

Findings:

- **Bismillah convention.** 112 files contain an unnumbered `verse_0`
  (all surahs except 1 and 9). `count` excludes it. Surah 1's Bismillah is its
  numbered `verse_1`; surah 9 has no `verse_0`. Mushafly shows `verse_0` as a
  separate centered Bismillah block with its source translation and audio, and
  does not add or remove Bismillah anywhere else.
- **Arabic rows:** 6,348 = 6,236 numbered + 112 unnumbered.
- **BOM artifact.** `source/surah/surah_1.json` → `verse_1` begins with U+FEFF.
  It is part of the JSON string and is preserved in displayed text. The Tajweed
  adapter accounts for the one-code-unit offset and verifies an exact concat.
- Strings are not trimmed, normalized, diacritic-stripped or reconstructed.
  `white-space: pre-wrap` preserves internal spacing in the browser.

## Translations — `source/translation/<lang>/<lang>_translation_<n>.json`

```jsonc
{
  "name": "al-Fatihah",        // en and id only
  "index": "001",              // ar stores a JSON number instead
  "verse": { "verse_0": "…", "verse_1": "…", "…": "…" },
  "count": 7
}
```

Findings:

- Three datasets are copied to the runtime tree and offered by the reader:

  | File | Rows | Attribution |
  |---|---|---|
  | `en/en_translation_<n>.json` | 6,348 | Itani / Talal Itani / `en.itani` / Tanzil.net / 2013-07-19 |
  | `id/id_translation_<n>.json` | 6,348 | Indonesian Ministry of Religious Affairs / `id.indonesian` / Tanzil.net / 2010-06-04 |
  | `ar/ar_translation_<n>.json` | 6,236 | King Fahad Quran Complex / `ar.muyassar` / alquran.cloud |

- English and Indonesian include the same 112 unnumbered Bismillah rows as the
  Arabic source. The Arabic dataset is **Tafsir al-Muyassar**, a commentary: it
  has no `verse_0` key at all and 6,236 numbered rows. The adapter treats a
  missing Arabic Bismillah as absent commentary; it never substitutes text.
- Every numbered Arabic verse has a non-empty record in every language; every
  key maps to an Arabic key. The validator fails on any missing record rather
  than substituting text.
- The Arabic file's `index` is a number (`1`), while the English and Indonesian
  files use the padded string (`"001"`). The validator normalizes before
  comparing.
- The English dataset is rendered into each static page. Indonesian and Arabic
  are copied to `public/quran/translation/` and fetched by the reader on demand,
  keeping the surah HTML from carrying three datasets.

## Tajweed — `source/tajweed/surah_<n>.json`

```jsonc
{
  "index": "001",
  "verse": {
    "verse_1": [
      { "start": 7, "end": 8, "rule": "hamzat_wasl" }
    ]
  }
}
```

Findings:

- Offsets are 0-based UTF-16 code-unit ranges into the Arabic string; `end` is
  exclusive. Concatenating a correctly applied range list reproduces the source
  string exactly.
- 60,841 ranges; 18 rule identifiers:
  `hamzat_wasl`, `madd_2`, `madd_246`, `madd_6`, `madd_munfasil`,
  `madd_muttasil`, `ikhfa`, `ikhfa_shafawi`, `ghunnah`, `idghaam_ghunnah`,
  `idghaam_no_ghunnah`, `idghaam_shafawi`, `idghaam_mutajanisayn`,
  `idghaam_mutaqaribayn`, `iqlab`, `qalqalah`, `lam_shamsiyyah`, `silent`.
- **108 verses have out-of-bounds ranges.** All are `verse_1` (for example
  2:1, 36:1, 38:1, 50:1, 68:1). The offsets are measured from an implicit
  Bismillah prefix in the generation text, not from the displayed verse. A
  shift is not applied because the basis text also differs in spacing for some
  verses (38:1's `hamzat_wasl` range does not land on `hamzat_wasl` under the
  same shift that fixes its `madd_6` range). These verses are flagged and shown
  as plain source text.
- **39 verses contain overlapping ranges** (mostly `ghunnah` + `iqlab` or
  `ghunnah` + `idghaam`). A flat segment list cannot represent both without
  either dropping or duplicating text, so these verses are flagged and shown
  plain.
- **1:1 BOM.** The first ayah's ranges are measured against the string without
  the leading U+FEFF. Mushafly shifts the offsets by one only for this artifact and
  verifies the rendered concat equals the full source string.
- The exact out-of-bounds and overlap reference sets are pinned in
  `src/data/source-lock.json`. Any change fails validation.

The reader applies a range only when all of the following hold:

1. integer `start`/`end`, `0 ≤ start < end ≤ text.length`;
2. the rule identifier is one of the 18 source rules;
3. ranges sorted by start never overlap;
4. the concatenation of all rendered segments equals the source string.

Otherwise it renders the entire verse plain and exposes the reason in the UI.

## Audio — `source/audio/<nnn>/index.json` and MP3s

```jsonc
{
  "index": "001",
  "verse": {
    "verse_0": { "file": "000.mp3", "size": 27426, "unit": "26,78 KB" },
    "verse_1": { "file": "001.mp3", "size": 27426, "unit": "26,78 KB" }
  },
  "count": 7
}
```

Findings:

- 114 index files, 6,348 entries, 6,348 MP3 files. Every Arabic key — including
  the 112 unnumbered Bismillah rows — has an audio file.
- File names are the zero-padded verse number (`000.mp3` for `verse_0`).
- `count` is the numbered count; keys equal `count + 1` where `verse_0` exists.
- Sizes in the index match the actual file sizes (checked with `stat` during
  validation).
- Attribution: Ghamadi, ~40 kbps, `versebyversequran.com`, license URL in
  `source/audio/.sources`.
- Audio is not copied into the build. URLs are constructed against the pinned
  commit, e.g.
  `https://raw.githubusercontent.com/semarketir/quranjson/<sha>/source/audio/002/255.mp3`.
  The host supports HTTP range requests. Reading is unaffected if playback
  fails; there is no automatic retry loop.

## Validation output (pinned revision)

```text
Pinned revision: 7ca6f46ec9a1a029cdb220c2531d509f4a5b5e98
Validated 114 surahs, 6236 numbered verses,
translations en/id/ar: 6348/6348/6236 rows,
60841 tajweed segments, 6348 audio entries.
Known pinned anomalies: 108 out-of-bounds verses,
39 overlapping verses, 1 BOM string.
Integrity validation passed.
```

The validator verifies source hashes when `.quranjson` is present and always
validates the committed runtime copies structurally. It also compares the
search index against the display records and re-computes its normalized fields.

## Deliberately corrupted fixtures

`tests/unit/tajweed.test.ts` feeds the renderer real source text with corrupted
range lists (out-of-bounds end, overlapping ranges, unknown rule) and asserts:

- the status becomes `unavailable`;
- the reason is reported;
- the returned plain segment equals the original string exactly.

The test never mutates the Quranic string itself.
