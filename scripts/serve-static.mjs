/**
 * Minimal local preview server for the static export. It exists so performance
 * checks see the same gzip and immutable-cache behavior a CDN provides.
 * It is not a production server: it binds to loopback only.
 *
 * It also sends the headers the deployed site is expected to run under, so the
 * browser test suite exercises the real policy instead of a policy that only
 * exists in a document.
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { createGzip } from "node:zlib";

const root = path.resolve("out");
const port = Number(process.env.PORT) || 3200;

/** The only origin the reader reaches out to: verse audio, pinned by commit. */
const AUDIO_ORIGIN = "https://raw.githubusercontent.com";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".mp3": "audio/mpeg",
  ".map": "application/json; charset=utf-8",
};

const COMPRESSIBLE = new Set([".html", ".js", ".css", ".json", ".xml", ".svg", ".txt"]);

// A static export cannot mint nonces, so the two inline allowances below are
// unavoidable: Next's hydration bootstrap is an inline script, and the reader
// sets Tajweed colours through inline styles. Everything else is locked to the
// origin that serves the page.
const SECURITY_HEADERS = {
  "Content-Security-Policy": [
    "default-src 'self'",
    "base-uri 'none'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    `media-src 'self' ${AUDIO_ORIGIN}`,
    `connect-src 'self' ${AUDIO_ORIGIN}`,
  ].join("; "),
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Permissions-Policy": "camera=(), geolocation=(), microphone=(), payment=()",
};

if (!fs.existsSync(root)) {
  console.error("Missing out/. Run `npm run build` first.");
  process.exit(1);
}

const server = http.createServer((request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { ...SECURITY_HEADERS, Allow: "GET, HEAD" }).end("Method not allowed");
    return;
  }

  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    response.writeHead(400, SECURITY_HEADERS).end("Bad request");
    return;
  }
  if (pathname.includes("\0")) {
    response.writeHead(400, SECURITY_HEADERS).end("Bad request");
    return;
  }

  // Resolve inside the export directory and verify containment with a path
  // comparison: a string prefix test would also accept a sibling directory
  // whose name merely starts with the same characters.
  const resolved = path.resolve(root, `.${pathname}`);
  const relative = path.relative(root, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    response.writeHead(403, SECURITY_HEADERS).end("Forbidden");
    return;
  }

  let file = resolved;
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  if (!fs.existsSync(file) && !path.extname(file)) {
    const withSlash = path.join(file, "index.html");
    if (fs.existsSync(withSlash)) file = withSlash;
  }

  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    const notFound = path.join(root, "404.html");
    response.writeHead(404, { ...SECURITY_HEADERS, "Content-Type": TYPES[".html"] });
    if (fs.existsSync(notFound)) response.end(fs.readFileSync(notFound));
    else response.end("Not found");
    return;
  }

  const ext = path.extname(file);
  const headers = {
    ...SECURITY_HEADERS,
    "Content-Type": TYPES[ext] ?? "application/octet-stream",
    "Cache-Control": pathname.startsWith("/_next/static") || pathname.startsWith("/fonts")
      ? "public, max-age=31536000, immutable"
      : pathname.startsWith("/quran/")
        ? "public, max-age=3600"
        : "no-cache",
  };

  const acceptsGzip = (request.headers["accept-encoding"] ?? "").includes("gzip");
  if (acceptsGzip && COMPRESSIBLE.has(ext)) {
    headers["Content-Encoding"] = "gzip";
    headers["Vary"] = "Accept-Encoding";
  }

  response.writeHead(200, headers);
  if (request.method === "HEAD") {
    response.end();
    return;
  }

  if (headers["Content-Encoding"] === "gzip") {
    const stream = fs.createReadStream(file);
    const gzip = createGzip({ level: 9 });
    stream.pipe(gzip).pipe(response);
  } else {
    fs.createReadStream(file).pipe(response);
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Mushafly static preview: http://localhost:${port}`);
  console.log("Security headers applied; see docs/security.md");
});
