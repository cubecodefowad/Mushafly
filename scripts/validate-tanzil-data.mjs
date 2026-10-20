/**
 * Validates the generated Tanzil datasets against the source XML.
 *
 * Fails on any missing, duplicate, empty, malformed or altered verse. The
 * report is written to docs/tanzil-validation.md and data/tanzil/validation-report.json.
 */
import fs from "node:fs";
import path from "node:path";
import {
  EXCLUDED_TANZIL,
  TANZIL_MANIFEST_PATH,
  TANZIL_META_PATH,
  TANZIL_XML_ROOT,
  TRANSLATION_ROOT,
  parseTanzilXml,
  readSurahMeta,
} from "./lib/tanzil.mjs";

const errors = [];
const fail = (message) => errors.push(message);
const pad3 = (n) => String(n).padStart(3, "0");

const manifest = JSON.parse(fs.readFileSync(TANZIL_MANIFEST_PATH, "utf8"));
const metadata = JSON.parse(fs.readFileSync(TANZIL_META_PATH, "utf8"));
const surahMeta = readSurahMeta();
const metadataById = new Map(metadata.map((entry) => [entry.id, entry]));

const samples = new Map();

function sampleFor(id, surah, verse, text) {
  const entry = samples.get(id) ?? {};
  entry[`${surah}:${verse}`] = text;
  samples.set(id, entry);
}

const report = [];

for (const source of manifest.translations) {
  const xmlPath = path.join(TANZIL_XML_ROOT, `${source.id}.xml`);
  if (!fs.existsSync(xmlPath)) {
    fail(`${source.id}: source XML is missing`);
    continue;
  }

  const xmlBytes = fs.statSync(xmlPath).size;
  const xml = fs.readFileSync(xmlPath, "utf8");
  let parsed;
  try {
    parsed = parseTanzilXml(xml, source.id, {
      allowEmpty: Boolean(EXCLUDED_TANZIL[source.id]),
    });
  } catch (error) {
    fail(`${source.id}: XML parse failed: ${error.message}`);
    continue;
  }

  const { header, suras } = parsed;
  if (
    header.Name !== source.name ||
    header.Translator !== source.translator ||
    header.Language !== source.language ||
    header["Last Update"] !== source.lastUpdate
  ) {
    fail(`${source.id}: XML header does not match the download manifest`);
  }

  if (EXCLUDED_TANZIL[source.id]) {
    const empty = [];
    for (const sura of suras) {
      for (const aya of sura.verses) {
        if (aya.text.length === 0) empty.push(`${sura.index}:${aya.index}`);
      }
    }
    const expected = EXCLUDED_TANZIL[source.id].empty;
    if (JSON.stringify(empty) !== JSON.stringify(expected)) {
      fail(
        `${source.id}: excluded dataset's empty verses changed ` +
          `(expected ${expected.join(", ")}, found ${empty.join(", ") || "none"})`,
      );
    }
    const output = path.join(TRANSLATION_ROOT, source.id);
    if (fs.existsSync(output)) {
      fail(`${source.id}: excluded dataset must not have generated JSON`);
    }
    report.push({
      id: source.id,
      language: source.language,
      translator: source.translator,
      status: "excluded",
      reason: EXCLUDED_TANZIL[source.id].reason,
      rows: 0,
      bytes: xmlBytes,
    });
    continue;
  }

  const meta = metadataById.get(source.id);
  if (!meta) {
    fail(`${source.id}: missing generated metadata entry`);
    continue;
  }
  if (
    meta.translator !== source.translator ||
    meta.language !== source.language ||
    meta.source !== "Tanzil.net"
  ) {
    fail(`${source.id}: generated metadata differs from the download manifest`);
  }

  const targetDir = path.join(TRANSLATION_ROOT, source.id);
  if (!fs.existsSync(targetDir)) {
    fail(`${source.id}: generated JSON directory is missing`);
    continue;
  }

  let rows = 0;
  let bytes = 0;
  for (const [position, sura] of suras.entries()) {
    const surahNumber = position + 1;
    const file = path.join(targetDir, `${pad3(surahNumber)}.json`);
    if (!fs.existsSync(file)) {
      fail(`${source.id}: missing ${pad3(surahNumber)}.json`);
      continue;
    }
    const buffer = fs.readFileSync(file);
    bytes += buffer.length;

    let json;
    try {
      json = JSON.parse(buffer.toString("utf8"));
    } catch (error) {
      fail(`${source.id}: invalid JSON in ${pad3(surahNumber)}.json: ${error.message}`);
      continue;
    }

    const metaSurah = surahMeta[position];
    if (json.index !== pad3(surahNumber)) {
      fail(`${source.id}: index mismatch in ${pad3(surahNumber)}.json`);
    }
    if (json.count !== metaSurah.verseCount) {
      fail(
        `${source.id}: count mismatch in ${pad3(surahNumber)}.json ` +
          `(${json.count} vs ${metaSurah.verseCount})`,
      );
    }
    if (!json.verse || typeof json.verse !== "object") {
      fail(`${source.id}: missing verse object in ${pad3(surahNumber)}.json`);
      continue;
    }

    const expectedKeys = sura.verses.map((aya) => `verse_${aya.index}`);
    const actualKeys = Object.keys(json.verse);
    if (
      actualKeys.length !== expectedKeys.length ||
      !expectedKeys.every((key) => key in json.verse)
    ) {
      fail(`${source.id}: verse keys do not match the XML at sura ${surahNumber}`);
    }

    for (const aya of sura.verses) {
      const key = `verse_${aya.index}`;
      const value = json.verse[key];
      if (typeof value !== "string") {
        fail(`${source.id}: non-string value at ${surahNumber}:${aya.index}`);
        continue;
      }
      if (value.length === 0) {
        fail(`${source.id}: empty translation at ${surahNumber}:${aya.index}`);
      }
      if (value !== aya.text) {
        fail(`${source.id}: text mismatch at ${surahNumber}:${aya.index}`);
      }
      if (/[\uFFFD\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value)) {
        fail(`${source.id}: invalid character at ${surahNumber}:${aya.index}`);
      }
      rows++;
      if (
        (surahNumber === 1 && aya.index === 1) ||
        (surahNumber === 2 && aya.index === 255) ||
        (surahNumber === 114 && aya.index === 6)
      ) {
        sampleFor(source.id, surahNumber, aya.index, value);
      }
    }
  }

  if (rows !== 6236) fail(`${source.id}: expected 6236 rows, found ${rows}`);

  report.push({
    id: source.id,
    language: source.language,
    translator: source.translator,
    status: "ok",
    suras: suras.length,
    rows,
    bytes,
    xmlBytes,
    direction: meta.direction,
    htmlLang: meta.htmlLang,
  });
}

