import Link from "next/link";
import { BrandMark } from "@/components/layout/BrandMark";
import { sourceInfo } from "@/data/attribution";
import { RECITERS } from "@/data/reciters";
import { TANZIL_TRANSLATIONS } from "@/data/translations";

export function Footer() {
  return (
    <footer className="site-footer mt-20 border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:grid-cols-[1.4fr_1fr_1fr] sm:px-8">
        <div>
          <p className="flex items-center gap-2 text-lg">
            <BrandMark className="h-5 w-5" />
            <span className="display">Mushafly</span>
          </p>
          <p className="mt-2 max-w-xs text-[0.8125rem] leading-relaxed text-muted">
            A quiet place to read the Quran. No account, no cookies, no
            substituted text.
          </p>
          <p className="mt-3 text-[0.8125rem] text-muted">
            Contact:{" "}
            <a
              className="underline decoration-line underline-offset-4 hover:text-ink"
              href="mailto:hello@mushafly.com"
            >
              hello@mushafly.com
            </a>
          </p>
        </div>
        <nav aria-label="Footer" className="text-[0.8125rem]">
          <p className="meta mb-3">Sections</p>
          <ul className="space-y-2 text-muted">
            <li><Link className="hover:text-ink" href="/">Surahs</Link></li>
            <li><Link className="hover:text-ink" href="/search/">Search</Link></li>
            <li><Link className="hover:text-ink" href="/bookmarks/">Bookmarks</Link></li>
            <li><Link className="hover:text-ink" href="/settings/">Settings</Link></li>
            <li><Link className="hover:text-ink" href="/tajweed/">Tajweed and marks</Link></li>
            <li><Link className="hover:text-ink" href="/about/">About</Link></li>
          </ul>
          <p className="meta mb-3 mt-6">Legal</p>
          <ul className="space-y-2 text-muted">
            <li><Link className="hover:text-ink" href="/accuracy/">Accuracy and Sources</Link></li>
            <li><Link className="hover:text-ink" href="/terms/">Terms of Service</Link></li>
            <li><Link className="hover:text-ink" href="/privacy/">Privacy Policy</Link></li>
          </ul>
        </nav>
        <div className="text-[0.8125rem] leading-relaxed text-muted">
          <p className="meta mb-3">Source</p>
          <p>
            Quran, translation, Tajweed and audio:{" "}
            <a
              className="underline decoration-line underline-offset-4 hover:text-ink"
              href={`${sourceInfo.repository}/tree/${sourceInfo.commit}`}
              target="_blank"
              rel="noreferrer"
            >
              quranjson
            </a>{" "}
            (MIT).
          </p>
          <p className="mt-2">
            {sourceInfo.translations.map((entry) => (
              <span key={entry.languageCode} className="block">
                {entry.languageCode === "ar" ? "Arabic commentary" : entry.label}:{" "}
                {entry.translator} ({entry.source}).
              </span>
            ))}
          </p>
          <p className="mt-2">
            {TANZIL_TRANSLATIONS.length} translations from{" "}
            <a
              className="underline decoration-line underline-offset-4 hover:text-ink"
              href="https://tanzil.net/trans/"
              target="_blank"
              rel="noreferrer"
            >
              Tanzil.net/trans
            </a>{" "}
            (non-commercial).
          </p>
          <p className="mt-1">
            Recitation: Saad Al-Ghamadi (pinned), plus {RECITERS.length - 1}{" "}
            editions streamed from everyayah.com.
          </p>
          <Link
            href="/settings/#attribution"
            className="mt-3 inline-block text-accent underline decoration-line underline-offset-4"
          >
            Full attribution
          </Link>
        </div>
      </div>
      <div className="border-t border-line px-5 py-4 text-center text-[0.6875rem] text-muted sm:px-8">
        Pinned revision {sourceInfo.commit.slice(0, 7)} · Integrity-checked at build
      </div>
    </footer>
  );
}
