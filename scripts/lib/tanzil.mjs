/**
 * Converts the downloaded Tanzil translation XML into Mushafly's per-surah
 * JSON format and writes the metadata used to register each dataset.
 *
 * The XML is read-only. Tanzil's header comment is removed in memory before
 * parsing because the original comment contains `--` separator runs, which
 * XML 1.0 forbids inside comments. Nothing outside that leading comment is
 * rewritten; verse text is decoded from XML entities and preserved exactly.
 */
import fs from "node:fs";
import path from "node:path";

export const TANZIL_ROOT = path.resolve("data/tanzil");
export const TANZIL_XML_ROOT = path.join(TANZIL_ROOT, "xml");
export const TANZIL_MANIFEST_PATH = path.join(TANZIL_ROOT, "manifest.json");
export const TANZIL_META_PATH = path.resolve(
  "src/data/generated/tanzil-translations.json",
);
export const TANZIL_KEYS_PATH = path.resolve("src/data/generated/tanzil-keys.ts");
export const TANZIL_EXCLUDED_PATH = path.resolve(
  "src/data/generated/tanzil-excluded.json",
);
export const SURAH_META_PATH = path.resolve("src/data/generated/surah-meta.json");
export const TRANSLATION_ROOT = path.resolve("public/quran/translation");

const RTL_LANGUAGES = new Set(["ar", "fa", "ku", "ps", "sd", "ug", "ur"]);

/**
 * Tanzil translations with empty verse records in the live XML. They are not
 * integrated because Mushafly requires every verse to carry text; filling or
 * skipping them would change the source. Kept here so the exclusion is
 * explicit and is re-checked against the source on every conversion.
 */
export const EXCLUDED_TANZIL = {
  "ku.asan": {
    reason: "Tanzil XML has an empty translation at 108:3.",
    empty: ["108:3"],
  },
  "sq.mehdiu": {
    reason: "Tanzil XML has empty translations at 21:56 and 77:14.",
    empty: ["21:56", "77:14"],
  },
};

const HTML_LANG = {
  ar: "ar",
  am: "am",
  az: "az",
  bn: "bn",
  bs: "bs",
  de: "de",
  en: "en",
  es: "es",
  fa: "fa",
  fr: "fr",
  ha: "ha",
  hi: "hi",
  id: "id",
  it: "it",
  ku: "ckb",
  ml: "ml",
  ms: "ms",
  pt: "pt",
  ps: "ps",
  ru: "ru",
  sd: "sd",
  so: "so",
  sq: "sq",
  sv: "sv",
  sw: "sw",
  tr: "tr",
  tt: "tt",
  ug: "ug",
  ur: "ur",
  uz: "uz",
};

/** Short labels for selectors where the Tanzil native name is not Latin. */
const SHORT_NAMES = {
  "am.sadiq": "Sadiq & Sani Habib",
  "ar.jalalayn": "Jalalayn",
  "ar.muyassar": "Muyassar (Tanzil)",
  "bn.bengali": "Muhiuddin Khan",
  "bn.hoque": "Zohurul Hoque",
  "fa.khorramdel": "Khorramdel",
  "hi.farooq": "Farooq Khan & Ahmed",
  "hi.hindi": "Suhel Farooq & Nadwi",
  "id.indonesian": "Indonesian Ministry (Tanzil)",
  "id.muntakhab": "Quraish Shihab",
  "ku.asan": "Burhan Muhammad-Amin",
  "ml.abdulhameed": "Abdul Hameed & Parappoor",
  "ml.karakunnu": "Karakunnu & Elayavoor",
  "ps.abdulwali": "Abdulwali Khan",
  "ru.abuadel": "Abu Adel",
  "ru.kalam": "Kalam Sharif",
  "ru.kuliev": "Kuliev",
  "ru.kuliev-alsaadi": "Kuliev + as-Saadi",
  "ru.muntahab": "Al-Muntakhab",
  "ru.osmanov": "Osmanov",
  "sd.amroti": "Taj Mehmood Amroti",
  "tr.bulac": "Ali Bulaç",
  "tt.nugman": "Yakub Ibn Nugman",
  "ug.saleh": "Muhammad Saleh",
  "ur.ahmedali": "Ahmed Ali",
  "ur.jalandhry": "Jalandhry",
  "ur.junagarhi": "Junagarhi",
  "ur.kanzuliman": "Kanzul Iman",
  "ur.maududi": "Maududi",
  "ur.qadri": "Tahir ul Qadri",
  "uz.sodik": "Muhammad Sodik",
};

