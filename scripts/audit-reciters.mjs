/**
 * Audits the per-ayah recitation folders published on everyayah.com and writes
 * the manifest the reader builds its reciter list from.
 *
 * Every folder is expected to contain one MP3 per ayah, named
 * `<surah:3><ayah:3>.mp3`, plus an optional `NNN000.mp3` for the unnumbered
 * Bismillah that opens a surah. The manifest records, per folder, whether those
 * files are all present, so the reader never offers a recitation whose files
 * are missing. Folders with gaps stay in the manifest as `excluded` so the
 * reason is auditable instead of implicit.
 *
 * everyayah publishes a checksum file per folder that lists every MP3, which is
 * far smaller than the directory listing. Some folders have no checksum, so
 * their listing is read instead.
 *
 * Usage:
 *   node scripts/audit-reciters.mjs            # reuse cached downloads
 *   node scripts/audit-reciters.mjs --refresh  # re-download everything
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const PAGE_URL = "https://www.versebyversequran.com/recitations_ayat.html";
const AUDIO_ORIGIN = "https://everyayah.com";
const CACHE_DIR = path.join(os.tmpdir(), "mushafly-reciters");
const OUTPUT = path.join("src", "data", "generated", "reciters.json");
const REFRESH = process.argv.includes("--refresh");

/** Folders deliberately left out. Every other published folder is audited. */
const REQUESTED_EXCLUSIONS = new Map([
  ["translations/Fooladvand_Hedayatfar_40Kbps", "Persian translation recitation, excluded on request"],
  ["translations/Makarem_Kabiri_16Kbps", "Persian translation recitation, excluded on request"],
  ["Karim_Mansoori_40kbps", "Persian recitation, excluded on request"],
  ["Parhizgar_48kbps", "Persian recitation, excluded on request"],
]);

/**
 * The pinned dataset already provides Saad Al-Ghamadi, so the everyayah copy is
 * not a second choice in the list.
 */
const DEFAULT_FOLDER = "Ghamadi_40kbps";

/** Display names that the page labels do not spell consistently. */
const NAMES = {
  "AbdulSamad_64kbps_QuranExplorer.Com": "Abdul Samad",
  "Abdullaah_3awwaad_Al-Juhaynee_128kbps": "Abdullah Awwad Al-Juhayni",
  "Abdul_Basit_Mujawwad_128kbps": "Abdul Basit (Mujawwad)",
  "Abdul_Basit_Murattal_192kbps": "Abdul Basit (Murattal)",
  "Abdul_Basit_Murattal_64kbps": "Abdul Basit (Murattal)",
  "Abdurrahmaan_As-Sudais_192kbps": "Abdurrahman As-Sudais",
  "Abdurrahmaan_As-Sudais_64kbps": "Abdurrahman As-Sudais",
  "Abu_Bakr_Ash-Shaatree_128kbps": "Abu Bakr Ash-Shatri",
  "Abu_Bakr_Ash-Shaatree_64kbps": "Abu Bakr Ash-Shatri",
  "ahmed_ibn_ali_al_ajamy_128kbps": "Ahmed ibn Ali Al-Ajamy",
  "Ahmed_ibn_Ali_al-Ajamy_128kbps_ketaballah.net": "Ahmed ibn Ali Al-Ajamy (KetabAllah)",
  "Ahmed_ibn_Ali_al-Ajamy_64kbps_QuranExplorer.Com": "Ahmed ibn Ali Al-Ajamy (QuranExplorer)",
  "Akram_AlAlaqimy_128kbps": "Akram Al-Alaqimy",
  "Alafasy_128kbps": "Mishary Rashid Alafasy",
  "Alafasy_64kbps": "Mishary Rashid Alafasy",
  "Ali_Hajjaj_AlSuesy_128kbps": "Ali Hajjaj Al-Suesy",
  "Hani_Rifai_192kbps": "Hani Ar-Rifai",
  "Hani_Rifai_64kbps": "Hani Ar-Rifai",
  "Husary_128kbps": "Mahmoud Khalil Al-Husary",
  "Husary_64kbps": "Mahmoud Khalil Al-Husary",
  "Husary_Muallim_128kbps": "Mahmoud Khalil Al-Husary (Muallim)",
  "Husary_128kbps_Mujawwad": "Mahmoud Khalil Al-Husary (Mujawwad)",
  "Husary_Mujawwad_64kbps": "Mahmoud Khalil Al-Husary (Mujawwad)",
  "Ibrahim_Akhdar_32kbps": "Ibrahim Al-Akhdar",
  "Ibrahim_Akhdar_64kbps": "Ibrahim Al-Akhdar",
  "Khaalid_Abdullaah_al-Qahtaanee_192kbps": "Khalid Al-Qahtani",
  "khalefa_al_tunaiji_64kbps": "Khalifa Al-Tunaiji",
  "MaherAlMuaiqly128kbps": "Maher Al-Muaiqly",
  "Maher_AlMuaiqly_64kbps": "Maher Al-Muaiqly",
  "Menshawi_16kbps": "Mohamed Al-Minshawi",
  "Menshawi_32kbps": "Mohamed Al-Minshawi",
  "Minshawy_Mujawwad_192kbps": "Mohamed Al-Minshawi (Mujawwad)",
  "Minshawy_Mujawwad_64kbps": "Mohamed Al-Minshawi (Mujawwad)",
  "Minshawy_Murattal_128kbps": "Mohamed Al-Minshawi (Murattal)",
  "Muhammad_AbdulKareem_128kbps": "Muhammad Abdulkarim",
  "Muhsin_Al_Qasim_192kbps": "Muhsin Al-Qasim",
  "Nasser_Alqatami_128kbps": "Nasser Al-Qatami",
  "Sahl_Yassin_128kbps": "Sahl Yassin",
  "Salaah_AbdulRahman_Bukhatir_128kbps": "Salah Abdulrahman Bukhatir",
  "Saood_ash-Shuraym_128kbps": "Saud Ash-Shuraym",
  "Saood_ash-Shuraym_64kbps": "Saud Ash-Shuraym",
  "Yasser_Ad-Dussary_128kbps": "Yasser Al-Dussary",
  "Yaser_Salamah_128kbps": "Yasser Salamah",
  "Ghamadi_40kbps": "Saad Al-Ghamadi",
  "English/Sahih_Intnl_Ibrahim_Walk_192kbps": "Sahih International — Ibrahim Walk",
  "translations/urdu_shamshad_ali_khan_46kbps": "Shamshad Ali Khan",
  "translations/urdu_farhat_hashmi": "Farhat Hashmi",
  "translations/besim_korkut_ajet_po_ajet": "Besim Korkut",
  "translations/azerbaijani/balayev": "Balayev",
  "MultiLanguage/Basfar_Walk_192kbps": "Abdullah Basfar (walk)",
  "warsh/warsh_Abdul_Basit_128kbps": "Abdul Basit",
  "warsh/warsh_ibrahim_aldosary_128kbps": "Ibrahim Al-Dosary",
  "warsh/warsh_yassin_al_jazaery_64kbps": "Yassin Al-Jazaery",

};

