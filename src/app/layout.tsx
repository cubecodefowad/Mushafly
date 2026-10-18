import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ReadingStateProvider } from "@/components/bookmarks/ReadingStateProvider";
import { SettingsProvider } from "@/components/settings/SettingsProvider";
import { ThemeScript } from "@/components/settings/ThemeScript";

export const metadata: Metadata = {
  title: {
    default: "Mushafly — A quiet place to read the Quran",
    template: "%s · Mushafly",
  },
  description:
    "Read all 114 surahs with Arabic text, the Itani English translation, source-derived Tajweed highlighting, recitation and local bookmarks.",
  applicationName: "Mushafly",
  authors: [{ name: "Mushafly" }],
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
    title: "Mushafly — A quiet place to read the Quran",
    description:
      "An elegant, source-faithful Quran reader with Arabic, English, Tajweed and audio.",
    type: "website",
    locale: "en",
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
        </SettingsProvider>
      </body>
    </html>
  );
}
