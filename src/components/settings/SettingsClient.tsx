"use client";

import Link from "next/link";
import { useState } from "react";
import { ExternalLink, Monitor, Moon, Sun, Trash2 } from "lucide-react";
import { useReadingState } from "@/components/bookmarks/ReadingStateProvider";
import { MushafPicker } from "@/components/settings/MushafPicker";
import { ReciterPicker } from "@/components/settings/ReciterPicker";
import { useSettings } from "@/components/settings/SettingsProvider";
import { TranslationPicker } from "@/components/settings/TranslationPicker";
import { ACTIVE_GROUPS, EXCLUDED_RECITERS, RECITERS, reciterInfo } from "@/data/reciters";
import {
  TANZIL_TRANSLATIONS,
  groupedTranslations,
  translationInfo,
  translationLabel,
} from "@/data/translations";
import type { SourceInfo, ThemePreference } from "@/types/quran";

type IntegritySummary = {
  repository: string;
  commit: string;
  license: string;
  counts: {
    surahs: number;
    verses: number;
    tajweedSegments: number;
    audioEntries?: number;
  };
  issues: { outOfBounds: number; overlapping: number; bom: number };
  translationRows: Record<string, number>;
};

const THEMES: Array<{ value: ThemePreference; label: string; icon: typeof Sun }> = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

