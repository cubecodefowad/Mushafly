# Changelog

Every commit in this repository's history, newest first. The project has no tags
or releases, so commits are the unit of change; dates are committer dates and
stats come from `git show --numstat`.

Scope: the Next.js reader in `src/`. The `mobile/` directory is not tracked in
this history, so nothing here describes it.

## 2026-10-20

### Focus the translation search field when the picker opens — `64e5310`

_1 file, +4 −1_

**Fixed**
- Focus moved to the search field synchronously after `showModal()` instead of
  inside `requestAnimationFrame`. `showModal()` focuses the first focusable
  element (the close button), and a throttled frame callback could leave focus
  there when the dialog appeared in a background or slow tab.
- Comment records why the synchronous call is deliberate, so it is not "cleaned
  up" back into a frame callback.

### Theme the translation chooser instead of using a native menu — `b59851a`

_9 files, +499 −105_

**Added**
- `src/components/settings/TranslationPicker.tsx` (308 lines): a themed dialog
  that replaces the native `<select>` everywhere a translation is chosen.
  - Search across language, translator and edition name.
  - Grouped list of languages, current edition marked and scrolled into view.
  - One `listbox` with Arrow/Home/End/Enter navigation and a visible
    empty-result message.
  - Escape closes while the search field has focus; focus returns to the
    trigger. Bottom-sheet layout on small screens.
  - "Off" remains a distinct choice and is only offered with an empty query.

**Changed**
- `Reader.tsx`, `SettingsSheet.tsx` and `SettingsClient.tsx` now use the picker,
  so the toolbar, the reading-settings sheet and `/settings/` cannot drift.
- `globals.css` grew 88 lines of dialog/sheet styling.
- README and `docs/verification.md` describe the new control.

**Removed**
- `TranslationSelect.tsx` (48 lines), the native menu. Its removal is the point:
  a 68-entry OS-drawn list could not be styled and could exceed the viewport.

**Tests**
- `tests/e2e/reader.spec.ts` rewritten around the picker (+69 −17): styled
  surface, option count, search filtering, Escape, persistence.

### Add 65 Tanzil translations to the reader — `deb704d`

_7,522 files, +447,172 −195_

**Added**
- Tanzil XML corpus under `data/tanzil/` (65 datasets), with `manifest.json` and
  `validation-report.json`.
- `scripts/download-tanzil-translations.mjs` to refresh the corpus,
  `scripts/lib/tanzil.mjs` for parsing (it strips the malformed leading comment
  in memory and never edits the source), and `scripts/validate-tanzil-data.mjs`.
- Generated `src/data/generated/tanzil-keys.ts`,
  `tanzil-translations.json` and `tanzil-excluded.json`.
- `docs/tanzil-validation.md` and `tests/unit/tanzil-translations.test.ts`.

**Changed**
- `prepare-data.mjs` now converts XML into the same per-surah JSON shape as the
  existing datasets: 405,340 non-empty verse rows. Two datasets whose source
  verses are empty are excluded and recorded rather than silently shipped.
- The translation registry now carries 68 datasets across 29 languages,
  including six Urdu editions, each with its own direction and language code.
- Urdu renders in Nastaliq, RTL editions use the Arabic face, LTR editions use
  the serif face; the chooser groups by language.
- `data:prepare` and `data:validate` now cover both sources.

### Point canonical metadata at the production www host — `902005c`

_4 files, +12 −11_

**Changed**
- `src/lib/site.ts` defaults `SITE_URL` to `https://www.mushafly.com`, so
  canonicals, Open Graph URLs, `robots.txt` and the sitemap all resolve to the
  production host instead of the apex.
- README, `docs/verification.md` and `tests/e2e/seo.spec.ts` updated to match.

## 2026-10-19

### Ship multilingual reading with complete social and crawler metadata — `937fa5c`

_283 files, +1,923 −264_

**Added**
- Two more datasets: `id.indonesian` (Indonesian Ministry of Religious Affairs,
  Tanzil.net) and `ar.muyassar` (Tafsir al-Muyassar, alquran.cloud), copied to
  `public/quran/translation/` and fetched only when selected.