const ENTITIES = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  quot: '"',
};

const INVALID_XML_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/;

function pad3(n) {
  return String(n).padStart(3, "0");
}

/**
 * Returns the header metadata and removes the leading XML declaration and
 * comment from the document. The comment is the only malformed region in
 * Tanzil's original output; the root element and verse records are untouched.
 */
export function readTanzilDocument(xml) {
  const headerMatch = xml.match(
    /^(?:\uFEFF)?\s*<\?xml[^>]*\?>\s*<!--([\s\S]*?)-->\s*/,
  );
  if (!headerMatch) {
    throw new Error("missing Tanzil XML declaration or metadata comment");
  }

  const header = {};
  for (const line of headerMatch[1].split(/\r?\n/)) {
    const match = line.match(/^#\s*([A-Za-z ]+):\s*(.*)$/);
    if (match) header[match[1].trim()] = match[2].trim();
  }

  for (const field of ["Name", "Translator", "Language", "ID", "Last Update"]) {
    if (!header[field]) throw new Error(`Tanzil header is missing ${field}`);
  }

  return { header, body: xml.slice(headerMatch[0].length) };
}

function decodeXml(value, context) {
  if (INVALID_XML_CHARS.test(value)) {
    throw new Error(`illegal XML control character in ${context}`);
  }
  if (
    /&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/.test(value)
  ) {
    throw new Error(`unescaped ampersand in ${context}`);
  }

  return value.replace(/&(#x?[0-9a-fA-F]+|[a-z]+);/g, (entity, name) => {
    if (name.startsWith("#")) {
      const codePoint =
        name[1] === "x" || name[1] === "X"
          ? Number.parseInt(name.slice(2), 16)
          : Number.parseInt(name.slice(1), 10);
      if (
        !Number.isInteger(codePoint) ||
        codePoint <= 0 ||
        codePoint > 0x10ffff ||
        (codePoint >= 0xd800 && codePoint <= 0xdfff) ||
        INVALID_XML_CHARS.test(String.fromCodePoint(codePoint))
      ) {
        throw new Error(`invalid character reference ${entity} in ${context}`);
      }
      return String.fromCodePoint(codePoint);
    }
    if (!(name in ENTITIES)) {
      throw new Error(`unknown XML entity ${entity} in ${context}`);
    }
    return ENTITIES[name];
  });
}

function parseAttributes(source, context) {
  const attributes = {};
  const pattern = /\s+([A-Za-z_][\w:.-]*)\s*=\s*"([^"]*)"/g;
  let cursor = 0;
  let match;

  while ((match = pattern.exec(source))) {
    if (source.slice(cursor, match.index).trim() !== "") {
      throw new Error(`malformed attributes in ${context}`);
    }
    if (match[1] in attributes) {
      throw new Error(`duplicate attribute ${match[1]} in ${context}`);
    }
    attributes[match[1]] = decodeXml(match[2], context);
    cursor = pattern.lastIndex;
  }

  if (source.slice(cursor).trim() !== "") {
    throw new Error(`malformed attributes in ${context}`);
  }
  return attributes;
}

const TAG_BODY = String.raw`((?:[^>"']|"[^"]*"|'[^']*')*)`;
const TOKEN_PATTERN = new RegExp(
  String.raw`<sura\b${TAG_BODY}>|<\/sura>|<aya\b${TAG_BODY}\/>`,
  "g",
);

/**
 * Parses a Tanzil XML document into `{ header, suras }`.
 * Throws on any structural surprise rather than skipping records.
 */
