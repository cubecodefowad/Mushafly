import Link from "next/link";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "What Mushafly stores, what it never collects, and which network requests the app makes.",
  path: "/privacy/",
});

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 pb-20 pt-12 sm:px-8 sm:pt-16">
      <p className="meta">Legal</p>
      <h1 className="display mt-3 text-4xl sm:text-5xl">Privacy Policy</h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
        Mushafly is a static reading application. It has no accounts and no
        advertising. Page views are counted anonymously through Vercel Web
        Analytics, and nothing else. This page states exactly what is stored,
        where it is stored, and what leaves your device.
      </p>

      <p className="mt-6 text-xs text-muted">Effective 18 October 2026.</p>

      <section aria-labelledby="stored" className="mt-12">
        <h2 id="stored" className="display text-2xl">What is stored on your device</h2>
        <div className="mt-4 space-y-3 rounded-xl border border-line bg-surface p-5 text-sm leading-relaxed text-muted">
          <p>
            Bookmarks, your last-read position, and reading preferences (text
            sizes, theme, translation language and Tajweed toggles) are written to your
            browser&apos;s <code className="rounded bg-surface-muted px-1 py-0.5 text-[0.75rem]">localStorage</code>{" "}
            under the keys{" "}
            <code className="rounded bg-surface-muted px-1 py-0.5 text-[0.75rem]">mushafly.bookmarks.v1</code>,{" "}
            <code className="rounded bg-surface-muted px-1 py-0.5 text-[0.75rem]">mushafly.lastRead.v1</code> and{" "}
            <code className="rounded bg-surface-muted px-1 py-0.5 text-[0.75rem]">mushafly.settings.v1</code>.
          </p>
          <p>
            This data never leaves your browser. It is not transmitted to us or
            to anyone else, and there is no sync or backup. You can inspect it in
            your browser&apos;s developer tools, and delete it at any time with
            Settings → Local data, or by clearing site data for this address.
          </p>
          <p>
            Mushafly sets no cookies, no tracking pixels, no advertising
            identifiers and no social media embeds.
          </p>
        </div>
      </section>

      <section aria-labelledby="measurement" className="mt-10">
        <h2 id="measurement" className="display text-2xl">Measurement</h2>
        <div className="mt-4 space-y-3 rounded-xl border border-line bg-surface p-5 text-sm leading-relaxed text-muted">
          <p>
            Page views are counted with{" "}
            <span className="text-ink">Vercel Web Analytics</span>, which is
            cookieless. It records the address of the page, the referring page,
            a coarse location derived from the connection, and the browser,
            operating system and device type. It keeps no identifier that
            survives the day: its visitor hash is discarded after 24 hours, so a
            reader cannot be followed from one day to the next, or across sites.
          </p>
          <p>
            Nothing you type or save is ever sent — no bookmark, no label, no
            reading position, no search term. The app records no custom events,
            and no advertising, profiling or data sharing is involved.
          </p>
          <p>
            This measurement runs only when the site is served by Vercel, which
            is the host of this copy; on a copy hosted anywhere else it is
            inert. Blocking it changes nothing about reading.
          </p>
        </div>
      </section>

      <section aria-labelledby="network" className="mt-10">
        <h2 id="network" className="display text-2xl">Network requests the app makes</h2>
        <div className="mt-4 space-y-3 rounded-xl border border-line bg-surface p-5 text-sm leading-relaxed text-muted">
          <p>
            <span className="text-ink">This site.</span> Pages, styles, scripts,
            fonts, the derived search index and the translation files are served
            from the host you are reading from. The default English translation
            is part of the page; every other translation is fetched from this
            same host only when you select it. As with any web server,
            that host can see your IP address, user agent, the page you
            requested and the time of the request, and may keep access logs.
          </p>
          <p>
            <span className="text-ink">Recitation audio.</span> Verses are read
            aloud from one MP3 per ayah, and only when you press play. Which host
            receives that request depends on the reciter you selected. The
            default recitation comes from{" "}
            <a
              className="underline decoration-line underline-offset-4 hover:text-ink"
              href="https://raw.githubusercontent.com/semarketir/quranjson"
              target="_blank"
              rel="noreferrer"
            >
              raw.githubusercontent.com
            </a>{" "}
            (the pinned dataset) and is handled under{" "}
            <a
              className="underline decoration-line underline-offset-4 hover:text-ink"
              href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
              target="_blank"
              rel="noreferrer"
            >
              GitHub&apos;s privacy statement
            </a>
            . The other reciters come from{" "}
            <a
              className="underline decoration-line underline-offset-4 hover:text-ink"
              href="https://everyayah.com/"
              target="_blank"
              rel="noreferrer"
            >
              everyayah.com
            </a>
            , which publishes no privacy policy we could link to; it can see your
            IP address, user agent and the ayah you requested. Reading, search,
            bookmarks and settings require no audio request at all.
          </p>
          <p>
            <span className="text-ink">Page counting.</span> The measurement
            described above is fetched from this same address, under{" "}
            <code className="rounded bg-surface-muted px-1 py-0.5 text-[0.75rem]">
              /_vercel/insights/…
            </code>
            , and only when Vercel serves the site. Vercel sees the request as
            any host would see a request for a page it serves; more detail is in
            Vercel&apos;s own privacy documentation.
          </p>
          <p>
            <span className="text-ink">Nothing else.</span> No other third-party
            scripts, no remote fonts, no CDNs beyond the host serving this site.
            When you follow an external link, including the source-data links in
            Settings, the destination site&apos;s own policy applies.
          </p>
        </div>
      </section>

      <section aria-labelledby="retention" className="mt-10">
        <h2 id="retention" className="display text-2xl">Retention and your choices</h2>
        <div className="mt-4 space-y-3 rounded-xl border border-line bg-surface p-5 text-sm leading-relaxed text-muted">
          <p>
            We hold no personal data about you, so there is nothing for us to
            delete, export or correct on our side. Everything Mushafly knows
            about your reading lives on your device and stays under your
            control.
          </p>
          <p>
            Blocking storage entirely is supported: the reader, search and
            navigation keep working, and only bookmarks and saved preferences
            are unavailable for that session.
          </p>
        </div>
      </section>

      <section aria-labelledby="changes" className="mt-10">
        <h2 id="changes" className="display text-2xl">Changes to this policy</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          If a future version of Mushafly collects anything new, this page will
          be updated before that version ships and the effective date above will
          change. The application is open source, so the behaviour described here
          can be checked against the code you are running.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Questions about this policy can be sent to{" "}
          <a
            href="mailto:hello@mushafly.com"
            className="text-accent underline decoration-line underline-offset-4"
          >
            hello@mushafly.com
          </a>
          . If you are reading a copy hosted by someone else, that host is also
          responsible for the copy you are using.
        </p>
      </section>

      <nav aria-label="Related" className="mt-12 flex flex-wrap gap-3 border-t border-line pt-6">
        <Link href="/terms/" className="button-secondary">Terms of Service</Link>
        <Link href="/accuracy/" className="button-secondary">Accuracy and Sources</Link>
        <Link href="/about/" className="button-secondary">About</Link>
      </nav>
    </div>
  );
}
