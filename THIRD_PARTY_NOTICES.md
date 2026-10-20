# Third-party notices

Mushafly's application code is MIT licensed (see `LICENSE`). The following
content and assets are used under their own terms. The Mushafly name and leaf
mark are the project's own artwork and are not third-party assets.

## Quran data — semarketir/quranjson

Repository: <https://github.com/semarketir/quranjson>
Pinned revision: `7ca6f46ec9a1a029cdb220c2531d509f4a5b5e98` (2021-02-16)
License: MIT

The MIT License (MIT)

Copyright (c) 2015 Semar Ketir

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

The repository's MIT license covers the repository's software. It does not by
itself resolve separate content licenses for translation or audio; those
attributions are preserved below.

## English translation — Talal Itani

From `source/translation/en/.sources` in the pinned revision:

- Name: Itani
- Translator: Talal Itani
- Language: English
- ID: `en.itani`
- Last update: July 19, 2013
- Source: Tanzil.net

The translation is displayed exactly as supplied in the pinned dataset. Anyone
redistributing this application should verify the current Tanzil.net terms for
the translation text.

## Indonesian translation — Indonesian Ministry of Religious Affairs

From `source/translation/id/.sources` in the pinned revision:

- Name: Bahasa Indonesia
- Translator: Indonesian Ministry of Religious Affairs
- Language: Indonesian
- ID: `id.indonesian`
- Last update: June 4, 2010
- Source: Tanzil.net

The translation is displayed exactly as supplied in the pinned dataset. Anyone
redistributing this application should verify the current Tanzil.net terms for
the translation text.

## Arabic commentary — Tafsir al-Muyassar

From `source/translation/ar/.sources` in the pinned revision:

- Name: تفسير المیسر (Tafsir al-Muyassar)
- Translator: King Fahad Quran Complex
- Language: Arabic
- ID: `ar.muyassar`
- Source: alquran.cloud

This dataset is a commentary (tafsir), not a translation of the ayah. It is
displayed exactly as supplied in the pinned dataset and has no entry for the
unnumbered Bismillah row. The upstream `.sources` file records no last-update
date; the application does not invent one. Anyone redistributing this
application should verify the current terms for the commentary text.

## Tanzil translation corpus

Source: <https://tanzil.net/trans/>
Downloaded: October 2026
Integrated: 65 translation datasets across 29 languages
Excluded: `ku.asan` and `sq.mehdiu` (empty verse records in Tanzil's XML)

Tanzil's terms state that the translations are for non-commercial purposes
only; other use requires permission from the translator or publisher. When more
than three translations are used in an application, Tanzil requires a link back
to <https://tanzil.net/trans/>. Mushafly links back in the reader footer, the
Settings attribution panel, the Accuracy page and the Terms page.

The source XML is not modified. The conversion pipeline removes the leading
metadata comment in memory because `--` is illegal inside an XML comment. The
comment separators are not part of any translation. Verse text is decoded from
XML entities and written unchanged. The two excluded datasets remain in
`data/tanzil/xml/` with their source text; no verses were inferred, copied from
another edition, or silently dropped. The exact per-dataset attribution and
the excluded verse references are in `data/tanzil/manifest.json`,
`src/data/generated/tanzil-excluded.json` and `docs/tanzil-validation.md`.

## Recitation — Saad Al-Ghamadi

From `source/audio/.sources` in the pinned revision:

- Reciter: Ghamadi (Saad Al-Ghamadi)
- Source: versebyversequran.com
- License reference: <http://www.versebyversequran.com/site/licence/>
- Encoding: approximately 40 kbps MP3

Audio is streamed at runtime from immutable URLs at the pinned repository
revision. It is not bundled with this application.

## Fonts

All fonts are used under the SIL Open Font License 1.1. The license texts are
served with the application and included in `public/fonts/`.

- **Amiri Quran** — Copyright 2010–2022 The Amiri Quran Project Authors
  (<https://github.com/aliftype/amiri>). License:
  [`public/fonts/OFL-AmiriQuran.txt`](public/fonts/OFL-AmiriQuran.txt).
- **Source Serif 4** — Adobe. License:
  [`public/fonts/OFL-SourceSerif4.txt`](public/fonts/OFL-SourceSerif4.txt).
- **Inter** — The Inter Project Authors. License:
  [`public/fonts/OFL-Inter.txt`](public/fonts/OFL-Inter.txt).
- **Noto Nastaliq Urdu** — Copyright 2022 The Noto Project Authors
  (<https://github.com/notofonts/nastaliq>). License:
  [`public/fonts/OFL-NotoNastaliqUrdu.txt`](public/fonts/OFL-NotoNastaliqUrdu.txt).
