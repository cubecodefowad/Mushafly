import Link from "next/link";
import { pageMetadata } from "@/lib/metadata";
import {
  SITE_OG_DESCRIPTION,
  SITE_TITLE,
  SITE_URL,
  SOCIAL_IMAGE_HEIGHT,
  SOCIAL_IMAGE_WIDTH,
  assetUrl,
} from "@/lib/site";

export const metadata = pageMetadata({
  title: "Social preview",
  description: "A preview of the Open Graph card and social metadata used by Mushafly.",
  path: "/social-preview/",
  noIndex: true,
});

const OG_IMAGE = "/og.png";

export default function SocialPreviewPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 pb-20 pt-12 sm:px-8 sm:pt-16">
      <p className="meta">Internal preview</p>
      <h1 className="display mt-3 text-4xl sm:text-5xl">Social preview</h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
        This page is a noindex check of the card a shared link points at. The
        image below is the same file served at{" "}
        <code className="rounded bg-surface px-1.5 py-0.5 text-xs text-ink">
          /og.png
        </code>{" "}
        and referenced by every page&apos;s Open Graph metadata.
      </p>

      <div className="mt-8 overflow-hidden rounded-xl border border-line bg-surface">
        <img
          src={OG_IMAGE}
          alt="Mushafly social card"
          width={SOCIAL_IMAGE_WIDTH}
          height={SOCIAL_IMAGE_HEIGHT}
          className="block h-auto w-full"
        />
        <div className="border-t border-line px-5 py-4">
          <p className="text-[0.6875rem] uppercase tracking-[0.14em] text-muted">
            {new URL(SITE_URL).host}
          </p>
          <p className="mt-1.5 text-base font-medium text-ink">{SITE_TITLE}</p>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">
            {SITE_OG_DESCRIPTION}
          </p>
        </div>
      </div>

      <section aria-labelledby="tags" className="mt-10">
        <h2 id="tags" className="display text-2xl">
          Metadata on every page
        </h2>
        <dl className="mt-4 divide-y divide-line border-y border-line text-sm">
          {[
            ["og:title", `${SITE_TITLE}`],
            ["og:description", SITE_OG_DESCRIPTION],
            ["og:image", assetUrl(OG_IMAGE)],
            ["og:image:size", `${SOCIAL_IMAGE_WIDTH} × ${SOCIAL_IMAGE_HEIGHT}`],
            ["twitter:card", "summary_large_image"],
            ["twitter:image", assetUrl("/twitter.png")],
          ].map(([key, value]) => (
            <div key={key} className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr]">
              <dt className="font-mono text-xs text-muted">{key}</dt>
              <dd className="break-words text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <p className="mt-6 text-xs leading-relaxed text-muted">
        Like all pages, this one declares a canonical URL and an Open Graph URL.
        Search pages and the local bookmarks and settings views are kept out of
        the sitemap; the two personal views are also marked{" "}
        <code className="text-ink">noindex</code>.
      </p>

      <nav aria-label="Related" className="mt-10 flex flex-wrap gap-3 border-t border-line pt-6">
        <Link href="/" className="button-primary">
          Read the Quran
        </Link>
        <Link href="/accuracy/" className="button-secondary">
          Accuracy and Sources
        </Link>
      </nav>
    </div>
  );
}
