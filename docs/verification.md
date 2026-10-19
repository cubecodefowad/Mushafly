# Release verification

Evidence recorded on 2026-10-18 against the pinned source revision
`7ca6f46ec9a1a029cdb220c2531d509f4a5b5e98`. Every number below comes from a
command run in this workspace; nothing is projected or estimated.

## How to reproduce

```bash
npm ci
npm run data:validate     # integrity, provenance, anomaly set
npm run lint              # tsc --noEmit
npm test                  # 41 Vitest tests
npm run build             # prebuild runs validate + index, then static export
npm run test:e2e          # 129 Playwright runs (3 browsers)
npm run start             # gzip static preview on :3200
npm run perf              # LCP/CLS, desktop and throttled mobile
```

## Results

| Check | Command | Result |
|---|---|---|
| Type check | `npm run lint` | exit 0 |
| Unit / integration | `npm test` | 41 passed (8 files) |
| Data validation | `npm run data:validate` | exit 0 (runs in `prebuild`) |
| Static export | `npm run build` | exit 0, 130 prerendered pages (114 surah readers, home, search, bookmarks, settings, terms, privacy, about, accuracy, tajweed, social preview, 404, not-found, `og.png`, `twitter.png`, `robots.txt`, `sitemap.xml`) |
| End-to-end (dev server) | `BASE_URL=http://localhost:50517 npx playwright test --project=chromium` | 41 passed, 2 skipped (the CSP specs need response headers a dev server does not send) |
| End-to-end (release artifact) | `BASE_URL=http://localhost:3210 npx playwright test` | 129 passed against the gzip-served `out/` export |
| Accessibility | axe, WCAG 2.0/2.1/2.2 A–AA | 0 serious, 0 critical on 11 routes + dark reader |
| Performance | `npm run perf` | see README table; desktop LCP ≤ 0.4 s, mobile 3G ≤ 2.5 s |

Static routes reachable from the export (HTTP 200, correct content type):
`/`, `/surah/1/` … `/surah/114/`, `/search/`, `/bookmarks/`, `/settings/`,
`/terms/`, `/privacy/`, `/about/`, `/accuracy/`, `/tajweed/`, `/social-preview/`,
`/og.png`, `/twitter.png`, `/robots.txt`, `/sitemap.xml`. A missing path returns
`404.html` with HTTP 404.
The full Playwright suite is run against that export, not only against the
development server, so prerendered HTML and the static JSON fetches are what
was actually exercised.

## PRD section 2 success metrics

| Metric | Status | Evidence |
|---|---|---|
| Quran text integrity | Verified | `data:validate` compares every packaged verse against the pinned checkout; `tests/unit/data-integrity.test.ts` asserts 114 surahs / 6,236 numbered verses |
| Surah coverage | Verified | 114 prerendered surah routes in the build output |
| Translation coverage | Verified | `en.itani`, `id.indonesian` and the Arabic commentary `ar.muyassar` are validated row-for-row against the pinned files; the source's Bismillah convention (absent in surahs 1 and 9, unnumbered elsewhere, and absent from the Arabic commentary) is asserted, never inferred |
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
  storage keys and the outside requests the app makes (playing a verse fetches
  its MP3 from raw.githubusercontent.com; page counts come from Vercel's
  endpoint on this origin).
- `/about/` and `/accuracy/` were added with the accuracy disclaimer. The text
  lives in one component (`AccuracyNotice`) and is rendered on both pages and,
  compact, in the reader footer, so the three copies cannot diverge. Both routes
  are prerendered, reachable from the header, footer and Settings, tested by
  `tests/e2e/content.spec.ts`, and included in the axe run.

## Reader key, reference page and contact (added after the release pass)

- `/tajweed/` documents all 18 highlight colours and the nine signs found in
the Uthmani text (the six pause grades, the mu'ānaqah pair, saktah, the
rub' al-ḥizb divider and the sajdah mark), with the 15 prostration verses
listed as links. The sajdah list and the glosses were checked against the
pinned data: reading every surah file finds the sajdah sign in exactly those
15 verses, and `7:206` is the case that prompted the page.
- The same key is rendered in a sticky `aside` beside the reader. It uses the
same components as the page, so the two cannot drift. `align-items` is
intentionally left at its default on the reader grid: with `items-start` the
aside collapses to the height of its content and the sticky panel has nowhere
to travel. Verified at 1440/1280/1024 (aside present, no horizontal overflow)
and 1023/390 (aside hidden, inline key shown).
- Contact is `hello@mushafly.com` on the About, Accuracy and Privacy pages and
in the site footer. No personal or project GitHub account is named anywhere in
the app; the data source keeps its link because that is attribution for a work
this project redistributes.

## Translations and sign alignment (added after the release pass)

- The reader now offers English, Indonesian and an Arabic commentary. English is part of the
  statically rendered page; the other two are copied from the same pinned
  revision to `public/quran/translation/` and fetched same-origin only when
  selected. That keeps Al-Baqara's HTML from carrying three datasets.
- The validator checks all three datasets: 6,348 English rows, 6,348 Indonesian
  rows and 6,236 Arabic rows. The Arabic file is Tafsir al-Muyassar, a
  commentary, and has no `verse_0`; the reader shows the Bismillah row without a
  translation rather than substituting one. Unit tests walk all 114 files for
  both added languages.
- The reader's toolbar select and the settings sheet share the same generated
  language list, and the choice is stored in `mushafly.settings.v1`. The
  bookmarks page renders previews in the selected language and clears stale
  previews while a new dataset loads.
- The standalone Tajweed signs in the reader's side key and on `/tajweed/` were
  optically centred in their cells. The source glyphs are superscript marks
  designed for a base letter that a key does not have, so their natural ink sat
  at very different heights. Each sign now carries an `em` offset measured from
  the bundled Amiri Quran font. A pixel check of the rendered key (hiding the
  labels, then locating each sign's ink) found ink-centre deviations of 0–2 px
  vertically and 0–0.5 px horizontally in both densities after the change.

## SEO and social metadata (added after the release pass)

- `src/lib/site.ts` owns the canonical origin (`NEXT_PUBLIC_SITE_URL`, falling
  back to `https://www.mushafly.com`) and the shared copy. `src/lib/metadata.ts`
  builds the canonical, Open Graph and Twitter fields together, so the home
  page, the dynamic surah routes and every static page carry their own URL and
  card rather than inheriting the home page's.
- `/og.png` and `/twitter.png` are 1200×630 PNGs generated at build time from
  the same copy and brand mark as the site. Playwright checks the PNG signature,
  dimensions, `image/png` content type and the exact tags on the home and surah
  pages. `/social-preview/` renders the card and the tag list for review and is
  noindex.
- `sitemap.xml` contains 121 URLs: the home page, all 114 surahs and the six
  public reference pages. `robots.txt` allows crawling, excludes the local
  bookmarks and settings views and the social preview, and points at the
  sitemap. Both are checked for content type and contents against the static
  export.
- The 404 route returns HTTP 404, carries `noindex`, and has its own title. The
  home page emits `WebSite` + `SearchAction` JSON-LD. Favicons remain the
  existing light/dark PNG pair plus the Apple touch icon.

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
- Search indexes the Arabic source and the English Itani translation only. The
  Indonesian and Arabic commentary are reading options, not search fields, so
  the on-demand index does not grow with each language.
- The Arabic translation option is a commentary (tafsir), not a translation of
  the ayah, and it carries no text for the unnumbered Bismillah. The interface
  labels it as Arabic and the attribution names Tafsir al-Muyassar.
- Deployment to a public host is not performed by this workspace; the export in
  `out/` is the release artifact.