export function parseTanzilXml(xml, expectedId, { allowEmpty = false } = {}) {
  const { header, body } = readTanzilDocument(xml);
  if (header.ID !== expectedId) {
    throw new Error(
      `header ID ${JSON.stringify(header.ID)} does not match ${JSON.stringify(expectedId)}`,
    );
  }

  const root = body.match(/^<quran>\s*([\s\S]*?)\s*<\/quran>\s*$/);
  if (!root) throw new Error("expected a single <quran> root element");

  const suras = [];
  let current = null;
  let cursor = 0;
  let match;

  TOKEN_PATTERN.lastIndex = 0;
  while ((match = TOKEN_PATTERN.exec(root[1]))) {
    if (root[1].slice(cursor, match.index).trim() !== "") {
      throw new Error(`unexpected content before offset ${match.index}`);
    }

    if (match[1] !== undefined) {
      if (current) throw new Error("nested <sura> element");
      const attributes = parseAttributes(match[1], "sura");
      if (Object.keys(attributes).some((key) => key !== "index" && key !== "name")) {
        throw new Error(`unexpected <sura> attribute in sura ${attributes.index}`);
      }
      const index = Number(attributes.index);
      if (!Number.isInteger(index)) throw new Error("sura index is not an integer");
      current = { index, name: attributes.name ?? "", verses: [] };
    } else if (match[2] !== undefined) {
      if (!current) throw new Error("aya outside a sura");
      const attributes = parseAttributes(match[2], `aya in sura ${current.index}`);
      if (Object.keys(attributes).some((key) => key !== "index" && key !== "text")) {
        throw new Error(`unexpected <aya> attribute in sura ${current.index}`);
      }
      const index = Number(attributes.index);
      if (!Number.isInteger(index)) {
        throw new Error(`aya index is not an integer in sura ${current.index}`);
      }
      if (typeof attributes.text !== "string") {
        throw new Error(`aya text is missing at ${current.index}:${index}`);
      }
      if (!allowEmpty && attributes.text.length === 0) {
        throw new Error(`empty aya text at ${current.index}:${index}`);
      }
      current.verses.push({ index, text: attributes.text });
    } else {
      if (!current) throw new Error("closing </sura> without an open sura");
      suras.push(current);
      current = null;
    }

    cursor = TOKEN_PATTERN.lastIndex;
  }

  if (current) throw new Error(`unclosed sura ${current.index}`);
  if (root[1].slice(cursor).trim() !== "") {
    throw new Error("unexpected content after the final sura");
  }
  if (suras.length !== 114) {
    throw new Error(`expected 114 suras, found ${suras.length}`);
  }

  let total = 0;
  for (const [position, sura] of suras.entries()) {
    const expected = position + 1;
    if (sura.index !== expected) {
      throw new Error(`sura ${expected} is out of order (found ${sura.index})`);
    }
    if (sura.verses.length === 0) {
      throw new Error(`sura ${expected} has no ayas`);
    }
    for (const [versePosition, verse] of sura.verses.entries()) {
      if (verse.index !== versePosition + 1) {
        throw new Error(
          `sura ${expected} aya ${versePosition + 1} is out of order (found ${verse.index})`,
        );
      }
      if (INVALID_XML_CHARS.test(verse.text)) {
        throw new Error(`illegal control character at ${expected}:${verse.index}`);
      }
      if (verse.text.includes("\uFFFD")) {
        throw new Error(`replacement character at ${expected}:${verse.index}`);
      }
    }
    total += sura.verses.length;
  }

  if (total !== 6236) {
    throw new Error(`expected 6236 ayas, found ${total}`);
  }

  return { header, suras };
}

function shortName(entry) {
  if (SHORT_NAMES[entry.id]) return SHORT_NAMES[entry.id];
  if (/[A-Za-z]/.test(entry.name)) return entry.name;
  return entry.translator;
}

function directionFor(id) {
  return RTL_LANGUAGES.has(id.split(".")[0]) ? "rtl" : "ltr";
}

function htmlLangFor(id) {
  const prefix = id.split(".")[0];
  return HTML_LANG[prefix] ?? prefix;
}

export function readSurahMeta() {
  return JSON.parse(fs.readFileSync(SURAH_META_PATH, "utf8"));
}

/**
 * Converts every translation listed in data/tanzil/manifest.json.
 * Returns the metadata array that is also written to src/data/generated.
 */
