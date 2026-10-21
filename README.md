# Mushafly

An elegant, source-faithful Quran reading experience. All 114 surahs in
Arabic, with 68 selectable translation datasets across 29 languages and an
Arabic commentary (Tafsir al-Muyassar), repository-derived Tajweed
highlighting, verse-by-verse recitation, local bookmarks and Arabic/English
search. No account, no cookies, no generated Quranic content.

Built with Next.js 16 (App Router, static export), React 19, TypeScript and
Tailwind CSS 4.

## Quick start

Requirements: Node.js 24+ (the data scripts execute TypeScript directly with
Node's built-in type stripping) and npm.

```bash
npm install
npm run dev
```

The verified source-derived data is committed under `public/quran/`, so a fresh
clone can run without the upstream checkout. To re-pin or audit the data:

```bash
git clone https://github.com/semarketir/quranjson.git .quranjson
git -C .quranjson checkout 7ca6f46ec9a1a029cdb220c2531d509f4a5b5e98
npm run data:prepare   # verifies revision + hashes, copies runtime JSON, converts Tanzil XML
npm run data:search    # rebuilds the derived search index
npm run data:validate  # release-blocking integrity checks for quranjson and Tanzil
npm run data:tanzil    # re-downloads the Tanzil XML corpus (optional)
```

`npm run build` runs validation and search-index generation before the static
export. Output is written to `out/`.

## Source fidelity

| Item | Value |
|---|---|
| Repository | [semarketir/quranjson](https://github.com/semarketir/quranjson) |
| Pinned commit | `7ca6f46ec9a1a029cdb220c2531d509f4a5b5e98` (2021-02-16) |
| License | MIT |
| Surahs | 114 |
| Numbered verses | 6,236 |
| Arabic rows | 6,348 (6,236 numbered + 112 unnumbered Bismillah rows) |
| Translations | 68 datasets: `en.itani`, `id.indonesian`, `ar.muyassar` (quranjson) plus 65 Tanzil datasets across 29 languages, including six Urdu translations. See Settings → Attribution. |
| Recitation | Saad Al-Ghamadi, versebyversequran.com, ~40 kbps (default, pinned) — plus 70 editions from everyayah.com (Arabic Hafs, two Warsh readings, six translated recitations), streamed per ayah |
| Tajweed ranges | 60,841 across 18 rule identifiers |
| Audio entries | 6,348 files (425 MB, not bundled) |

The full audit, including field names and known anomalies, is in
[`docs/data-audit.md`](docs/data-audit.md). Per-file SHA-256 hashes are pinned in
[`src/data/source-lock.json`](src/data/source-lock.json).

### How the data is handled

- `scripts/prepare-data.mjs` refuses to run unless `.quranjson` is at the pinned
  commit and every non-MP3 source file matches its pinned hash. It then copies
  the parsed JSON to `public/quran/`, preserving every string (including the one
  U+FEFF artifact in 1:1).
- `src/data/quran-source.ts` is the server-side adapter. It validates verse
  counts, English translation keys and audio mappings, and attaches source file
  references to every verse. Non-English datasets are fetched by the reader only
  when selected, so a surah page is not inflated by the whole corpus.
- `scripts/lib/tanzil.mjs` converts the downloaded Tanzil XML into the same
  per-surah JSON shape. It removes the malformed leading XML comment in memory,
  never edits the source file, rejects unexpected structure, and preserves the
  translation text exactly. Two datasets with empty source verses are excluded
  and recorded in `src/data/generated/tanzil-excluded.json`.
- `src/data/translations.ts` exposes the generated list of datasets, languages,
  directions and selector groups. The reader, settings, bookmarks and legal
  pages read from it, so adding a dataset cannot leave one surface behind.
- `src/data/tajweed.ts` turns source ranges into render segments. It never
  rewrites the Arabic string. If ranges are out of bounds, overlap, use an
  unknown rule, or fail a final "concat equals source" guard, that verse is
  shown as plain text and flagged in the UI.
- `scripts/validate-quran-data.mjs` checks coverage, identifiers, translation
  mapping, Tajweed boundaries and rules, audio files and sizes, Juz boundaries,
  search-index provenance, hashes, and the exact set of known anomalies. Any new
  anomaly fails the run; any known anomaly that disappears also fails the run so
  the lock is updated deliberately.
- `scripts/validate-tanzil-data.mjs` re-parses every source XML and compares
  each of the 405,340 generated verse rows to the decoded source text. It fails
  on a missing file, duplicate or missing key, empty entry, changed text, or a
  stale exclusion, and writes `docs/tanzil-validation.md`.
- `public/quran/search-index.json` is a derived index. It contains normalized
  copies for matching plus the original display strings for excerpts. It never
  feeds the reader.

### Known source anomalies (pinned, not repaired)

1. **Tajweed offset basis — 108 verses.** Most `verse_1` annotations are measured
   from an implicit Bismillah prefix that is not part of the displayed verse.
   They are not shifted or guessed; those verses render as plain text with a
   short explanation when Tajweed is enabled.
2. **Overlapping ranges — 39 verses.** Layers such as `ghunnah` plus `iqlab`
   cannot be represented faithfully as a flat segment list. They are flagged and
   rendered plain.
3. **BOM artifact — 1:1.** The first ayah's source string begins with U+FEFF.
   The adapter preserves it in the text and accounts for its single-code-unit
   offset, verified by an exact concat check.

The validator asserts these counts and reference sets exactly.

## Routes

| Route | Purpose |
|---|---|
| `/` | Continue reading, search, full surah directory |
| `/surah/[number]/` | Static pages for all 114 surahs |
| `/search/` | Arabic + English search with derived normalization |
| `/bookmarks/` | Local bookmarks with labels and removal |
| `/settings/` | Theme, type sizes, local data, Tajweed limits, attribution |
| `/about/` | What the app is, how it is built, contact details |
| `/accuracy/` | Accuracy and Sources: provenance, pinned revision, reporting |
| `/tajweed/` | Tajweed and marks: every highlight colour and every sign explained |
| `/terms/` | Terms of Service |
| `/privacy/` | Privacy Policy |
| `/social-preview/` | Noindex preview of the Open Graph card and tags |
| `/og.png`, `/twitter.png` | Generated 1200×630 social cards |
| `/sitemap.xml`, `/robots.txt` | Crawler discovery and rules |
| `/404.html` | Static 404 for unknown paths, served with HTTP 404 |

## Branding

The Mushafly leaf is supplied as two variants, one per theme. Sources live in
`assets/brand/`; the shipped files under `public/brand/` are generated:

```bash
node scripts/generate-brand-assets.mjs   # trim, pad, downscale, encode
```

The generator has no dependencies: it decodes the 2000×2000 RGBA PNGs, trims
them to their ink, centres them on a square canvas, box-filters them down and
re-encodes PNG. It writes the in-app marks (256×256), the two 32×32 browser
icons and a 180×180 Apple touch icon, and refreshes
[docs/brand-assets.md](docs/brand-assets.md).

In the app the mark is one element with a CSS background image that swaps with
the theme class, so a visit downloads only the variant it shows. The browser
icons are declared with a `media` query: Chromium follows the system scheme,
while Firefox and Safari ignore `media` on favicons and use the light variant,
which stays legible on either tab strip.

The app was previously named Ayah. Bookmarks, reading position and settings
written under the old `ayah.*` storage keys are read once and copied forward to
the `mushafly.*` keys, so nothing is lost by the rename.

The Terms of Service and Privacy Policy are written for this application's
actual behaviour. They are a starting point, not legal advice; have them
reviewed before any commercial or institutional distribution.

The Tajweed colour key and the symbols printed in the text are documented on
`/tajweed/`. The same key is rendered beside the surah while it is read: a
sticky `<aside>` in the reader's grid that stays put from the first verse to
the last, hidden below the `lg` breakpoint where the collapsible key under the
surah header takes over. Both draw on one pair of components
(`TajweedRules`, `TextMarks`), so the reference and the reader cannot disagree.

Contact addresses are `hello@mushafly.com`; the app links to no personal
account.

The accuracy disclaimer is written once in
`src/components/legal/AccuracyNotice.tsx` and rendered in three places: the
[Accuracy and Sources page](src/app/accuracy/page.tsx), the
[About page](src/app/about/page.tsx) and the note at the foot of every surah
reader. The reader uses the same text in a compact size, so the wording cannot
drift between the three.

## Search normalization policy

Normalization is applied only to a derived copy used for matching:

- Arabic: remove harakat/tanwin/shadda/sukun (`U+064B–U+065F`), superscript alef
  (`U+0670`), Quranic annotation signs (`U+06D6–U+06ED`), tatweel and a leading
  U+FEFF; fold `آ أ إ ٱ → ا`, `ى → ي`, `ة → ه`, `ؤ → و`, `ئ → ي`, drop `ء`.
- English: NFKD, remove combining marks, lowercase, fold punctuation to spaces.
- Whitespace is collapsed.
- The original display string is never normalized. Exports use an index map back
  to the original so excerpts quote the source with its diacritics intact.

The policy is documented in [`src/lib/normalize.ts`](src/lib/normalize.ts) and
covered by unit tests.

## Architecture

```text
.quranjson (pinned checkout, not committed)
        │  prepare-data.mjs verifies hashes
        ▼
public/quran/ (runtime copies, committed)
        │
        ├── src/data/quran-source.ts   server adapter + traceability
        ├── src/data/tajweed.ts        strict range → segment renderer
        ├── scripts/build-search-index.mjs → public/quran/search-index.json
        ▼
Next.js App Router (static export)
        ├── server-rendered surah pages reading pinned JSON at build time
        ├── client reader: settings, audio, bookmarks, last-read
        └── client search loading the derived index on demand
```

## Commands

```bash
npm run dev            # development server
npm run build          # validate + index + static export to out/
npm run start          # local static preview with gzip (after build)
npm run perf           # LCP/CLS against the running preview
npm run lint           # TypeScript check
npm test               # Vitest unit/integration tests
npm run test:e2e       # Playwright (install chromium, firefox and webkit first)
BASE_URL=http://localhost:3200 npm run test:e2e   # same suite against the built static export
npm run data:prepare   # requires .quranjson at the pinned commit
npm run data:validate
npm run data:search
node scripts/generate-brand-assets.mjs   # regenerate public/brand/ from assets/brand/
```

## Testing

- **Unit/integration (46 tests):** Tajweed concatenation across all 6,348 rows,
  corrupted range fixtures (bounds, overlap, unknown rule), BOM handling,
  normalization and excerpt mapping, search in both languages, storage
  validation and the pre-rename key migration, adapter coverage and audio
  mapping, all three quranjson datasets including the Arabic commentary's
  missing Bismillah row, all 65 generated Tanzil datasets and their 405,340
  non-empty rows, Urdu text preservation and direction metadata, and the optical
  offsets that align the standalone Tajweed signs.
- **Playwright (45 tests × Chromium, Firefox and WebKit = 135 runs):** home
  directory, reader directionality and exact strings, translation switching and
  persistence, the searchable translation picker, Tanzil datasets rendering their
  own text, Tajweed toggle, bookmark persistence after reload, Arabic/English
  search, on-demand search index, theme-aware mark and browser icons, canonical
  and social metadata, sitemap/robots, the 404 page, legal pages and their
  footer links, pre-rename data migration, theme persistence, settings dialog
  keyboard dismissal, mobile overflow, and axe WCAG 2.2 AA checks on eleven
  routes plus a dark reader.
- **Validator:** pins the exact source revision, file hashes and anomaly set.
  Run in CI and before release.

Phase 4 evidence — commands, raw results, the bugs found and the limits carried
into the release — is recorded in [`docs/verification.md`](docs/verification.md).

## Accessibility

- Semantic landmarks, one `h1` per route, skip link, visible focus.
- Arabic containers use `lang="ar" dir="rtl"`; every translation declares its
  own `lang` and `dir` from the registry. Right-to-left translations use the
  Arabic face, Urdu uses Nastaliq, and left-to-right translations use the serif
  face. The Arabic commentary is kept visually distinct from the ayah text.
- Icon-only controls have accessible names; dialogs are native `<dialog>`.
- Tajweed is never encoded by color alone: dotted underlines and a rule key with
  labels and descriptions accompany the colors. All 18 rule colors pass 4.5:1
  against both theme backgrounds.
- Motion respects `prefers-reduced-motion`; reading never depends on animation.
- No `aria-live` on the reader. Playback and short confirmations use polite
  status regions.
- Axe runs with WCAG 2.0/2.1/2.2 A–AA tags and reports no serious or critical
  violations in light or dark mode.

## Metadata, discovery and sharing

- Every indexable page declares a canonical URL, a page-specific title and
  description, Open Graph tags and a Twitter `summary_large_image` card. The
  metadata is built once in `src/lib/metadata.ts`, so a new page cannot ship
  with only half a social card.
- `/og.png` and `/twitter.png` are generated at build time by
  `src/components/social/SocialImage.tsx` from the same copy and brand mark as
  the app. They are real 1200×630 PNGs served with `image/png`, not SVG cards
  that some scrapers reject. `/social-preview/` is a noindex page for checking
  the result.
- `src/app/robots.ts` serves `robots.txt`; `src/app/sitemap.ts` lists the home
  page, all 114 surahs and the public reference pages (121 URLs). Bookmarks,
  settings and the social preview are excluded and marked noindex.
- The site URL comes from `NEXT_PUBLIC_SITE_URL`, falling back to the canonical
  `https://www.mushafly.com`. Set it for preview or alternate domains so
  canonical URLs never point at the wrong host.
- The home page emits `WebSite` + `SearchAction` JSON-LD, and the 404 route is
  served with HTTP 404 and a `noindex` tag. Favicons and the Apple touch icon
  are declared in the root metadata, with light and dark variants.

## Performance and deployment

- Static export (`output: "export"`); every surah is prerendered from the
  pinned data at build time. No backend or runtime Quran API is used.
- The reader bundle does not include audio. A verse's MP3 is fetched only when
  played, from an immutable raw URL at the pinned commit.
- English is part of every statically rendered surah page. Every other dataset
  is a same-origin JSON file fetched only when selected; the reader keeps the
  English text readable while a new translation loads and reports a failure
  instead of silently showing the wrong one.
- Search keeps its 3.64 MiB index (1.0 MiB gzipped) off the critical path: the
  route renders instantly and the index is fetched only once a query of two or
  more characters exists. Landing on `/search/?q=…` fetches it immediately.
- Arabic and Latin fonts are self-hosted WOFF2 with `font-display: swap` and
  preloads to limit layout shift.
- Deploy the contents of `out/` to any static host. Set
  `NEXT_PUBLIC_SITE_URL` to the public origin at build time (for example
  `https://www.mushafly.com`); canonicals, Open Graph URLs, `robots.txt` and the
  sitemap all derive from it. Audio requires network access to
  `raw.githubusercontent.com`; reading, search, bookmarks and settings work
  without it.

Measured with `npm run perf` against the gzip static preview (local machine;
not a guarantee for every device or network):

| Route | Desktop LCP | Mobile Fast 3G + 4× CPU LCP | Max CLS |
|---|---|---|---|
| Home | 220 ms | 972 ms | 0.028 |
| Al-Baqara reader | 368 ms | 1,292 ms | 0.001 |
| Search | 140 ms | 2,408 ms | 0.026 |
| Settings | 152 ms | 988 ms | 0.001 |

All are within the PRD targets (LCP ≤ 2.5 s, CLS ≤ 0.1). On desktop, where the
PRD's broadband target applies, every route paints in under 400 ms and search
no longer downloads its index to show the empty state (previously 1,435 KiB and
384 ms LCP). The brand mark costs one cached 8 KiB image per visit; the icons add
nothing to page load. The remaining mobile search figure is the Inter font swap on a
throttled 3G profile, not the index: the largest-contentful element is a body
paragraph that repaints when the sans font arrives. Arabic text, which is the
reading surface, uses the preloaded Amiri Quran subset (45 KiB).

## Privacy

No accounts, no cookies, no server-side reading history. Bookmarks, last-read
position and preferences live in `localStorage` and are validated on read.
Malformed or out-of-range records are ignored. Quran content is rendered as
text/spans, never injected as HTML.

Page views are counted by Vercel Web Analytics: cookieless, one route served
from this origin at `/_vercel/insights/*`, no custom events, no identifier that
lasts beyond a day, and inert when the site is not hosted on Vercel. The
user-facing statement — including that fact, the MP3 request to GitHub when a
verse plays, and the exact storage keys — is at `/privacy/` and mirrored here.

## Security

No server, no database, no accounts: the render path is React-escaped text,
stored values are type-checked and bounded, and every `fetch()` is same-origin
except verse audio at a pinned commit. The one third-party script is Vercel's
analytics script, served from this origin in production and covered by the same
policy. `npm audit` is clean for production and development dependencies, and CI
fails on a high or critical advisory.

What is checked, the recommended host headers (with the two `'unsafe-inline'`
allowances a static export forces), the GitHub settings worth turning on, and the
residual risks are in [docs/security.md](docs/security.md). The preview server
sends the same policy the deployed site should use, so the browser suite
verifies it. How to report a problem: [SECURITY.md](SECURITY.md).

## Attribution

- Quran data: semarketir/quranjson, MIT, revision
  `7ca6f46ec9a1a029cdb220c2531d509f4a5b5e98`.
- English translation: Talal Itani, `en.itani`, Tanzil.net, 2013-07-19.
- Indonesian translation: Indonesian Ministry of Religious Affairs,
  `id.indonesian`, Tanzil.net, 2010-06-04.
- Arabic commentary: King Fahad Quran Complex, `ar.muyassar` (Tafsir
  al-Muyassar), alquran.cloud. This dataset is a tafsir, not a translation of the
  ayah, and it has no entry for the unnumbered Bismillah row.
- Tanzil corpus: 65 translations across 29 languages, downloaded from
  <https://tanzil.net/trans/>. Non-commercial use only; see
  `THIRD_PARTY_NOTICES.md` and Settings → Attribution.
- Recitation: Saad Al-Ghamadi, versebyversequran.com, ~40 kbps (the pinned
  default), and 70 editions from everyayah.com in Arabic Hafs, the Warsh
  reading and six translated recitations. The everyayah files are streamed,
  never copied into the build. everyayah publishes no terms of its own, so those
  editions are opt-in streams and not bundled assets. `npm run data:reciters`
  re-audits the folders and regenerates the manifest; an edition is only offered
  when all 6,236 ayah files exist.
- Fonts: Amiri Quran, Source Serif 4, Inter and Noto Nastaliq Urdu under the SIL
  Open Font License 1.1 (license files in `public/fonts/`).

See [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) and the in-app
Settings → Attribution panel. The repository's MIT license does not by itself
resolve separate translation or audio content licenses; verify those terms
before redistribution.

## Limitations

- No user accounts, cloud sync, offline audio downloads or Mushaf page images.
- Search indexes the Arabic source and the English Itani translation. The
  Indonesian and Arabic commentary are reading options, not search fields, so
  the on-demand index stays at 3.64 MiB instead of growing with every language.
- The Tajweed anomalies above mean those specific verses intentionally have no
  highlighting. They are counted, surfaced, and never patched.
- Audio availability depends on the pinned repository's raw files and the
  browser's media support.
- On a throttled 3G profile the Inter body font can arrive after first paint, so
  Latin text may briefly show the system fallback before swapping. This is
  limited to first visits; fonts are cached for a year.
