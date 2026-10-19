import type { Metadata } from "next";
import {
  SITE_NAME,
  SOCIAL_IMAGE_ALT,
  SOCIAL_IMAGE_HEIGHT,
  SOCIAL_IMAGE_WIDTH,
  absoluteUrl,
  assetUrl,
} from "@/lib/site";

type PageMetadataOptions = {
  /** Short page title; the root template appends “· Mushafly”. */
  title: string;
  description: string;
  /** Route path such as `/about/`; used for canonical and Open Graph URLs. */
  path: string;
  type?: "website" | "article";
  noIndex?: boolean;
};

/**
 * Every indexable page carries its own canonical URL and social card text.
 * The Open Graph and Twitter images themselves come from the route-level
 * `opengraph-image.tsx` and `twitter-image.tsx` files, so they stay in sync
 * with the visible brand rather than being repeated as strings here.
 */
export function pageMetadata({
  title,
  description,
  path,
  type = "website",
  noIndex = false,
}: PageMetadataOptions): Metadata {
  const canonical = absoluteUrl(path);
  const socialTitle = `${title} · ${SITE_NAME}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type,
      url: canonical,
      siteName: SITE_NAME,
      locale: "en_US",
      title: socialTitle,
      description,
      images: [
        {
          url: assetUrl("/og.png"),
          type: "image/png",
          width: SOCIAL_IMAGE_WIDTH,
          height: SOCIAL_IMAGE_HEIGHT,
          alt: SOCIAL_IMAGE_ALT,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [
        {
          url: assetUrl("/twitter.png"),
          type: "image/png",
          width: SOCIAL_IMAGE_WIDTH,
          height: SOCIAL_IMAGE_HEIGHT,
          alt: SOCIAL_IMAGE_ALT,
        },
      ],
    },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}


