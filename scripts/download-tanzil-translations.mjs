/**
 * Downloads the requested Tanzil Quran translations in Tanzil XML format.
 *
 * Source: https://tanzil.net/trans/?transID=<id>&type=xml
 * Terms: https://tanzil.net/trans/ — non-commercial use only; link back to the
 * translations page when more than three translations are used in an app.
 *
 * Usage:
 *   node scripts/download-tanzil-translations.mjs
 *   node scripts/download-tanzil-translations.mjs --force   (re-download all)
 *   node scripts/download-tanzil-translations.mjs --dry-run (list only)
 *
 * Output:
 *   data/tanzil/xml/<tanzil-id>.xml
 *   data/tanzil/manifest.json
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT_DIR = path.join(ROOT, "data", "tanzil");
const XML_DIR = path.join(OUT_DIR, "xml");
const MANIFEST_PATH = path.join(OUT_DIR, "manifest.json");
const BASE_URL = "https://tanzil.net/trans/";
const USER_AGENT =
  "Mozilla/5.0 (compatible; MushaflyTanzilDownloader/1.0; +https://tanzil.net/trans/)";
const CONCURRENCY = 3;
const REQUEST_DELAY_MS = 200;

const FORCE = process.argv.includes("--force");
const DRY_RUN = process.argv.includes("--dry-run");

/**
 * The request list, grouped exactly as the translations were requested.
 * `requestedAs` keeps the user-facing attribution next to Tanzil's own header.
 */
