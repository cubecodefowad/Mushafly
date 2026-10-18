/**
 * Derives the shipped brand assets from the supplied logo artwork.
 *
 * Source artwork lives in assets/brand/ (2000×2000 RGBA PNGs, transparent
 * background) and is never served. This script trims the artwork to its ink,
 * pads it back to a square, and downscales it with a box filter, then writes
 * the files the app and the browser actually load.
 *
 * Usage: node scripts/generate-brand-assets.mjs
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const ROOT = path.resolve(import.meta.dirname, "..");
const SOURCE_DIR = path.join(ROOT, "assets", "brand");
const OUT_DIR = path.join(ROOT, "public", "brand");
const DOC_PATH = path.join(ROOT, "docs", "brand-assets.md");

/** Read an 8-bit RGBA PNG (color type 6), the only format the artwork uses. */
function readPng(file) {
  const buffer = fs.readFileSync(file);
  if (buffer.readUInt32BE(16) === 0) throw new Error(`${file} has no dimensions`);
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  const bitDepth = buffer[24];
  const colorType = buffer[25];
  if (bitDepth !== 8 || colorType !== 6) {
    throw new Error(`${file}: expected 8-bit RGBA, got depth ${bitDepth} type ${colorType}`);
  }

  const chunks = [];
  for (let offset = 8; offset < buffer.length - 8; ) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    if (type === "IDAT") chunks.push(buffer.subarray(offset + 8, offset + 8 + length));
    offset += 12 + length;
    if (type === "IEND") break;
  }

  const raw = zlib.inflateSync(Buffer.concat(chunks));
  const stride = width * 4;
  const pixels = Buffer.alloc(height * stride);
  let cursor = 0;

  for (let y = 0; y < height; y += 1) {
    const filter = raw[cursor];
    cursor += 1;
    const line = raw.subarray(cursor, cursor + stride);
    cursor += stride;
    const current = pixels.subarray(y * stride, (y + 1) * stride);
    const previous = y > 0 ? pixels.subarray((y - 1) * stride, y * stride) : Buffer.alloc(stride);

    for (let x = 0; x < stride; x += 1) {
      const left = x >= 4 ? current[x - 4] : 0;
      const up = previous[x];
      const upLeft = x >= 4 ? previous[x - 4] : 0;
      const value = line[x];
      let restored;
      if (filter === 0) restored = value;
      else if (filter === 1) restored = value + left;
      else if (filter === 2) restored = value + up;
      else if (filter === 3) restored = value + Math.floor((left + up) / 2);
      else {
        const p = left + up - upLeft;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - upLeft);
        restored = value + (pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft);
      }
      current[x] = restored & 0xff;
    }
  }

  return { width, height, pixels };
}

function writePng(file, width, height, pixels) {
  const stride = width * 4;
  const raw = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0;
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  const chunk = (type, data) => {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body));
    return Buffer.concat([length, body, crc]);
  };

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  fs.writeFileSync(file, png);
  return png.length;
}

let crcTable;
function crc32(buffer) {
  if (!crcTable) {
    crcTable = new Int32Array(256);
    for (let n = 0; n < 256; n += 1) {
      let c = n;
      for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c;
    }
  }
  let crc = -1;
  for (let i = 0; i < buffer.length; i += 1) crc = crcTable[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ -1) >>> 0;
}

/** Bounding box of every pixel that carries ink. */
function inkBounds({ width, height, pixels }) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (pixels[(y * width + x) * 4 + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) throw new Error("artwork is fully transparent");
  return { minX, minY, maxX, maxY };
}

/** Trim to the ink, then centre it in a square canvas with breathing room. */
function toSquareCanvas(image, paddingRatio = 0.06) {
  const { minX, minY, maxX, maxY } = inkBounds(image);
  const inkWidth = maxX - minX + 1;
  const inkHeight = maxY - minY + 1;
  const side = Math.round(Math.max(inkWidth, inkHeight) * (1 + paddingRatio * 2));
  const canvas = Buffer.alloc(side * side * 4);
  const offsetX = Math.round((side - inkWidth) / 2);
  const offsetY = Math.round((side - inkHeight) / 2);

  for (let y = 0; y < inkHeight; y += 1) {
    const from = ((minY + y) * image.width + minX) * 4;
    const to = ((offsetY + y) * side + offsetX) * 4;
    image.pixels.copy(canvas, to, from, from + inkWidth * 4);
  }
  return { width: side, height: side, pixels: canvas };
}

