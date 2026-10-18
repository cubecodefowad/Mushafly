# Release verification

Evidence recorded on 2026-10-18 against the pinned source revision
`7ca6f46ec9a1a029cdb220c2531d509f4a5b5e98`. Every number below comes from a
command run in this workspace; nothing is projected or estimated.

## How to reproduce

```bash
npm ci
npm run data:validate     # integrity, provenance, anomaly set
npm run lint              # tsc --noEmit
npm test                  # 24 Vitest tests
npm run build             # prebuild runs validate + index, then static export
npm run test:e2e          # 45 Playwright runs (3 browsers)
npm run start             # gzip static preview on :3200
npm run perf              # LCP/CLS, desktop and throttled mobile
```

## Results

| Check | Command | Result |
|---|---|---|
| Type check | `npm run lint` | exit 0 |
| Unit / integration | `npm test` | 28 passed (5 files) |
| Data validation | `npm run data:validate` | exit 0 (runs in `prebuild`) |
| Static export | `npm run build` | exit 0, 123 prerendered pages (114 surah readers, home, search, bookmarks, settings, terms, privacy, 404 and not-found) |
| End-to-end (dev server) | `npm run test:e2e` | 66 passed (Chromium, Firefox, WebKit) |
| End-to-end (release artifact) | `BASE_URL=http://localhost:3200 npm run test:e2e` | 66 passed against the gzip-served `out/` export |
| Accessibility | axe, WCAG 2.0/2.1/2.2 A–AA | 0 serious, 0 critical on 7 routes + dark reader |
| Performance | `npm run perf` | see README table; desktop LCP ≤ 0.4 s, mobile 3G ≤ 2.5 s |

Static routes reachable from the export (HTTP 200, correct content type):
`/`, `/surah/1/` … `/surah/114/`, `/search/`, `/bookmarks/`, `/settings/`,
`/terms/`, `/privacy/`.
The full Playwright suite is run against that export, not only against the
development server, so prerendered HTML and the static JSON fetches are what
was actually exercised.

## PRD section 2 success metrics

| Metric | Status | Evidence |
|---|---|---|
| Quran text integrity | Verified | `data:validate` compares every packaged verse against the pinned checkout; `tests/unit/data-integrity.test.ts` asserts 114 surahs / 6,236 numbered verses |
| Surah coverage | Verified | 114 prerendered surah routes in the build output |
| Translation coverage | Verified | Itani `en.itani` rendered verse-for-verse from the pinned files; the source's Bismillah convention (absent in surahs 1 and 9, unnumbered elsewhere) is asserted, never inferred |
| Tajweed integrity | Verified | Every source offset maps to exact characters or is flagged unpinnable (`tests/unit/tajweed.test.ts`); unpinnable verses show the source-anomaly notice instead of invented rules |
| Audio reliability | Verified | One-to-one verse-to-file mapping asserted (`001.mp3`, `255.mp3`, Bismillah `000.mp3`); playback is progressive enhancement |
| Reading performance | Verified | LCP 168–380 ms desktop, 1.0–1.4 s mobile Fast 3G + 4× CPU (target ≤ 2.5 s) |
| Responsive layout | Verified | Playwright mobile-width overflow test on every route |
| Core usability without an account | Verified | Bookmarks, continue reading, search, settings all persist in `localStorage`; no auth code paths exist |

## Branding and legal pages (added after the Phase 4 pass)

- The product was renamed from Ayah to Mushafly across metadata, headings,
  README, license and package manifest. Storage keys moved to the `mushafly.*`
  namespace with a read-once migration from `ayah.*`, covered by unit tests and
  an end-to-end test that preloads the old keys and confirms bookmarks and theme
  survive.
- The supplied leaf artwork is converted to the files the app loads by
  `scripts/generate-brand-assets.mjs` (dependency-free PNG decode, trim,
  box-filter downscale, re-encode). Two in-app marks and two browser icons are
  generated, one per theme; the icon pair is declared with a `media` query and
  documented in [brand-assets.md](brand-assets.md), including the fact that
  Firefox and Safari ignore `media` on favicons.
- `/terms/` and `/privacy/` are prerendered, linked from the footer and from
  Settings, and included in the axe run. The privacy text names the exact
  storage keys and the single third-party request the app makes (playing a verse
  fetches its MP3 from raw.githubusercontent.com).
- `/about/` and `/accuracy/` were added with the accuracy disclaimer. The text
  lives in one component (`AccuracyNotice`) and is rendered on both pages and,
  compact, in the reader footer, so the three copies cannot diverge. Both routes
  are prerendered, reachable from the header, footer and Settings, tested by
  `tests/e2e/content.spec.ts`, and included in the axe run.

## Test data policy

Every Quranic string in the suite comes from the packaged runtime data, which is
byte-compared against the pinned checkout by `data:validate`. No test embeds an
invented verse. The "corrupted fixture" cases in `tests/unit/tajweed.test.ts`
feed deliberately invalid *range metadata* (out-of-bounds, overlapping, unknown
rule) to real verse text and assert that the rendered segments still concatenate
back to the untouched source string.

## Bugs found and fixed during Phase 4

1. **Persistence race.** `SettingsProvider` and `ReadingStateProvider` started
   from empty defaults and wrote them back before hydration read `localStorage`,
   so a fast first paint could erase stored bookmarks, preferences and the saved
   reading position. Both providers now start from a "not loaded" state and only
   persist after hydration, with the stored value validated on read.
2. **CSS cascade.** Unlayered component styles in `globals.css` outranked
   Tailwind utilities, so responsive hiding and input padding silently lost to
   the design system. The styles are now inside explicit `@layer`s and the
   mobile layout matches the desktop intent.
3. **Search index on the critical path.** `/search/` downloaded the 3.64 MiB
   index before rendering anything (1,435 KiB, 384 ms LCP desktop, 2.3 s mobile
   3G). It is now fetched only once a query of two or more characters exists, or
   immediately when landing on `/search/?q=…`. The new Playwright test asserts
   no index request happens on an untouched search page.

## Limitations carried into the release

- Tajweed anomalies inherited from the source are counted and surfaced, never
  patched. Those verses intentionally render without highlighting.
- Audio depends on the pinned repository's raw files; playback degrades to an
  explicit error state when they are unreachable.
- On a throttled 3G profile the Inter body font can arrive after first paint, so
  Latin text may briefly show the system fallback. Arabic text uses a preloaded
  45 KiB subset and is unaffected.
- Deployment to a public host is not performed by this workspace; the export in
  `out/` is the release artifact.