const REQUESTS = [
  { id: "ar.jalalayn", group: "Arabic", requestedAs: "Jalal ad-Din al-Mahalli and Jalal ad-Din as-Suyuti (Tafsir al-Jalalayn)" },
  { id: "ar.muyassar", group: "Arabic", requestedAs: "King Fahad Quran Complex (Tafsir Al-Muyassar)" },

  { id: "en.maududi", group: "English", requestedAs: "Abul Ala Maududi" },
  { id: "en.hilali", group: "English", requestedAs: "Muhammad Taqi-ud-Din al-Hilali and Muhammad Muhsin Khan (Hilali & Khan)" },
  { id: "en.mubarakpuri", group: "English", requestedAs: "Safi-ur-Rahman al-Mubarakpuri" },
  { id: "en.yusufali", group: "English", requestedAs: "Abdullah Yusuf Ali" },
  { id: "en.pickthall", group: "English", requestedAs: "Muhammad Marmaduke William Pickthall" },
  { id: "en.ahmedali", group: "English", requestedAs: "Ahmed Ali" },
  { id: "en.ahmedraza", group: "English", requestedAs: "Ahmed Raza Khan (Kanzul Iman)" },
  { id: "en.daryabadi", group: "English", requestedAs: "Abdul Majid Daryabadi" },
  { id: "en.qaribullah", group: "English", requestedAs: "Hasan al-Fatih Qaribullah and Ahmad Darwish" },
  { id: "en.sahih", group: "English", requestedAs: "Saheeh International" },
  { id: "en.wahiduddin", group: "English", requestedAs: "Wahiduddin Khan" },

  { id: "ur.maududi", group: "Urdu", requestedAs: "Abul A'ala Maududi" },
  { id: "ur.kanzuliman", group: "Urdu", requestedAs: "Ahmed Raza Khan" },
  { id: "ur.ahmedali", group: "Urdu", requestedAs: "Ahmed Ali" },
  { id: "ur.jalandhry", group: "Urdu", requestedAs: "Fateh Muhammad Jalandhry" },
  { id: "ur.qadri", group: "Urdu", requestedAs: "Tahir ul Qadri" },
  { id: "ur.junagarhi", group: "Urdu", requestedAs: "Muhammad Junagarhi" },

  { id: "fa.khorramdel", group: "Persian", requestedAs: "Mostafa Khorramdel" },

  { id: "tr.yazir", group: "Turkish", requestedAs: "Elmalılı Hamdi Yazır" },
  { id: "tr.bulac", group: "Turkish", requestedAs: "Ali Bulaç" },
  { id: "tr.ozturk", group: "Turkish", requestedAs: "Yaşar Nuri Öztürk" },
  { id: "tr.yildirim", group: "Turkish", requestedAs: "Suat Yıldırım" },
  { id: "tr.ates", group: "Turkish", requestedAs: "Süleyman Ateş" },
  { id: "tr.diyanet", group: "Turkish", requestedAs: "Diyanet İşleri (Official Turkish State Directorate)" },
  { id: "tr.vakfi", group: "Turkish", requestedAs: "Diyanet Vakfı (Official Turkish State Directorate)" },

  { id: "de.aburida", group: "German", requestedAs: "Abu Rida Muhammad ibn Ahmad ibn Rassoul" },
  { id: "de.bubenheim", group: "German", requestedAs: "A. S. F. Bubenheim and N. Elyas" },
  { id: "de.zaidan", group: "German", requestedAs: "Amir Zaidan" },

  { id: "fr.hamidullah", group: "French", requestedAs: "Muhammad Hamidullah" },

  { id: "ru.abuadel", group: "Russian", requestedAs: "Abu Adel" },
  { id: "ru.kuliev", group: "Russian", requestedAs: "Elmir Kuliev" },
  { id: "ru.kuliev-alsaadi", group: "Russian", requestedAs: "Elmir Kuliev with Abd ar-Rahman as-Saadi's commentary" },
  { id: "ru.osmanov", group: "Russian", requestedAs: "Magomed-Nuri Osmanovich Osmanov" },
  { id: "ru.kalam", group: "Russian", requestedAs: "Muslim Religious Board of the Republic of Tatarstan (Kalam Sharif)" },
  { id: "ru.muntahab", group: "Russian", requestedAs: "Ministry of Awqaf, Egypt (Al-Muntakhab)" },

  { id: "id.indonesian", group: "Indonesian & Malay", requestedAs: "Indonesian Ministry of Religious Affairs" },
  { id: "id.muntakhab", group: "Indonesian & Malay", requestedAs: "Muhammad Quraish Shihab" },
  { id: "ms.basmeih", group: "Indonesian & Malay", requestedAs: "Abdullah Muhammad Basmeih" },

  { id: "sq.nahi", group: "Albanian", requestedAs: "Efendi Nahi (Hasan Efendi Nahi)" },
  { id: "sq.mehdiu", group: "Albanian", requestedAs: "Feti Mehdiu" },
  { id: "sq.ahmeti", group: "Albanian", requestedAs: "Sherif Ahmeti" },

  { id: "ha.gumi", group: "Hausa", requestedAs: "Abubakar Mahmoud Gumi" },

  { id: "hi.farooq", group: "Hindi", requestedAs: "Muhammad Farooq Khan and Muhammad Ahmed" },
  { id: "hi.hindi", group: "Hindi", requestedAs: "Suhel Farooq Khan and Saifur Rahman Nadwi" },

  { id: "ml.abdulhameed", group: "Malayalam", requestedAs: "Cheriyamundam Abdul Hameed and Kunhi Mohammed Parappoor" },
  { id: "ml.karakunnu", group: "Malayalam", requestedAs: "Muhammad Karakunnu and Vanidas Elayavoor" },

  { id: "ku.asan", group: "Kurdish", requestedAs: "Burhan Muhammad-Amin (Kurdiu.org)" },

  { id: "ps.abdulwali", group: "Pashto", requestedAs: "Abdulwali Khan" },
  { id: "sd.amroti", group: "Sindhi", requestedAs: "Taj Mehmood Amroti" },
  { id: "so.abduh", group: "Somali", requestedAs: "Mahmud Muhammad Abduh" },
  { id: "sw.barwani", group: "Swahili", requestedAs: "Ali Muhsin Al-Barwani" },
  { id: "sv.bernstrom", group: "Swedish", requestedAs: "Knut Bernström" },

  { id: "tt.nugman", group: "Tatar, Uyghur & Uzbek", requestedAs: "Yakub Ibn Nugman (Tatar)" },
  { id: "ug.saleh", group: "Tatar, Uyghur & Uzbek", requestedAs: "Muhammad Saleh (Uyghur)" },
  { id: "uz.sodik", group: "Tatar, Uyghur & Uzbek", requestedAs: "Muhammad Sodik Muhammad Yusuf (Uzbek)" },

  { id: "bn.hoque", group: "Bengali", requestedAs: "Zohurul Hoque" },
  { id: "bn.bengali", group: "Bengali", requestedAs: "Muhiuddin Khan" },

  { id: "am.sadiq", group: "Amharic", requestedAs: "Muhammed Sadiq and Muhammed Sani Habib" },

  { id: "az.mammadaliyev", group: "Azerbaijani", requestedAs: "Vasim Mammadaliyev and Ziya Bunyadov" },
  { id: "az.musayev", group: "Azerbaijani", requestedAs: "Alikhan Musayev" },

  { id: "bs.korkut", group: "Bosnian", requestedAs: "Besim Korkut" },
  { id: "bs.mlivo", group: "Bosnian", requestedAs: "Mustafa Mlivo" },

  { id: "es.garcia", group: "Spanish", requestedAs: "Muhammad Isa García" },

  { id: "it.piccardo", group: "Italian & Portuguese", requestedAs: "Hamza Roberto Piccardo (Italian)" },
  { id: "pt.elhayek", group: "Italian & Portuguese", requestedAs: "Samir El-Hayek (Portuguese)" },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

// XML 1.0 allows tab, LF, CR and U+0020..U+D7FF, U+E000..U+FFFD, U+10000..U+10FFFF.
const INVALID_XML_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g;

function sanitizeXml(xml) {
  const removed = new Map();
  const cleaned = xml.replace(INVALID_XML_CHARS, (character) => {
    const codepoint = character.codePointAt(0);
    removed.set(codepoint, (removed.get(codepoint) ?? 0) + 1);
    return "";
  });

  // Tanzil's metadata comment uses long "# ------" separator lines. XML
  // forbids "--" inside comments, so strict parsers reject the original files.
  // Replacing the hyphens in comment separators is the only comment change;
  // verse text and metadata values are otherwise preserved byte-for-byte.
  const normalized = cleaned.replace(/<!--([\s\S]*?)-->/g, (_, inner) => {
    const safe = inner.replace(/-{2,}/g, (run) => "=".repeat(run.length));
    return `<!--${safe}-->`;
  });

  return {
    xml: normalized,
    removed: [...removed].map(([codepoint, count]) => ({
      codepoint: `U+${codepoint.toString(16).toUpperCase().padStart(4, "0")}`,
      count,
    })),
  };
}

function describeRepairs(removed) {
  if (!removed.length) return "comment separators";
  return (
    "comment separators, illegal control characters " +
    removed.map((entry) => `${entry.codepoint} x${entry.count}`).join(", ")
  );
}

function parseHeader(xml) {
  // Tanzil XML starts with an XML comment holding "# Key: value" metadata.
  const comment = xml.match(/^<\?xml[^>]*\?>\s*<!--([\s\S]*?)-->/);
  if (!comment) throw new Error("missing Tanzil metadata comment");

  const header = {};
  for (const line of comment[1].split(/\r?\n/)) {
    const match = line.match(/^#\s*([A-Za-z ]+):\s*(.*)$/);
    if (match) header[match[1].trim()] = match[2].trim();
  }
  return header;
}

function inspectXml(xml, expectedId) {
  const header = parseHeader(xml);
  if (header.ID !== expectedId) {
    throw new Error(`ID mismatch: header has "${header.ID}", expected "${expectedId}"`);
  }
  if (!header.Translator || !header.Language || !header["Last Update"]) {
    throw new Error("incomplete Tanzil metadata header");
  }

  const suras = (xml.match(/<sura\b/g) ?? []).length;
  const ayas = (xml.match(/<aya\b/g) ?? []).length;
  const selfClosingAyas = (xml.match(/^[ \t]*<aya\b[^\r\n]*\/>[ \t]*$/gm) ?? []).length;

  if (suras !== 114) throw new Error(`expected 114 suras, found ${suras}`);
  if (ayas !== 6236) throw new Error(`expected 6236 ayas, found ${ayas}`);
  if (selfClosingAyas !== ayas) {
    throw new Error(`expected every aya to be self-closing (${ayas}), found ${selfClosingAyas}`);
  }

  // Tanzil escapes XML entities in the document body. Comments are exempt
  // (some translator names legitimately contain "&").
  const body = xml.replace(/<!--[\s\S]*?-->/g, "");
  const rawAmpersand = body.match(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/);
  if (rawAmpersand) throw new Error("raw ampersand found in XML");

  return { header, suras, ayas };
}

async function fetchXml(id) {
  const url = `${BASE_URL}?transID=${encodeURIComponent(id)}&type=xml`;
  let lastError;

  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { "user-agent": USER_AGENT, accept: "application/xml,text/xml,*/*" },
        signal: AbortSignal.timeout(90_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const xml = await response.text();
      if (!xml.startsWith("<?xml")) {
        throw new Error("response is not XML (likely an HTML error page)");
      }
      return xml;
    } catch (error) {
      lastError = error;
      if (attempt < 4) await sleep(attempt * 1000);
    }
  }

  throw new Error(`download failed: ${lastError?.message ?? lastError}`);
}

async function downloadOne(request, position) {
  const target = path.join(XML_DIR, `${request.id}.xml`);
  const label = `[${String(position).padStart(2, "0")}/${REQUESTS.length}] ${request.id}`;

  if (!FORCE && fs.existsSync(target)) {
    const existing = fs.readFileSync(target);
    try {
      const { xml, removed } = sanitizeXml(existing.toString("utf8"));
      const buffer = Buffer.from(xml, "utf8");
      if (!buffer.equals(existing)) {
        fs.writeFileSync(target, buffer);
        console.warn(`${label}  cached file repaired (${describeRepairs(removed)})`);
      }
      const { header, suras, ayas } = inspectXml(xml, request.id);
      console.log(`${label}  cached  ${(buffer.length / 1024).toFixed(0)} KiB`);
      return { request, ...header, suras, ayas, removed, bytes: buffer.length, sha256: sha256(buffer), cached: true };
    } catch (error) {
      console.warn(`${label}  cached file invalid (${error.message}); re-downloading`);
    }
  }

  const fetched = await fetchXml(request.id);
  const { xml, removed } = sanitizeXml(fetched);
  const { header, suras, ayas } = inspectXml(xml, request.id);
  const buffer = Buffer.from(xml, "utf8");

  const partial = `${target}.part`;
  fs.writeFileSync(partial, buffer);
  fs.renameSync(partial, target);

  console.log(`${label}  ${(buffer.length / 1024).toFixed(0)} KiB`);
  return { request, ...header, suras, ayas, removed, bytes: buffer.length, sha256: sha256(buffer), cached: false };
}

async function main() {
  const ids = REQUESTS.map((request) => request.id);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length) {
    console.error("Duplicate translation IDs:", duplicates.join(", "));
    process.exit(1);
  }

  console.log(`Tanzil XML translations: ${REQUESTS.length} requested`);
  for (const request of REQUESTS) console.log(`  ${request.group.padEnd(24)} ${request.id}`);

  if (DRY_RUN) {
    console.log("\nDry run: nothing downloaded.");
    return;
  }

  fs.mkdirSync(XML_DIR, { recursive: true });

  const results = new Array(REQUESTS.length);
  let next = 0;
  let failed = 0;

  async function worker() {
    while (next < REQUESTS.length) {
      const index = next++;
      const request = REQUESTS[index];
      try {
        results[index] = await downloadOne(request, index + 1);
      } catch (error) {
        failed++;
        console.error(`[${String(index + 1).padStart(2, "0")}/${REQUESTS.length}] ${request.id}  FAILED: ${error.message}`);
      }
      await sleep(REQUEST_DELAY_MS);
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  if (failed > 0) {
    console.error(`\n${failed} translation(s) failed. Re-run to retry; successful files are cached.`);
    process.exit(1);
  }

  const translations = results.map((result) => ({
    id: result.request.id,
    group: result.request.group,
    requestedAs: result.request.requestedAs,
    language: result.Language,
    name: result.Name,
    translator: result.Translator,
    lastUpdate: result["Last Update"],
    file: `xml/${result.request.id}.xml`,
    bytes: result.bytes,
    sha256: result.sha256,
    suras: result.suras,
    ayas: result.ayas,
    ...(result.removed.length
      ? {
          repairs: [
            `Removed ${result.removed.reduce((total, entry) => total + entry.count, 0)} illegal XML control character(s) ` +
              `(${result.removed.map((entry) => `${entry.codepoint} x${entry.count}`).join(", ")}) that cannot be represented in XML.`,
          ],
        }
      : {}),
  }));

  const bytes = translations.reduce((total, entry) => total + entry.bytes, 0);
  const languages = [...new Set(translations.map((entry) => entry.language))].sort();

  const manifest = {
    source: {
      name: "Tanzil Project",
      url: "https://tanzil.net/trans/",
      format: "Tanzil XML (type=xml)",
      terms: "Non-commercial use only; link back to https://tanzil.net/trans/ when using more than three translations.",
      normalization:
        "Hyphen runs in the XML metadata comment were replaced with '=' because XML forbids '--' inside comments. Illegal XML control characters were removed where present (see per-entry 'repairs').",
    },
    generatedAt: new Date().toISOString(),
    counts: {
      translations: translations.length,
      languages: languages.length,
      surasPerTranslation: 114,
      ayasPerTranslation: 6236,
      bytes,
    },
    languages,
    translations,
  };

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");

  console.log(
    `\nDownloaded and validated ${translations.length} translations ` +
      `(${languages.length} languages, ${(bytes / 1024 / 1024).toFixed(1)} MiB).`,
  );
  console.log(`Manifest: ${path.relative(ROOT, MANIFEST_PATH)}`);
}

await main();