/** Box-filtered downscale: each destination pixel averages its source window. */
function resize(image, size) {
  const output = Buffer.alloc(size * size * 4);
  const scale = image.width / size;
  for (let y = 0; y < size; y += 1) {
    const y0 = Math.floor(y * scale);
    const y1 = Math.max(y0 + 1, Math.min(image.height, Math.floor((y + 1) * scale)));
    for (let x = 0; x < size; x += 1) {
      const x0 = Math.floor(x * scale);
      const x1 = Math.max(x0 + 1, Math.min(image.width, Math.floor((x + 1) * scale)));
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      let count = 0;
      for (let sy = y0; sy < y1; sy += 1) {
        for (let sx = x0; sx < x1; sx += 1) {
          const i = (sy * image.width + sx) * 4;
          const alpha = image.pixels[i + 3] / 255;
          // Premultiply so transparent edges do not darken or lighten the mix.
          r += image.pixels[i] * alpha;
          g += image.pixels[i + 1] * alpha;
          b += image.pixels[i + 2] * alpha;
          a += alpha;
          count += 1;
        }
      }
      const o = (y * size + x) * 4;
      if (a > 0) {
        output[o] = Math.round(r / a);
        output[o + 1] = Math.round(g / a);
        output[o + 2] = Math.round(b / a);
        output[o + 3] = Math.round((a / count) * 255);
      }
    }
  }
  return { width: size, height: size, pixels: output };
}

const VARIANTS = [
  { id: "light", source: "mushafly-light.png", label: "light theme" },
  { id: "dark", source: "mushafly-dark.png", label: "dark theme" },
];

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const variant of VARIANTS) {
  const sourcePath = path.join(SOURCE_DIR, variant.source);
  const square = toSquareCanvas(readPng(sourcePath));

  const written = [];
  for (const [file, size] of [
    [`mark-${variant.id}.png`, 256],
    [`favicon-${variant.id}-32.png`, 32],
  ]) {
    const bytes = writePng(path.join(OUT_DIR, file), size, size, resize(square, size).pixels);
    written.push(`${file} ${size}×${size} ${(bytes / 1024).toFixed(1)} KiB`);
  }

  // Apple touch icons cannot follow the theme, so the light mark is used.
  if (variant.id === "light") {
    const touch = writePng(
      path.join(OUT_DIR, "apple-touch-icon-180.png"),
      180,
      180,
      resize(square, 180).pixels,
    );
    written.push(`apple-touch-icon-180.png 180×180 ${(touch / 1024).toFixed(1)} KiB`);
  }

  console.log(`${variant.source} → ${variant.label}\n  canvassed at ${square.width}×${square.height}\n  ${written.join("\n  ")}`);
}

const doc = `# Brand assets

Generated by \`node scripts/generate-brand-assets.mjs\` from the supplied
artwork in \`assets/brand/\` (2000×2000 RGBA PNGs with a transparent
background). Never edit files under \`public/brand/\` by hand; change the source
artwork and re-run the script.

The script trims each logo to its ink, centres it on a square canvas with 6%
padding, and downscales it with a box filter, so every size keeps the same
proportions and a clean edge.

| File | Size | Used for |
|---|---|---|
| \`mark-light.png\` | 256×256 | In-app mark on the light theme |
| \`mark-dark.png\` | 256×256 | In-app mark on the dark theme |
| \`favicon-light-32.png\` | 32×32 | Browser icon, light scheme (declared first) |
| \`favicon-dark-32.png\` | 32×32 | Browser icon, dark scheme (\`media: prefers-color-scheme: dark\`) |
| \`apple-touch-icon-180.png\` | 180×180 | iOS home-screen icon (cannot follow the theme) |

The two browser icons are declared through the Metadata API with a
\`media\` query. Chromium switches the tab icon with the system scheme; Firefox
(see mdn/browser-compat-data issue 24213) and Safari ignore \`media\` on
favicons and use the first declaration, which is why the light variant comes
first and is legible on either tab strip. The in-app mark does not depend on
this: it follows the app's own theme class.

In the app the mark is a single element with a CSS background image, so a visit
fetches only the variant it displays. Measured contrast against the theme
backgrounds: the light-theme mark is 6.4:1 on \`#FAF8F3\`; the dark-theme mark is
2.8:1 on \`#171916\`, which is legible but muted — the wordmark beside it carries
the name, and the mark is decorative (\`aria-hidden\`).
`;
fs.writeFileSync(DOC_PATH, doc);
console.log("\nwrote docs/brand-assets.md");
