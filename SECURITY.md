# Security policy

Mushafly is a static reading application: no server, no database, no accounts
and no cookies. It loads exactly one third-party script, Vercel's cookieless
Web Analytics, and stops counting if its script is blocked. That removes most
classes of web vulnerability before they can exist, and it means the
interesting surface is small — the rendering path, local storage, the build and
the dependencies.

## Reporting a vulnerability

Email **hello@mushafly.com** with a description, the steps to reproduce and the
affected page or file. Please do not open a public issue for a security problem
before it has been fixed.

There is no bug bounty and no fixed response time — this is a small project —
but reports are read and acted on, and you will be credited in the fix commit
unless you ask otherwise.

Please send **Quranic text, translation, Tajweed or recitation discrepancies**
to the same address rather than treating them as vulnerabilities; they are
content reports, described in `docs/security.md` and on `/accuracy/`.

## Versions

Only the current `main` branch is supported. The site is rebuilt from `main`,
so a fix ships as soon as it is merged and deployed.

## In scope

- Cross-site scripting or content injection through the reader, search,
  bookmarks, settings, or any imported/stored value.
- Ways to make the app fetch or execute something it does not intend to.
- Supply-chain problems in this repository: dependencies, workflow files,
  build scripts.
- Anything that makes the displayed Quranic text differ from the pinned source
  data, or that defeats the build-time integrity checks.

## Out of scope

- The absence of a Content-Security-Policy on a host that cannot send custom
  headers (see `docs/security.md` for the recommended policy).
- Traffic-volume denial of service against a static host.
- The accuracy of the upstream dataset, which is a content matter.
- Findings that require an already-compromised browser, machine or extension.

## Safe harbour

Research aimed at this project's own code and its deployed copy is welcome,
provided you do not degrade the service for other readers, do not access
anyone else's data (there is none stored server-side to access), and give a
reasonable window to fix a finding before publishing it.
