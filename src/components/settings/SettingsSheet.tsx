"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { MushafPicker } from "@/components/settings/MushafPicker";
import { useSettings } from "@/components/settings/SettingsProvider";
import { ReciterPicker } from "@/components/settings/ReciterPicker";
import { TranslationPicker } from "@/components/settings/TranslationPicker";
import { mushafThemeInfo } from "@/data/mushaf-themes";
import { reciterInfo } from "@/data/reciters";
import { translationInfo } from "@/data/translations";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function SettingsSheet({ open, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { settings, update, reset } = useSettings();
  const activeTranslation = translationInfo(settings.translation);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="sheet"
      aria-labelledby="reading-settings-title"
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface px-5 py-4">
        <div>
          <p className="meta">Preferences</p>
          <h2 id="reading-settings-title" className="display text-xl">
            Reading settings
          </h2>
        </div>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Close settings">
          <X size={18} strokeWidth={1.7} />
        </button>
      </div>

      <div className="px-5 pb-8 pt-2">
        <div className="settings-row">
          <div>
            <p className="text-sm font-medium">Arabic size</p>
            <p className="mt-0.5 text-xs text-muted">Independent of the translation.</p>
          </div>
          <div className="w-32">
            <input
              type="range"
              min={24}
              max={56}
              step={1}
              value={settings.arabicSize}
              onChange={(event) => update({ arabicSize: Number(event.target.value) })}
              aria-label="Arabic text size"
              aria-valuetext={`${settings.arabicSize} pixels`}
            />
            <p className="mt-1 text-right text-[0.6875rem] tabular-nums text-muted">
              {settings.arabicSize}px
            </p>
          </div>
        </div>

        <div className="settings-row">
          <div>
            <p className="text-sm font-medium">Translation size</p>
            <p className="mt-0.5 text-xs text-muted">Set separately from Arabic.</p>
          </div>
          <div className="w-32">
            <input
              type="range"
              min={14}
              max={26}
              step={1}
              value={settings.translationSize}
              onChange={(event) => update({ translationSize: Number(event.target.value) })}
              aria-label="Translation text size"
              aria-valuetext={`${settings.translationSize} pixels`}
            />
            <p className="mt-1 text-right text-[0.6875rem] tabular-nums text-muted">
              {settings.translationSize}px
            </p>
          </div>
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

        <div className="settings-row max-sm:flex-col max-sm:items-start">
          <div className="min-w-0">
            <p className="text-sm font-medium">Reciter</p>
            <p className="mt-0.5 text-xs text-muted">
              {reciterInfo(settings.reciter).name}
              {reciterInfo(settings.reciter).bitrate
                ? ` · ${reciterInfo(settings.reciter).bitrate}`
                : ""}
            </p>
          </div>
          <ReciterPicker
            value={settings.reciter}
            onChange={(value) => update({ reciter: value })}
            ariaLabel="Reciter"
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
              Only source annotations that align exactly.
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
              Scroll to the verse that is playing.
            </span>
          </span>
          <input
            type="checkbox"
            checked={settings.autoScroll}
            onChange={(event) => update({ autoScroll: event.target.checked })}
            className="h-4 w-4 accent-[var(--accent)]"
          />
        </label>

        <div className="settings-row">
          <div>
            <p className="text-sm font-medium">Theme</p>
            <p className="mt-0.5 text-xs text-muted">System follows your device.</p>
          </div>
          <div className="segmented" role="group" aria-label="Theme">
            {(["system", "light", "dark"] as const).map((theme) => (
              <button
                key={theme}
                type="button"
                aria-pressed={settings.theme === theme}
                onClick={() => update({ theme })}
                className="capitalize"
              >
                {theme}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-row max-sm:flex-col max-sm:items-start">
          <div className="min-w-0">
            <p className="text-sm font-medium">Mushaf border</p>
            <p className="mt-0.5 text-xs text-muted">
              {mushafThemeInfo(settings.mushaf).description}
            </p>
          </div>
          <MushafPicker
            variant="compact"
            value={settings.mushaf}
            onChange={(mushaf) => update({ mushaf })}
            className="w-full max-w-[18rem]"
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/settings/"
            onClick={onClose}
            className="text-xs text-accent underline decoration-line underline-offset-4"
          >
            All settings &amp; attribution
          </Link>
          <button
            type="button"
            onClick={reset}
            className="text-xs text-muted underline decoration-line underline-offset-4 hover:text-ink"
          >
            Reset preferences
          </button>
        </div>
        <p className="mt-4 text-[0.6875rem] leading-relaxed text-muted">
          Preferences and bookmarks are stored only in this browser. Clearing site
          data removes them.
        </p>
      </div>
    </dialog>
  );
}