/** Stable ids used by stored settings. Everything else is derived. */
const IDS = {
  Alafasy_128kbps: "alafasy",
  Ghamadi_40kbps: "ghamadi",
};

const pad3 = (value) => String(value).padStart(3, "0");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function idFrom(folder) {
  if (IDS[folder]) return IDS[folder];
  return folder
    .replace(/^warsh\/warsh_/, "warsh/")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function bitrateFrom(folder, label) {
  const match = /(\d+)\s?kbps/i.exec(folder) ?? /(\d+)\s?kbps/i.exec(label);
  return match ? Number(match[1]) : null;
}

function kindOf(folder) {
  if (folder.startsWith("warsh/")) return "warsh";
  if (
    folder.startsWith("translations/") ||
    folder.startsWith("English/") ||
    folder.startsWith("MultiLanguage/")
  ) {
    return "translation";
  }
  return "hafs";
}

function languageOf(folder) {
  if (folder.startsWith("English/")) return "English";
  if (folder.includes("/urdu_") || folder.includes("urdu_")) return "Urdu";
  if (folder.includes("azerbaijani")) return "Azerbaijani";
  if (folder.includes("besim_korkut")) return "Bosnian";
  if (folder.startsWith("MultiLanguage/")) return "Multilingual";
  return "Arabic";
}

function labelName(label) {
  return label
    .replace(/\s*\(\d+ files missing\)\s*$/i, "")
    .replace(/\s*\d+\s?kbps\s*$/i, "")
    .replace(/\s*\(Iran\)\s*$/i, "")
    .trim();
}

async function download(url) {
  const key = path.join(CACHE_DIR, Buffer.from(url).toString("base64url"));
  if (!REFRESH && fs.existsSync(key)) return fs.readFileSync(key, "utf8");

  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { headers: { "user-agent": "mushafly-reciters/1.0" } });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      const text = await response.text();
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      fs.writeFileSync(key, text);
      return text;
    } catch (error) {
      lastError = error;
      await sleep(500 * (attempt + 1));
    }
  }
  throw new Error(`GET ${url} failed: ${lastError?.message ?? lastError}`);
}

function filesFromChecksum(text) {
  const names = new Set();
  for (const line of text.split("\n")) {
    const match = /^\s*[0-9a-f]{32}\s+\*?(.+?\.mp3)\s*$/i.exec(line);
    if (match) names.add(match[1].split("/").pop());
  }
  return names;
}