// The three original quranjson datasets must still be present and untouched.
for (const language of ["en", "id", "ar"]) {
  if (!fs.existsSync(path.join(TRANSLATION_ROOT, language))) {
    fail(`original ${language} translation directory is missing`);
  }
}

const integrated = report.filter((entry) => entry.status === "ok");
const excluded = report.filter((entry) => entry.status === "excluded");
const rows = integrated.reduce((total, entry) => total + entry.rows, 0);

const generatedDirs = fs
  .readdirSync(TRANSLATION_ROOT, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
const expectedDirs = [
  "ar",
  "en",
  "id",
  ...integrated.map((entry) => entry.id),
].sort();
if (JSON.stringify(generatedDirs) !== JSON.stringify(expectedDirs)) {
  fail(
    `translation directories differ from the expected set: ` +
      `${generatedDirs.join(", ")}`,
  );
}

const now = new Date().toISOString();
const jsonReport = {
  generatedAt: now,
  summary: {
    integrated: integrated.length,
    excluded: excluded.length,
    surahs: 114,
    versesPerTranslation: 6236,
    totalRows: rows,
    errors: errors.length,
  },
  integrated,
  excluded,
  samples: Object.fromEntries(samples),
  errors,
};
fs.writeFileSync(
  path.resolve("data/tanzil/validation-report.json"),
  JSON.stringify(jsonReport, null, 2) + "\n",
);

const lines = [
  "# Tanzil integration validation",
  "",
  `Generated: ${now}`,
  "",
  `- Integrated translations: **${integrated.length}**`,
  `- Excluded translations: **${excluded.length}**`,
  `- Surahs per translation: **114**`,
  `- Ayahs per translation: **6,236**`,
  `- Total generated verse rows: **${rows.toLocaleString("en")}**`,
  `- Errors: **${errors.length}**`,
  "",
  "## Excluded source datasets",
  "",
  "These files were not integrated because Tanzil's XML contains empty verse",
  "records. No text was inferred, copied from another edition, or skipped",
  "silently.",
  "",
  "| Dataset | Language | Translator | Empty source verses |",
  "| --- | --- | --- | --- |",
  ...excluded.map(
    (entry) =>
      `| \`${entry.id}\` | ${entry.language} | ${entry.translator} | ${EXCLUDED_TANZIL[entry.id].empty.join(", ")} |`,
  ),
  "",
  "## Integrated datasets",
  "",
  "| Dataset | Language | Translator | Rows | Direction | Exact text match |",
  "| --- | --- | --- | ---: | --- | --- |",
  ...integrated.map(
    (entry) =>
      `| \`${entry.id}\` | ${entry.language} | ${entry.translator} | ${entry.rows.toLocaleString("en")} | ${entry.direction} | yes |`,
  ),
  "",
  "## Sample verses",
  "",
  "| Dataset | 1:1 | 2:255 | 114:6 |",
  "| --- | --- | --- | --- |",
  ...integrated.map((entry) => {
    const sample = samples.get(entry.id) ?? {};
    const cell = (key) => (sample[key] ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
    return `| \`${entry.id}\` | ${cell("1:1")} | ${cell("2:255")} | ${cell("114:6")} |`;
  }),
  "",
  errors.length
    ? "## Errors\n\n" + errors.map((error) => `- ${error}`).join("\n")
    : "## Result\n\nAll checks passed.",
  "",
];
fs.writeFileSync(path.resolve("docs/tanzil-validation.md"), lines.join("\n") + "\n");

if (errors.length) {
  console.error(`FAILED with ${errors.length} error(s):`);
  for (const error of errors.slice(0, 50)) console.error(`  - ${error}`);
  if (errors.length > 50) console.error(`  ... and ${errors.length - 50} more`);
  process.exit(1);
}

console.log(
  `Validated ${integrated.length} Tanzil translations, ${rows.toLocaleString("en")} rows; ` +
    `${excluded.length} excluded (empty source verses).`,
);
console.log("Report: docs/tanzil-validation.md");