- `src/data/translations.ts`, a single registry of language code, direction,
  `htmlLang`, translator, source, group and row count, read by the reader,
  settings, bookmarks and legal pages together.
- `src/lib/metadata.ts` (one metadata builder), `src/lib/site.ts` (canonical
  origin), `src/app/sitemap.ts` (121 URLs: home, 114 surahs, six reference
  pages), `src/app/robots.ts` (excludes `/bookmarks/`, `/settings/`,
  `/social-preview/`).
- Real 1200×630 PNG social cards at `/og.png` and `/twitter.png`, rendered from
  `src/components/social/SocialImage.tsx`, plus a noindex `/social-preview/`
  page for checking them.
- `src/components/tajweed/MarkGlyph.tsx` for standalone signs, with optical
  offsets so they sit on the baseline beside the ayah.
- `tests/e2e/seo.spec.ts`, `tests/unit/translations.test.ts`.

**Changed**
- The reader applies each dataset's own `lang` and `dir`; the Arabic commentary
  is visually distinct from the ayah text. English stays readable while another
  dataset loads, and a failed fetch is reported instead of showing the wrong
  language.
- `404` is served with HTTP 404 and `noindex`; favicons and the Apple touch icon
  are declared with light and dark variants.
- The axe suite grew from seven routes to eleven plus a dark reader.

## 2026-10-18

### Prove the privacy element hands over the redaction, not just the helper — `278797e`

_1 file, +31 −1_

**Changed**
- `tests/unit/analytics.test.ts` became `.tsx` and renders `SiteAnalytics`
  itself, asserting the payload the component actually passes to the analytics
  library rather than only the redaction helper in isolation.

### Keep the reader's search words out of the analytics payload — `65185af`

_5 files, +82 −8_

**Added**
- `src/lib/analytics.ts` and `src/components/analytics/SiteAnalytics.tsx`: a
  wrapper that strips the query string before a pageview is sent, so `/search/?q=`
  never leaves the device.
- `tests/unit/analytics.test.ts` (29 lines).

**Changed**
- The root layout imports the wrapper instead of the vendor component;
  `docs/security.md` records the rule.

### Add cookieless page counting, and tell readers the truth about it — `4f6d4ae`

_13 files, +166 −39_

**Added**
- `@vercel/analytics` `^2.0.1` and `<Analytics />` in the root layout. It posts
  to same-origin `/_vercel/insights/*` and reports nothing when the site is not
  hosted on Vercel; no cookie is set.

**Changed**
- `/privacy/` gained a plain-language section on what is counted and what is not
  (no cookies, no cross-site profiling, search text excluded).
- About, footer and settings attribution copy updated; `SECURITY.md`,
  `docs/security.md` and `docs/verification.md` record the choice.
- End-to-end tests assert the disclosure and its links.

### Harden the static surface and write down what is left to decide — `e9e919d`

_8 files, +373 −11_

**Added**
- `SECURITY.md`, `docs/security.md` (threat model, headers, what a static export
  cannot do), `.github/dependabot.yml`, a CI audit step, and
  `tests/e2e/security.spec.ts`.

