# Security notes

An assessment of what Mushafly can and cannot be attacked through, what was
checked, and the settings that live outside the repository — in the hosting
account and on GitHub — that only a maintainer can change.

## What the app is, and therefore what it is exposed to

`next build` writes a directory of static files. There is no server process, no
database, no session, no login and no server-side rendering of user input. The
browser test suite runs against that directory, which is the artifact that
ships.

Three trust boundaries exist:

1. **Rendering.** Quranic strings, translations and Tajweed annotations are
   emitted as React text nodes, so they are escaped by the framework. The only
   deliberate HTML injection is the 12-line theme bootstrap script.
2. **Local storage.** Bookmarks, reading position and preferences are written
   to `localStorage` and read back on the next visit. It is the only place
   anything the reader types is kept.
3. **The network.** The page loads from its own origin and makes exactly one
   cross-origin request: playing a verse fetches its MP3 from
   `raw.githubusercontent.com` at a commit pinned in the source data. Fonts,
   search index, pages and the analytics script are all same-origin.

A fourth party holds none of the reader's data but does see traffic: Vercel,
which hosts the site and serves the analytics route. The policy below therefore
does not need an extra origin — the client asks for
`/_vercel/insights/script.js` on its own origin in production, which is why no
analytics hostname appears in the header below. The package's development
fallback, `https://va.vercel-scripts.com/v1/script.debug.js`, is deliberately
**not** allowed: it is only requested by a development build, which the preview
server does not serve.

## What was checked, and the result

| Check | Result |
|---|---|
| Third-party scripts | One, Vercel Web Analytics, and in production it is served from this origin. Fonts are self-hosted WOFF2; no tag managers, ad scripts or social embeds |
| `dangerouslySetInnerHTML` | One use, `ThemeScript`: a constant string, no interpolation of any value, all reads inside `try`/`catch` |
| `eval`, `new Function`, `document.write`, `innerHTML` | None anywhere in `src/` or `scripts/` |
| `target="_blank"` links | All 10 external links also carry `rel="noreferrer"` |
| `fetch()` targets | All same-origin relative paths (`/quran/…`). The audio URL is built from pinned source metadata, never from user input |
| Stored value parsing | Every stored record is type-checked, bounded (`arabicSize` clamped 24–56, bookmark labels trimmed to 120 characters) and dates parsed before use; invalid entries are dropped |
| `npm audit` (production and development) | 0 vulnerabilities |
| Secrets in the tree | None. No `.env` file exists; the only environment variables read are `PORT` and `BASE_URL` |
| Preview server (`scripts/serve-static.mjs`) | Binds to `127.0.0.1` only; path traversal and malformed percent-encoding are rejected |

Two defects were found in the preview server during this review and fixed: the
containment check compared string prefixes, so a sibling directory whose name
began with the same characters would have passed, and a malformed `%` escape in
a URL threw out of the request handler. Neither is reachable in the deployed
static site, which has no server, but both are fixed at the source.

## Headers the host should send

A static export cannot set its own headers, so this is a hosting decision. The
preview server now sends the policy below, which means the browser suite runs
under it: if a change ever breaks the policy, the tests fail rather than the
deployed site.

```
Content-Security-Policy: default-src 'self'; base-uri 'none'; object-src 'none';
  frame-ancestors 'none'; form-action 'self'; script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self';
  media-src 'self' https://raw.githubusercontent.com;
  connect-src 'self' https://raw.githubusercontent.com
Referrer-Policy: strict-origin-when-cross-origin
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Permissions-Policy: camera=(), geolocation=(), microphone=(), payment=()
Strict-Transport-Security: max-age=31536000; includeSubDomains   # only over HTTPS
```

Notes that matter when deploying:

- **GitHub Pages ignores custom headers.** If the site is published there, none
  of the above is applied. Cloudflare Pages and Netlify both read a `_headers`
  file from the published directory; Cloudflare Pages additionally gives free
  HTTPS with HSTS. Publishing somewhere that supports headers is worth it for
  a site whose one selling point is that it does nothing behind your back.
- The two `'unsafe-inline'` allowances are the cost of a static export: Next's
  hydration bootstrap is an inline script and the reader sets Tajweed colours as
  inline styles. Removing them needs nonces, which needs a server. Everything
  else is still locked to the origin serving the page, which is what stops an
  injected remote script from loading.
- A `frame-ancestors` directive cannot be expressed in a `<meta http-equiv>`
  tag, so clickjacking protection only exists if the host sends the header.

## Repository and account settings

These cannot be set from the code and are worth a few minutes:

1. **Two-factor authentication** on the GitHub account, and a hardware key if
   available. The repository content is the supply chain for anyone who
   self-hosts a copy.
2. **Secret scanning and push protection** — free on public repositories, and
   the reason a token pasted by mistake never reaches the remote.
3. **Dependabot alerts and security updates**, on top of the weekly version
   updates now configured in `.github/dependabot.yml`.
4. **Branch protection on `main`**: require a pull request, disallow force
   pushes, and require the CI check. Merged code is what gets deployed.
5. **Workflow permissions**: the CI workflow now requests `contents: read`
   explicitly, so the token it runs with cannot write to the repository. Keep it
   that way; a workflow file is executable code, so review changes to
   `.github/workflows/` as carefully as changes to `src/`.
6. **Consider pinning actions by commit SHA** rather than by tag
   (`actions/checkout@<sha>`), since a tag can be moved. Dependabot will keep
   the pins current once they are in place.
7. **Restrict who can deploy**, if the site ever moves to a host with its own
   account: use a dedicated deploy token in a protected environment rather than
   a personal one.

## Supply chain and content integrity

- Dependencies are few and locked: `next`, `react`, `react-dom`,
  `lucide-react`, with the toolchain in `devDependencies`. `npm ci` in CI
  installs exactly the lockfile; `npm audit --audit-level=high` fails the build
  on a high or critical advisory. Review lockfile diffs in pull requests rather
  than merging them blind.
- The Quranic data is verified at build time: the validator checks structure,
  counts and provenance, and pins 806 file hashes when the upstream checkout is
  present. A published copy therefore matches the recorded source.
- Audio is **not** verified at runtime. The URL is pinned to a commit, so the
  file cannot change without a new commit, but the app trusts that host to serve
  the bytes it advertises. If that matters to you, the durable fixes are to
  mirror the MP3s next to the site or to record per-file hashes and check them
  before playback.

## Residual risks, stated plainly

- `script-src 'unsafe-inline'` means an injected inline script would run. The
  real defence here is that no user-generated content is ever rendered as HTML,
  and the only third-party script is the same-origin analytics bundle; the
  policy limits the blast radius but does not eliminate it.
- Analytics is a deliberate, narrow exception to the app's earlier "no
  measurement at all" position. It is cookieless, collects no reader-authored
  value, and is inert away from Vercel, but it is still an outside service
  seeing page traffic. Anyone forking this to run a fully unmeasured copy should
  delete the `<Analytics />` element and the dependency.
- The contact address is `mailto:` text, so it is harvestable by scrapers.
- There is no CSP reporting endpoint, so a violation is invisible unless the
  browser console is open.
- The upstream dataset repository is a trust dependency for the text itself:
  a compromised upstream commit would be visible only through the pinned
  revision and the build-time checks, not blocked by them.

## If the app grows

The moment Mushafly gains a backend, accounts, sync or comments, this document
is obsolete: sessions and CSRF, server-side input validation, per-user
authorisation, rate limiting and secure cookie flags all become part of the
design. Nothing in this codebase anticipates that, deliberately.