export function SettingsClient({
  source,
  integrity,
}: {
  source: SourceInfo;
  integrity: IntegritySummary;
}) {
  const { settings, update, reset } = useSettings();
  const { bookmarks, lastRead, clearBookmarks, clearLastRead, loaded } = useReadingState();
  const activeTranslation = translationInfo(settings.translation);
  const [confirmClear, setConfirmClear] = useState<"bookmarks" | "progress" | "settings" | null>(
    null,
  );

  const clear = (target: "bookmarks" | "progress" | "settings") => {
    if (confirmClear !== target) {
      setConfirmClear(target);
      return;
    }
    if (target === "bookmarks") clearBookmarks();
    if (target === "progress") clearLastRead();
    if (target === "settings") reset();
    setConfirmClear(null);
  };

  const confirmLabel = (target: "bookmarks" | "progress" | "settings") =>
    confirmClear === target ? "Click again to confirm" : undefined;

  return (
    <div className="mx-auto max-w-3xl px-5 pb-20 pt-12 sm:px-8 sm:pt-16">
      <p className="meta">Preferences</p>
      <h1 className="display mt-3 text-4xl sm:text-5xl">Settings</h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
        Everything here is stored locally. No account, no sync, and nothing you
        read or save is ever uploaded.
        Reading remains available if storage is blocked.
      </p>

      <section aria-labelledby="appearance" className="mt-12">
        <h2 id="appearance" className="display text-2xl">Appearance</h2>
        <div className="mt-4 rounded-xl border border-line bg-surface p-5">
          <p className="text-sm font-medium">Theme</p>
          <p className="mt-1 text-xs text-muted">
            System follows your device&apos;s light or dark preference.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {THEMES.map((item) => {
              const Icon = item.icon;
              const active = settings.theme === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => update({ theme: item.value })}
                  aria-pressed={active}
                  className={`flex flex-col items-center gap-2 rounded-lg border px-3 py-4 text-xs transition-colors ${
                    active
                      ? "border-accent bg-highlight/50 text-ink"
                      : "border-line text-muted hover:border-accent/40 hover:text-ink"
                  }`}
                >
                  <Icon size={18} strokeWidth={1.7} aria-hidden />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-line bg-surface p-5">
          <p className="text-sm font-medium">Mushaf border</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Paper, ink and a page frame for the reading view, in light and dark.
            These are original designs inspired by bound mushafs, not facsimiles
            of a particular edition.
          </p>
          <MushafPicker
            className="mt-4"
            value={settings.mushaf}
            onChange={(mushaf) => update({ mushaf })}
          />
        </div>
      </section>

      <section aria-labelledby="reading" className="mt-10">
        <h2 id="reading" className="display text-2xl">Reading</h2>
        <div className="mt-4 rounded-xl border border-line bg-surface px-5">
          <div className="settings-row">
            <div className="w-32 shrink-0">
              <p className="text-sm font-medium">Arabic size</p>
              <p className="mt-0.5 text-xs text-muted">{settings.arabicSize}px</p>
            </div>
            <input
              type="range"
              min={24}
              max={56}
              step={1}
              value={settings.arabicSize}
              onChange={(event) => update({ arabicSize: Number(event.target.value) })}
              aria-label="Arabic text size"
            />
            <span
              className="font-arabic hidden w-24 text-center text-2xl text-ink sm:block"
              lang="ar"
              dir="rtl"
              aria-hidden="true"
            >
              قراءة
            </span>
          </div>

          <div className="settings-row">
            <div className="w-32 shrink-0">
              <p className="text-sm font-medium">Translation</p>
              <p className="mt-0.5 text-xs text-muted">{settings.translationSize}px</p>
            </div>
            <input
              type="range"
              min={14}
              max={26}
              step={1}
              value={settings.translationSize}
              onChange={(event) => update({ translationSize: Number(event.target.value) })}
              aria-label="Translation text size"
            />
            <span
              className="hidden w-24 text-center text-sm text-muted sm:block"
              aria-hidden="true"
            >
              A quiet read.
            </span>
          </div>

          <div className="settings-row max-sm:flex-col max-sm:items-start">
            <div className="min-w-0">
              <p className="text-sm font-medium">Translation</p>
              <p className="mt-0.5 text-xs text-muted">
                {activeTranslation.translator} · {activeTranslation.source}
              </p>
            </div>
            <TranslationPicker
              variant="field"
              ariaLabel="Translation"
              value={settings.translation}
              onChange={(value) => {
                if (value !== "off") update({ translation: value, showTranslation: true });
              }}
              className="w-full max-w-[18rem]"
            />
          </div>

          <label className="settings-row cursor-pointer">
            <span>
              <span className="block text-sm font-medium">Show translation</span>
              <span className="mt-0.5 block text-xs text-muted">
                The Arabic ayah is always shown.
              </span>
            </span>
            <input
              type="checkbox"
              checked={settings.showTranslation}
              onChange={(event) => update({ showTranslation: event.target.checked })}
              className="h-4 w-4 accent-[var(--accent)]"
            />
          </label>

          <label className="settings-row cursor-pointer">
            <span>
              <span className="block text-sm font-medium">Tajweed highlighting</span>
              <span className="mt-0.5 block text-xs text-muted">
                Apply only source ranges that align exactly.
              </span>
            </span>
            <input
              type="checkbox"
              checked={settings.tajweed}
              onChange={(event) => update({ tajweed: event.target.checked })}
              className="h-4 w-4 accent-[var(--accent)]"
            />
          </label>

          <label className="settings-row cursor-pointer">
            <span>
              <span className="block text-sm font-medium">Follow the recitation</span>
              <span className="mt-0.5 block text-xs text-muted">
                Scroll to the verse currently playing.
              </span>
            </span>
            <input
              type="checkbox"
              checked={settings.autoScroll}
              onChange={(event) => update({ autoScroll: event.target.checked })}
              className="h-4 w-4 accent-[var(--accent)]"
            />
          </label>
        </div>
      </section>

      <section aria-labelledby="recitation" className="mt-10">
        <h2 id="recitation" className="display text-2xl">Recitation</h2>
        <div className="mt-4 rounded-xl border border-line bg-surface p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">Reciter</p>
              <p className="mt-1 text-xs text-muted">
                {reciterInfo(settings.reciter).name}
                {reciterInfo(settings.reciter).bitrate
                  ? ` · ${reciterInfo(settings.reciter).bitrate}`
                  : ""}
                {" · "}
                {reciterInfo(settings.reciter).source}
                {reciterInfo(settings.reciter).kind === "warsh"
                  ? " · Warsh reading"
                  : reciterInfo(settings.reciter).kind === "translation"
                    ? " · translated recitation"
                    : ""}
              </p>
            </div>
            <ReciterPicker
              value={settings.reciter}
              onChange={(value) => update({ reciter: value })}
              ariaLabel="Choose a reciter"
              className="w-full max-w-[18rem]"
            />
          </div>
          <ul className="mt-4 grid gap-1 text-xs text-muted sm:grid-cols-3">
            {ACTIVE_GROUPS.map((group) => (
              <li key={group.kind}>
                <span className="text-ink">{group.label}</span> ·{" "}
                {RECITERS.filter((reciter) => reciter.kind === group.kind).length}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[0.6875rem] leading-relaxed text-muted">
            One file per ayah, requested only when you press play. The default
            streams from the pinned dataset; every other reciter streams from
            everyayah.com. Changing reciter stops playback so the next verse
            starts from the source you chose.
          </p>
        </div>
      </section>

      <section aria-labelledby="data" className="mt-10">
        <h2 id="data" className="display text-2xl">Local data</h2>
        <div className="mt-4 rounded-xl border border-line bg-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
            <div>
              <p className="text-sm font-medium">Bookmarks</p>
              <p className="mt-0.5 text-xs text-muted">
                {loaded ? `${bookmarks.length} saved verse${bookmarks.length === 1 ? "" : "s"}` : "Loading…"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => clear("bookmarks")}
              disabled={!loaded || bookmarks.length === 0}
              className="button-secondary text-xs disabled:opacity-40"
              title={confirmLabel("bookmarks")}
            >
              <Trash2 size={14} strokeWidth={1.8} aria-hidden />
              {confirmClear === "bookmarks" ? "Confirm clear" : "Clear bookmarks"}
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-4">
            <div>
              <p className="text-sm font-medium">Last read position</p>
              <p className="mt-0.5 text-xs text-muted">
                {loaded && lastRead
                  ? `Surah ${lastRead.reference.surahNumber}, verse ${lastRead.reference.verseNumber}`
                  : "No position saved"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => clear("progress")}
              disabled={!loaded || !lastRead}
              className="button-secondary text-xs disabled:opacity-40"
            >
              <Trash2 size={14} strokeWidth={1.8} aria-hidden />
              {confirmClear === "progress" ? "Confirm clear" : "Clear position"}
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
            <div>
              <p className="text-sm font-medium">Reading preferences</p>
              <p className="mt-0.5 text-xs text-muted">
                Text sizes, theme, translation and Tajweed toggles.
              </p>
            </div>
            <button type="button" onClick={() => clear("settings")} className="button-secondary text-xs">
              {confirmClear === "settings" ? "Confirm reset" : "Reset preferences"}
            </button>
          </div>
          {confirmClear ? (
            <p className="mt-3 text-[0.6875rem] text-accent">
              Click the same action again to confirm, or choose another action to cancel.
            </p>
          ) : null}
        </div>
      </section>

      <section id="tajweed" aria-labelledby="tajweed-title" className="mt-10 scroll-mt-24">
        <h2 id="tajweed-title" className="display text-2xl">Tajweed integrity</h2>
        <div className="mt-4 space-y-3 rounded-xl border border-line bg-surface p-5 text-sm leading-relaxed text-muted">
          <p>
            Highlighting is produced only from the repository&apos;s{" "}
            <code className="rounded bg-surface-muted px-1 py-0.5 text-[0.75rem]">source/tajweed</code>{" "}
            ranges. The reader splits the original Arabic string at those
            boundaries; it never rewrites, normalizes, or fills in letters.
          </p>
          <p>
            {integrity.issues.outOfBounds} verses (all first verses) have ranges
            measured from an implicit Bismillah prefix in the source, so they are
            shown as plain text instead. {integrity.issues.overlapping} verses
            contain overlapping ranges and are treated the same way. These are
            pinned, counted exceptions — not silently repaired.
          </p>
          <p>
            The build validator checks every boundary against the displayed
            string and fails if a new anomaly appears. A clean run confirms
            consistency with the pinned revision; it is not a claim of textual
            authenticity beyond that source.
          </p>
          <p>
            <Link href="/tajweed/" className="text-accent underline decoration-line underline-offset-4">
              What every highlight colour and sign means
            </Link>
          </p>
        </div>
      </section>

      <section id="attribution" aria-labelledby="attribution-title" className="mt-10 scroll-mt-24">
        <h2 id="attribution-title" className="display text-2xl">Attribution</h2>
        <div className="mt-4 rounded-xl border border-line bg-surface p-5">
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[10rem_1fr]">
            <dt className="text-muted">Quran data</dt>
            <dd>
              <a
                href={`${integrity.repository}/tree/${integrity.commit}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-accent underline decoration-line underline-offset-4"
              >
                semarketir/quranjson
                <ExternalLink size={12} aria-hidden />
              </a>
              <span className="mt-1 block text-xs text-muted">
                Revision {integrity.commit} · {integrity.license} license
              </span>
            </dd>

            <dt className="text-muted">Translations</dt>
            <dd>
              <ul className="space-y-3">
                {groupedTranslations().map((group) => (
                  <li key={group.label}>
                    <p className="text-ink">
                      {group.label}{" "}
                      <span className="text-xs text-muted">
                        ({group.translations.length})
                      </span>
                    </p>
                    <ul className="mt-1 space-y-1 text-xs text-muted">
                      {group.translations.map((entry) => (
                        <li key={entry.languageCode}>
                          <span className="text-ink">{translationLabel(entry)}</span>{" "}
                          — {entry.translator}
                          <span className="block">
                            {entry.name} ({entry.id}) · {entry.source}
                            {entry.lastUpdate ? ` · Last update ${entry.lastUpdate}` : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </dd>

            <dt className="text-muted">Recitation</dt>
            <dd>
              <ul className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
                {RECITERS.map((reciter) => (
                  <li key={reciter.id}>
                    {reciter.name}
                    <span className="block text-xs text-muted">
                      {reciter.bitrate ? `${reciter.bitrate} · ` : ""}
                      {reciter.kind === "warsh" ? "Warsh · " : ""}
                      {reciter.language !== "Arabic" ? `${reciter.language} · ` : ""}
                      <a
                        href={reciter.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="underline decoration-line underline-offset-2"
                      >
                        {reciter.folder ? reciter.source : "source and licence"}
                      </a>
                    </span>
                  </li>
                ))}
              </ul>
              <span className="mt-2 block text-xs text-muted">
                The default is the pinned {source.audio.bitrate ?? "dataset"} copy
                from {source.audio.source}; its licence is documented at the link
                above. everyayah.com publishes no terms of its own, so the other
                recitations are streamed, never copied into this build.{" "}
                {EXCLUDED_RECITERS.filter((reciter) => reciter.reason === "incomplete").length}{" "}
                further folders are not offered because their files are missing,
                and{" "}
                {EXCLUDED_RECITERS.filter((reciter) => reciter.reason === "requested").length}{" "}
                were left out on request. The list is checked against the folder
                listings by <code>npm run data:reciters</code>.
              </span>
            </dd>

            <dt className="text-muted">Fonts</dt>
            <dd>
              Amiri Quran, Source Serif 4, Inter and Noto Nastaliq Urdu under
              the SIL Open Font License 1.1.
              <span className="mt-1 flex flex-wrap gap-3 text-xs text-muted">
                <a href="/fonts/OFL-AmiriQuran.txt" className="underline decoration-line underline-offset-2">
                  Amiri license
                </a>
                <a href="/fonts/OFL-SourceSerif4.txt" className="underline decoration-line underline-offset-2">
                  Source Serif license
                </a>
                <a href="/fonts/OFL-Inter.txt" className="underline decoration-line underline-offset-2">
                  Inter license
                </a>
                <a href="/fonts/OFL-NotoNastaliqUrdu.txt" className="underline decoration-line underline-offset-2">
                  Urdu font license
                </a>
              </span>
            </dd>

            <dt className="text-muted">Validated data</dt>
            <dd>
              {integrity.counts.surahs} surahs · {integrity.counts.verses.toLocaleString()}{" "}
              verses · {integrity.counts.tajweedSegments.toLocaleString()} Tajweed
              ranges · translation rows:{" "}
              {source.translations
                .map(
                  (entry) =>
                    `${entry.label} ${(integrity.translationRows[entry.languageCode] ?? 0).toLocaleString()}`,
                )
                .join(" · ")}{" "}
              · {TANZIL_TRANSLATIONS.length} Tanzil translations (6,236 rows each)
            </dd>
          </dl>
          <p className="mt-5 border-t border-line pt-4 text-[0.6875rem] leading-relaxed text-muted">
            The repository&apos;s MIT license covers the software, not the
            translation texts. Tanzil translations are used under{" "}
            <a
              href="https://tanzil.net/trans/"
              target="_blank"
              rel="noreferrer"
              className="text-accent underline decoration-line underline-offset-4"
            >
              Tanzil&apos;s terms
            </a>
            : non-commercial use only, with a link back to the translations
            page. Attribution for each dataset is preserved from its Tanzil
            header. This application adds no other Quranic content. The only
            measurement the app makes is an anonymous, cookieless page count.
          </p>
        </div>
      </section>

      <section aria-labelledby="legal" className="mt-10">
        <h2 id="legal" className="display text-2xl">Legal</h2>
        <div className="mt-4 space-y-2 rounded-xl border border-line bg-surface p-5 text-sm text-muted">
          <p>
            Mushafly stores your reading on this device only. The documents below
            describe exactly what is stored and the terms you accept by reading.
          </p>
          <ul className="space-y-2 pt-1">
            <li>
              <Link href="/accuracy/" className="text-accent underline decoration-line underline-offset-4">
                Accuracy and Sources
              </Link>
            </li>
            <li>
              <Link href="/privacy/" className="text-accent underline decoration-line underline-offset-4">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms/" className="text-accent underline decoration-line underline-offset-4">
                Terms of Service
              </Link>
            </li>
          </ul>
        </div>
      </section>

      <p className="mt-10 text-xs text-muted">
        <Link href="/" className="text-accent underline decoration-line underline-offset-4">
          Return to the surahs
        </Link>
      </p>
    </div>
  );
}