function filesFromListing(text, folder) {
  const names = new Set();
  const escaped = folder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`href="[^"]*${escaped}/([0-9]{6}\\.mp3)"`, "g");
  let match;
  while ((match = pattern.exec(text))) names.add(match[1]);
  return names;
}

async function filesFromChecksumFile(folder) {
  try {
    const names = filesFromChecksum(
      await download(`${AUDIO_ORIGIN}/data/${folder}/000_checksum.md5`),
    );
    if (names.size > 100) return names;
  } catch {
    // No checksum file; fall back to the directory listing.
  }
  return null;
}

async function filesFromListingFile(folder) {
  return filesFromListing(await download(`${AUDIO_ORIGIN}/data/${folder}/`), folder);
}

function parsePage(html) {
  const entries = [];
  const pattern =
    /<strong>([\s\S]*?)<\/strong>[\s\S]{0,600}?href="https:\/\/everyayah\.com\/data\/([^"]+?)\/"[^>]*>\(GO\)<\/a>/g;
  let match;
  while ((match = pattern.exec(html))) {
    entries.push({
      label: match[1].replace(/\s+/g, " ").trim(),
      folder: match[2],
    });
  }
  return entries;
}

const meta = JSON.parse(
  fs.readFileSync(path.join("src", "data", "generated", "surah-meta.json"), "utf8"),
);
const expectedAyahs = new Set();
const expectedBismillah = new Set();
for (const surah of meta) {
  for (let verse = 1; verse <= surah.verseCount; verse++) {
    expectedAyahs.add(`${pad3(surah.number)}${pad3(verse)}.mp3`);
  }
  if (surah.bismillah) expectedBismillah.add(`${pad3(surah.number)}000.mp3`);
}

const page = await download(PAGE_URL);
const entries = parsePage(page);
if (entries.length < 70) {
  throw new Error(`Expected the recitation page to list many folders, found ${entries.length}`);
}

const reciters = [];
const excluded = [];

for (const entry of entries) {
  const { folder, label } = entry;
  if (folder === DEFAULT_FOLDER) continue;

  const requested = REQUESTED_EXCLUSIONS.get(folder);
  if (requested) {
    excluded.push({
      folder,
      name: NAMES[folder] ?? labelName(label),
      reason: "requested",
      note: requested,
    });
    continue;
  }

  let files = await filesFromChecksumFile(folder);
  files ??= await filesFromListingFile(folder);
  let missingAyahs = [...expectedAyahs].filter((name) => !files.has(name)).length;
  if (missingAyahs > 0) {
    // Some checksum files list only part of the folder, so confirm a gap
    // against the directory itself before dropping the reciter.
    const listing = await filesFromListingFile(folder);
    const listingMissing = [...expectedAyahs].filter((name) => !listing.has(name)).length;
    if (listingMissing < missingAyahs) {
      files = listing;
      missingAyahs = listingMissing;
    }
  }
  const bismillahCount = [...expectedBismillah].filter((name) => files.has(name)).length;
  const name = NAMES[folder] ?? labelName(label);

  if (missingAyahs > 0) {
    excluded.push({
      folder,
      name,
      reason: "incomplete",
      missingAyahs,
      note: `${missingAyahs.toLocaleString("en-US")} of ${expectedAyahs.size.toLocaleString("en-US")} ayah files are missing`,
    });
    console.log(`skip  ${folder}: ${missingAyahs} ayahs missing`);
    continue;
  }

  reciters.push({
    id: idFrom(folder),
    name,
    folder,
    bitrate: bitrateFrom(folder, label),
    kind: kindOf(folder),
    language: languageOf(folder),
    bismillah: bismillahCount === expectedBismillah.size,
    files: files.size,
  });
  console.log(
    `offer ${folder}: ${files.size} files, bismillah ${bismillahCount}/${expectedBismillah.size}`,
  );
}

reciters.sort((a, b) => a.name.localeCompare(b.name) || (a.bitrate ?? 0) - (b.bitrate ?? 0));
excluded.sort((a, b) => a.name.localeCompare(b.name) || a.reason.localeCompare(b.reason));

const ids = new Set();
for (const reciter of reciters) {
  if (ids.has(reciter.id)) throw new Error(`Duplicate reciter id: ${reciter.id}`);
  ids.add(reciter.id);
}

const payload = {
  source: {
    page: PAGE_URL,
    audioOrigin: AUDIO_ORIGIN,
    retrieved: new Date().toISOString().slice(0, 10),
  },
  expected: {
    ayahs: expectedAyahs.size,
    bismillah: expectedBismillah.size,
  },
  counts: {
    offered: reciters.length,
    excluded: excluded.length,
  },
  reciters,
  excluded,
};

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, `${JSON.stringify(payload, null, 2)}\n`);

console.log(
  `\n${reciters.length} reciters offered, ${excluded.length} excluded → ${OUTPUT}`,
);
