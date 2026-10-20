# Tanzil translations (XML)

The translation corpus requested for Mushafly, downloaded directly from
[Tanzil](https://tanzil.net/trans/) in Tanzil's XML format.

## Contents

- `xml/<tanzil-id>.xml` — 67 translations covering 30 languages.
- `manifest.json` — machine-readable index: language, translator, native name,
  last update, file size, SHA-256, and verse counts, plus the requested
  attribution (`requestedAs`) for every file.

Every file was validated after download:

- 114 `<sura>` elements
- 6,236 `<aya>` elements, all self-closing
- translation ID in the XML header matches the file name
- no unescaped XML entities
- parses as XML 1.0 with a strict parser

The two Arabic entries (`ar.jalalayn`, `ar.muyassar`) are tafsir works, not
word-for-word translations; they are included because they were requested.

## Integration status

`npm run data:prepare` converts the XML into `public/quran/translation/<id>/`.
65 datasets are integrated. `ku.asan` and `sq.mehdiu` are **excluded** because
their live Tanzil XML contains empty verse records (`108:3` and `21:56`, `77:14`
respectively); no text was inferred or copied from another edition. The
exclusion is recorded in `src/data/generated/tanzil-excluded.json`, and the
full check-by-check result is in
[`../../docs/tanzil-validation.md`](../../docs/tanzil-validation.md).

## Source fidelity

Tanzil's own XML is not well-formed: the metadata comment contains long
`# -----` separator lines, and `--` is illegal inside an XML comment. The
downloader therefore makes exactly two kinds of repair, both recorded:

1. **Comment separators** — runs of `-` inside the metadata comment become `=`.
   Two lines per file; no metadata values are affected. The document body
   (everything after the comment) is byte-identical to Tanzil's response.
2. **Illegal control characters** — `ps.abdulwali.xml` contains four characters
   that XML 1.0 cannot represent: U+0016 in verses 6:69, 36:8 and 41:44, plus
   U+001A in 6:69. They are removed, and the entry's `repairs` array in
   `manifest.json` records it.

`manifest.json` hashes describe the repaired files, not Tanzil's raw bytes.

## Download or refresh

```bash
npm run data:tanzil
# or
node scripts/download-tanzil-translations.mjs
```

- Existing valid files are reused. Pass `--force` to re-download everything.
- `--dry-run` lists the requested translations without writing anything.
- Downloads are sequential-ish (3 concurrent, 200 ms apart) with retries.

Tanzil updates individual translations over time, so re-running refreshes the
snapshot. `manifest.json` records the Tanzil `Last Update` date for each file.

## Format

```xml
<?xml version="1.0" encoding="utf-8" ?>
<!--
#  Quran Translation
#  Name: Saheeh International
#  Translator: Saheeh International
#  Language: English
#  ID: en.sahih
#  Last Update: March 21, 2011
#  Source: Tanzil.net
-->
<quran>
  <sura index="1" name="">
    <aya index="1" text="In the name of Allah, the Entirely Merciful, the Especially Merciful."/>
    ...
```

Tanzil's XML contains only the 6,236 numbered verses; the basmala is not a
separate verse, and `<sura>` names are empty. Byte content is preserved exactly
as downloaded, including each file's original line endings.

## Terms of use

From <https://tanzil.net/trans/>:

> The translations provided at this page are for non-commercial purposes only.
> If used otherwise, you need to obtain necessary permission from the translator
> or the publisher.
>
> If you are using more than three of the following translations in a website or
> application, we require you to put a link back to this page to make sure that
> subsequent users have access to the latest updates.
>
> Redistributing the following list in another website is not allowed, unless
> direct permission is granted by the Tanzil Project.

Mushafly must therefore link back to <https://tanzil.net/trans/> wherever these
translations are offered, and must not present the corpus as its own. The
repository's MIT license does not cover these translation texts.
