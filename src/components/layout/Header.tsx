"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Bookmark,
  Menu,
  Moon,
  Search,
  Settings,
  Sun,
  X,
} from "lucide-react";
import { useSettings } from "@/components/settings/SettingsProvider";
import { BrandMark } from "@/components/layout/BrandMark";

const NAV = [
  { href: "/", label: "Surahs", match: (path: string) => path === "/" || path.startsWith("/surah") },
  { href: "/search/", label: "Search", match: (path: string) => path.startsWith("/search") },
  { href: "/bookmarks/", label: "Bookmarks", match: (path: string) => path.startsWith("/bookmarks") },
  { href: "/about/", label: "About", match: (path: string) => path.startsWith("/about") },
];

export function Header() {
  const pathname = usePathname() ?? "/";
  const { resolvedTheme, setTheme } = useSettings();
  const [menuOpen, setMenuOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (menuOpen && !dialog.open) dialog.showModal();
    if (!menuOpen && dialog.open) dialog.close();
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const nextTheme = resolvedTheme === "dark" ? "light" : "dark";

  return (
    <>
      <header className="site-header sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-ink"
            aria-label="Mushafly home"
          >
            <BrandMark />
            <span className="display text-[1.35rem] leading-none tracking-tight">Mushafly</span>
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-1 sm:flex">
            {NAV.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative rounded-md px-3 py-2 text-[0.8125rem] transition-colors ${
                    active
                      ? "text-ink after:absolute after:inset-x-3 after:-bottom-[1.05rem] after:h-px after:bg-accent"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-0.5">
            <Link
              href="/search/"
              className="icon-button sm:hidden"
              aria-label="Search the Quran"
            >
              <Search size={18} strokeWidth={1.7} />
            </Link>
            <button
              type="button"
              className="icon-button hidden sm:inline-flex"
              onClick={() => setTheme(nextTheme)}
              aria-label={`Switch to ${nextTheme} theme`}
              title={`Switch to ${nextTheme} theme`}
            >
              {resolvedTheme === "dark" ? (
                <Sun size={18} strokeWidth={1.7} />
              ) : (
                <Moon size={18} strokeWidth={1.7} />
              )}
            </button>
            <Link
              href="/settings/"
              className="icon-button hidden sm:inline-flex"
              aria-label="Reading settings"
            >
              <Settings size={18} strokeWidth={1.7} />
            </Link>
            <button
              type="button"
              className="icon-button sm:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
            >
              <Menu size={20} strokeWidth={1.7} />
            </button>
          </div>
        </div>
      </header>

      <dialog
        ref={dialogRef}
        className="sheet"
        aria-label="Menu"
        onClose={() => setMenuOpen(false)}
        onCancel={() => setMenuOpen(false)}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <span className="display text-lg">Menu</span>
          <button
            type="button"
            className="icon-button"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} strokeWidth={1.7} />
          </button>
        </div>
        <nav aria-label="Mobile" className="px-2 py-2">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-between rounded-md px-3 py-3 text-sm text-ink hover:bg-surface-muted"
            >
              {item.label}
              {item.href === "/bookmarks/" ? (
                <Bookmark size={16} strokeWidth={1.7} aria-hidden />
              ) : null}
            </Link>
          ))}
          <Link
            href="/settings/"
            onClick={() => setMenuOpen(false)}
            className="flex items-center justify-between rounded-md px-3 py-3 text-sm text-ink hover:bg-surface-muted"
          >
            Settings
            <Settings size={16} strokeWidth={1.7} aria-hidden />
          </Link>
        </nav>
        <div className="border-t border-line px-5 py-4">
          <p className="meta mb-2">Theme</p>
          <button
            type="button"
            className="button-secondary w-full"
            onClick={() => setTheme(nextTheme)}
          >
            {resolvedTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            Use {nextTheme} theme
          </button>
        </div>
        <div className="h-6" />
      </dialog>
    </>
  );
}