**Changed**
- `scripts/serve-static.mjs` now sends the policy the deployed site is expected
  to run under: `default-src 'self'`, `base-uri`/`object-src` `none`,
  `frame-ancestors 'none'`, `form-action 'self'`, `img-src 'self' data:`,
  `media-src`/`connect-src` limited to the pinned audio origin, plus
  `Referrer-Policy`, `X-Frame-Options: DENY`, `nosniff` and `Permissions-Policy`.
  The two inline allowances (Next's hydration bootstrap, Tajweed inline styles)
  are documented as unavoidable without nonces.
- Server accepts `GET`/`HEAD` only (405 otherwise), returns 400 on malformed
  percent-encoding or NUL bytes, and checks path containment with
  `path.relative` instead of a string prefix test, which had also accepted
  sibling directories sharing the prefix.

### Tighten the side key so more of it fits a shorter screen — `3dcebed`

_2 files, +4 −4_

**Changed**
- Reduced vertical spacing in the compact Tajweed key and reworded the hint to
  "Colours show when Tajweed is on."

### Keep the side key clear of the recitation bar — `a242e9f`

_1 file, +6 −1_

**Fixed**
- The sticky reader key now caps its height at `100dvh - 16rem` while the audio
  bar is visible, instead of being covered by it.

### Name every highlight and every sign, and keep the key beside the ayat — `13f7f74`

_17 files, +810 −175_

**Added**
- `/tajweed/` reference page (166 lines): highlights, signs in the text, the
  fifteen prostration verses, small marks, and a note on what is certain in the
  source annotations.
- `src/data/text-marks.ts` (150 lines) naming each standalone sign, rendered by
  `TextMarks.tsx` and `ReaderKey.tsx`.
- `TajweedRules.tsx`, a shared rules list used by the page and the side key.
- `tests/unit/text-marks.test.ts`.

**Changed**
- The reader keeps the key beside the ayahs on large screens instead of folding
  it away; `TajweedLegend` was reworked around the shared rules.
- About, accuracy and privacy pages describe the annotations and their limits;
  the axe suite covers the new route.

### Point the accuracy disclaimer's contact link at the published issue tracker — `d30fb49`

_2 files, +13 −1_

**Changed**
- The About page's accuracy disclaimer links to
  `github.com/cubecodefowad/Mushafly/issues` (`target="_blank"`,
  `rel="noreferrer"`) instead of mentioning a tracker without a link.
- Content test asserts the link and its `href`.

### Initial commit: Mushafly, a static Quran reader built from a pinned dataset — `1925b98`

_550 files, +15,034_

**Added**
- The whole first version: all 114 surahs prerendered at build time from
  `semarketir/quranjson` at commit `7ca6f46`, with Tajweed highlighting derived
  from the source annotations, verse-by-verse recitation, browser-local
  bookmarks and last-read, and Arabic/English search.
- Routes: home with continue-reading and surah directory, `/surah/[number]/`,
  `/search/`, `/bookmarks/`, `/settings/`, `/about/`, `/accuracy/`, `/privacy/`,
  `/terms/`, plus a 404.
- Reader components: `Reader`, `Verse`, `SurahHeader`, `AudioBar`,
  `useSurahAudio` (single `Audio` element, verse queue, repeat, seek, volume),
  settings provider/sheet/client with theme script, reading-state provider,
  search client, Tajweed legend.
- Build pipeline: `prepare-data.mjs` (revision and hash checks against
  `source-lock.json`), `validate-quran-data.mjs`, `generate-source-lock.mjs`,
  `build-search-index.mjs`, `generate-brand-assets.mjs`,
  `measure-performance.mjs`, `serve-static.mjs` (gzip + cache headers).
- Runtime data committed under `public/quran/`: 114 surah files, 114 Tajweed
  files, 114 English translations, 114 audio indexes, the search index, juz and
  metadata — so the build needs no network.
- Self-hosted Amiri Quran, Inter and Source Serif 4 WOFF2 with licences, brand
  marks per theme, favicons and Apple touch icon, and the legal pages
  (Terms, Privacy, Accuracy and Sources) shared by About and the reader footer.
- CI workflow, Playwright config (Chromium, Firefox, WebKit), Vitest config and
  the first unit and end-to-end suites, plus `README.md`,
  `THIRD_PARTY_NOTICES.md`, `LICENSE` and `docs/`.

## Totals

- 14 commits between 2026-10-18 and 2026-10-20.
- `git diff --shortstat 1925b98 HEAD`: 7,788 files changed, +450,724 −445.
- Reading surface today: 68 translation datasets across 29 languages, Tajweed
  annotation plus a named sign key, verse audio pinned by commit, local
  bookmarks/last-read/settings, and a static export of 114 prerendered surah
  pages plus the reference routes.

## Notes

- History starts at the root commit; nothing before it is available, and the
  initial commit already contains the complete first version.
- There are no tags, so no version numbers are implied above.
- Test counts are not listed per commit because the suites were not re-run
  against each historical revision.