export function convertTanzilTranslations({ write = true } = {}) {
  const manifest = JSON.parse(fs.readFileSync(TANZIL_MANIFEST_PATH, "utf8"));
  const surahMeta = readSurahMeta();
  if (!Array.isArray(manifest.translations) || manifest.translations.length === 0) {
    throw new Error("Tanzil manifest has no translations");
  }

  const metadata = [];
  const excluded = [];

  for (const entry of manifest.translations) {
    const xmlPath = path.join(TANZIL_XML_ROOT, `${entry.id}.xml`);
    if (!fs.existsSync(xmlPath)) {
      throw new Error(`missing XML for ${entry.id}: ${xmlPath}`);
    }

    const xml = fs.readFileSync(xmlPath, "utf8");
    const exclusion = EXCLUDED_TANZIL[entry.id];
    const { header, suras } = parseTanzilXml(xml, entry.id, {
      allowEmpty: Boolean(exclusion),
    });

    if (exclusion) {
      const empty = [];
      for (const sura of suras) {
        for (const aya of sura.verses) {
          if (aya.text.length === 0) empty.push(`${sura.index}:${aya.index}`);
        }
      }
      if (JSON.stringify(empty) !== JSON.stringify(exclusion.empty)) {
        throw new Error(
          `${entry.id} exclusion is stale: expected empty verses ` +
            `${exclusion.empty.join(", ")}, found ${empty.join(", ") || "none"}`,
        );
      }
      if (write) {
        fs.rmSync(path.join(TRANSLATION_ROOT, entry.id), { recursive: true, force: true });
      }
      excluded.push({
        id: entry.id,
        name: entry.name,
        translator: entry.translator,
        language: entry.language,
        reason: exclusion.reason,
        emptyVerses: exclusion.empty,
      });
      continue;
    }

    if (
      header.Name !== entry.name ||
      header.Translator !== entry.translator ||
      header.Language !== entry.language ||
      header["Last Update"] !== entry.lastUpdate
    ) {
      throw new Error(`Tanzil manifest metadata differs from the header for ${entry.id}`);
    }

    const targetDir = path.join(TRANSLATION_ROOT, entry.id);
    if (write) {
      fs.rmSync(targetDir, { recursive: true, force: true });
      fs.mkdirSync(targetDir, { recursive: true });
    }

    let rows = 0;
    for (const [position, sura] of suras.entries()) {
      const meta = surahMeta[position];
      if (!meta || meta.number !== sura.index) {
        throw new Error(`surah metadata mismatch at ${entry.id} sura ${sura.index}`);
      }
      if (sura.verses.length !== meta.verseCount) {
        throw new Error(
          `verse count mismatch for ${entry.id} at sura ${sura.index}: ` +
            `XML ${sura.verses.length}, metadata ${meta.verseCount}`,
        );
      }

      const verse = {};
      for (const aya of sura.verses) {
        verse[`verse_${aya.index}`] = aya.text;
        rows++;
      }

      const payload = {
        name: meta.name,
        index: pad3(sura.index),
        verse,
        count: meta.verseCount,
      };

      if (write) {
        fs.writeFileSync(
          path.join(targetDir, `${pad3(sura.index)}.json`),
          JSON.stringify(payload) + "\n",
        );
      }
    }

    if (rows !== 6236) {
      throw new Error(`expected 6236 rows for ${entry.id}, wrote ${rows}`);
    }

    metadata.push({
      languageCode: entry.id,
      id: entry.id,
      label: entry.language,
      name: entry.name,
      shortName: shortName(entry),
      translator: entry.translator,
      source: "Tanzil.net",
      lastUpdate: entry.lastUpdate,
      direction: directionFor(entry.id),
      htmlLang: htmlLangFor(entry.id),
      language: entry.language,
      group: entry.language,
      rows,
      suras: 114,
    });
  }

  if (write) {
    fs.mkdirSync(path.dirname(TANZIL_META_PATH), { recursive: true });
    fs.writeFileSync(TANZIL_META_PATH, JSON.stringify(metadata, null, 2) + "\n");
    fs.writeFileSync(
      TANZIL_EXCLUDED_PATH,
      JSON.stringify(excluded, null, 2) + "\n",
    );

    const keys = metadata.map((entry) => entry.languageCode);
    fs.writeFileSync(
      TANZIL_KEYS_PATH,
      "// Generated by scripts/lib/tanzil.mjs. Do not edit by hand.\n" +
        "export type TanzilTranslationKey =\n" +
        keys.map((key) => `  | ${JSON.stringify(key)}`).join("\n") +
        ";\n",
    );
  }

  return metadata;
}
