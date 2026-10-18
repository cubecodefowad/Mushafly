/**
 * Minimal local preview server for the static export. It exists so performance
 * checks see the same gzip and immutable-cache behavior a CDN provides.
 * It is not a production server.
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { createGzip } from "node:zlib";

const root = path.resolve("out");
const port = Number(process.env.PORT) || 3200;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".mp3": "audio/mpeg",
  ".map": "application/json; charset=utf-8",
};

const COMPRESSIBLE = new Set([".html", ".js", ".css", ".json", ".svg", ".txt"]);

if (!fs.existsSync(root)) {
  console.error("Missing out/. Run `npm run build` first.");
  process.exit(1);
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  let pathname = decodeURIComponent(url.pathname);

  let file = path.join(root, pathname);
  if (!file.startsWith(root)) {
    response.writeHead(403).end("Forbidden");
    return;
  }

  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  if (!fs.existsSync(file) && !path.extname(file)) {
    const withSlash = path.join(file, "index.html");
    if (fs.existsSync(withSlash)) file = withSlash;
  }

  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    const notFound = path.join(root, "404.html");
    response.writeHead(404, { "Content-Type": TYPES[".html"] });
    if (fs.existsSync(notFound)) response.end(fs.readFileSync(notFound));
    else response.end("Not found");
    return;
  }

  const ext = path.extname(file);
  const stat = fs.statSync(file);
  const headers = {
    "Content-Type": TYPES[ext] ?? "application/octet-stream",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": pathname.startsWith("/_next/static") || pathname.startsWith("/fonts")
      ? "public, max-age=31536000, immutable"
      : pathname.startsWith("/quran/")
        ? "public, max-age=3600"
        : "no-cache",
  };

  const acceptsGzip = String(request.headers["accept-encoding"] ?? "").includes("gzip");
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

  void stat;
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Mushafly static preview: http://localhost:${port}`);
});
