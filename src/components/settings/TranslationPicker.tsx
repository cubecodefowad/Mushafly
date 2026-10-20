"use client";

import { Check, ChevronDown, Languages, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { groupedTranslations, translationInfo, translationLabel } from "@/data/translations";
import type { TranslationLanguage } from "@/types/quran";

/**
 * Native `<select>` dropdowns render as an operating-system menu, so a list of
 * 68 datasets arrives unthemed and taller than the window. This picker keeps
 * the same data in a styled dialog with search, so readers can find an edition
 * by language, translator or name.
 */

type Option = {
  value: TranslationLanguage;
  label: string;
  translator: string;
  group: string;
  search: string;
};

const OPTIONS: Option[] = groupedTranslations().flatMap((group) =>
  group.translations.map((translation) => ({
    value: translation.languageCode,
    label: translationLabel(translation),
    translator: translation.translator,
    group: group.label,
    search: `${group.label} ${translationLabel(translation)} ${translation.translator} ${translation.name}`
      .toLocaleLowerCase(),
  })),
);

type Props = {
  value: TranslationLanguage | "off";
  onChange: (value: TranslationLanguage | "off") => void;
  /** Offer a choice that hides the translation entirely. */
  includeOff?: boolean;
  ariaLabel?: string;
  /** `toolbar` is the compact reading control; `field` is a form control. */
  variant?: "toolbar" | "field";
  className?: string;
};

export function TranslationPicker({
  value,
  onChange,
  includeOff = false,
  ariaLabel = "Translation language",
  variant = "toolbar",
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const listId = `${baseId}-list`;

  const current = value === "off" ? "Off" : translationLabel(translationInfo(value));

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return OPTIONS;
    return OPTIONS.filter((option) => option.search.includes(needle));
  }, [query]);

  const groups = useMemo(() => {
    const result: Array<{ label: string; items: Array<{ option: Option; index: number }> }> = [];
    filtered.forEach((option, index) => {
      let group = result.find((candidate) => candidate.label === option.group);
      if (!group) {
        group = { label: option.group, items: [] };
        result.push(group);
      }
      group.items.push({ option, index });
    });
    return result;
  }, [filtered]);

  const optionId = (index: number) => `${baseId}-option-${filtered[index]?.value ?? index}`;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setQuery("");
      dialog.showModal();
      requestAnimationFrame(() => searchRef.current?.focus());
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (wasOpen.current && !open) triggerRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const selected = filtered.findIndex((option) => option.value === value);
    setActive(selected >= 0 ? selected : 0);
  }, [open, filtered, value]);

  useEffect(() => {
    setActive((index) => Math.min(index, Math.max(filtered.length - 1, 0)));
  }, [filtered.length]);

  useEffect(() => {
    if (!open) return;
    document.getElementById(optionId(active))?.scrollIntoView({ block: "nearest" });
  }, [active, open, filtered]);

  const choose = (next: TranslationLanguage | "off") => {
    onChange(next);
    setOpen(false);
  };

  const handleListKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, filtered.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Home") {
      event.preventDefault();
      setActive(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActive(Math.max(filtered.length - 1, 0));
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const option = filtered[active];
      if (option) choose(option.value);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      listRef.current?.focus();
    } else if (event.key === "Enter") {
      event.preventDefault();
      const option = filtered[active] ?? filtered[0];
      if (option) choose(option.value);
    } else if (event.key === "Escape") {
      // A focused search field would otherwise consume Escape to clear itself.
      event.preventDefault();
      setOpen(false);
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        title={ariaLabel}
        className={
          variant === "toolbar"
            ? "icon-button cursor-pointer px-2"
            : `input flex items-center justify-between gap-2 text-left text-xs ${className ?? ""}`
        }
      >
        {variant === "toolbar" ? (
          <Languages size={16} strokeWidth={1.8} aria-hidden />
        ) : null}
        <span className="max-w-[10rem] truncate">{current}</span>
        <ChevronDown
          size={12}
          strokeWidth={2}
          className={variant === "toolbar" ? "text-muted" : "shrink-0 text-muted"}
          aria-hidden
        />
      </button>

      <dialog
        ref={dialogRef}
        className="sheet translation-picker"
        aria-labelledby={titleId}
        onCancel={(event) => {
          event.preventDefault();
          setOpen(false);
        }}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === dialogRef.current) setOpen(false);
        }}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <p className="meta">Translations</p>
            <h2 id={titleId} className="display text-xl">
              Choose a translation
            </h2>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={() => setOpen(false)}
            aria-label="Close translation picker"
          >
            <X size={18} strokeWidth={1.7} />
          </button>
        </div>

        <div className="border-b border-line px-5 py-3">
          <input
            ref={searchRef}
            type="search"
            className="input"
            placeholder="Search language, translator or edition"
            aria-label="Search translations"
            aria-controls={listId}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          <p className="mt-2 text-[0.6875rem] text-muted" aria-live="polite">
            {filtered.length === 1 ? "1 translation" : `${filtered.length} translations`}
          </p>
        </div>

        <div className="picker-body">
          {includeOff && query.trim() === "" ? (
            <button
              type="button"
              className="picker-option"
              data-value="off"
              aria-pressed={value === "off"}
              onClick={() => choose("off")}
            >
              <span className="min-w-0">
                <span className="block truncate text-sm">Off</span>
                <span className="block truncate text-xs text-muted">
                  Hide the translation, keep the Arabic ayah
                </span>
              </span>
              {value === "off" ? <Check size={14} className="shrink-0 text-accent" aria-hidden /> : null}
            </button>
          ) : null}

          <div
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label="Translations"
            tabIndex={0}
            aria-activedescendant={filtered[active] ? optionId(active) : undefined}
            className="picker-list"
            onKeyDown={handleListKeyDown}
          >
            {groups.map((group) => (
              <div key={group.label} role="group" aria-label={group.label}>
                <p className="picker-group-label">{group.label}</p>
                {group.items.map(({ option, index }) => {
                  const selected = option.value === value;
                  return (
                    <div
                      key={option.value}
                      id={optionId(index)}
                      role="option"
                      aria-selected={selected}
                      data-value={option.value}
                      data-active={index === active}
                      className="picker-option"
                      onClick={() => choose(option.value)}
                      onMouseMove={() => setActive(index)}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm">{option.label}</span>
                        <span className="block truncate text-xs text-muted">
                          {option.translator}
                        </span>
                      </span>
                      {selected ? (
                        <Check size={14} className="shrink-0 text-accent" aria-hidden />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ))}
            {filtered.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted">
                No translation matches “{query.trim()}”.
              </p>
            ) : null}
          </div>
        </div>
      </dialog>
    </>
  );
}
