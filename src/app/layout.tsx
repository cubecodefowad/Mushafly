import type { Metadata, Viewport } from "next";
import { SiteAnalytics } from "@/components/analytics/SiteAnalytics";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ReadingStateProvider } from "@/components/bookmarks/ReadingStateProvider";
import { SettingsProvider } from "@/components/settings/SettingsProvider";
import { ThemeScript } from "@/components/settings/ThemeScript";
import {
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_OG_DESCRIPTION,
  SITE_TITLE,
  SITE_URL,
  SOCIAL_IMAGE_ALT,
  SOCIAL_IMAGE_HEIGHT,
  SOCIAL_IMAGE_WIDTH,
  assetUrl,
} from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "education",
  keywords: SITE_KEYWORDS,
  formatDetection: { telephone: false, address: false, email: false },
  // Two browser icons, one per colour scheme. Chromium honours the `media`
  // query; Firefox (browsers-compat-data issue 24213) and Safari ignore it and
  // use the first icon, so the light variant is declared first and stays
  // legible on either tab strip.
  icons: {
    icon: [
      { url: "/brand/favicon-light-32.png", type: "image/png", sizes: "32x32" },
      {
        url: "/brand/favicon-dark-32.png",
        type: "image/png",
        sizes: "32x32",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    apple: [{ url: "/brand/apple-touch-icon-180.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_OG_DESCRIPTION,
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: SITE_NAME,
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
    title: SITE_TITLE,
    description: SITE_OG_DESCRIPTION,
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
};

const WEBSITE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  inLanguage: "en",
  publisher: {
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: assetUrl("/brand/mark-light.png"),
  },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/search/?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF8F3" },
    { media: "(prefers-color-scheme: dark)", color: "#171916" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_SCHEMA) }}
        />
        <ThemeScript />
        <link
          rel="preload"
          href="/fonts/amiri-quran-arabic.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/source-serif-4-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <SettingsProvider>
          <ReadingStateProvider>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main id="main" className="flex-1">
                {children}
              </main>
              <Footer />
            </div>
          </ReadingStateProvider>
          {/* Cookieless page counts, served from this origin by Vercel at
              /_vercel/insights/*, with query strings stripped. It reports
              nothing when the site is not on Vercel. See /privacy/. */}
          <SiteAnalytics />
        </SettingsProvider>
      </body>
    </html>
  );
}
