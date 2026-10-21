"use client";

import { Check, ChevronDown, Mic, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  ACTIVE_GROUPS,
  RECITERS,
  reciterInfo,
  type ReciterId,
  type ReciterKind,
} from "@/data/reciters";

/**
 * The reciter list runs to dozens of editions, so it uses the same themed
 * search dialog as the translation picker instead of a segmented control that
 * would never fit. Entries are grouped by what they recite, because a Warsh or
 * translated recitation does not match the Hafs text on the page.
 */

type Option = {
  value: ReciterId;
  name: string;
  detail: string;
  kind: ReciterKind;
  search: string;
};

const OPTIONS: Option[] = RECITERS.map((reciter) => {
  const group = ACTIVE_GROUPS.find((candidate) => candidate.kind === reciter.kind);
  const detail = [reciter.bitrate, reciter.kind === "translation" ? reciter.language : null]
    .filter(Boolean)
    .join(" · ");
  return {
    value: reciter.id,
    name: reciter.name,
    detail,
    kind: reciter.kind,
    search: [reciter.name, reciter.bitrate, reciter.language, group?.label]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase(),
  };
});

type Props = {
  value: ReciterId;
  onChange: (value: ReciterId) => void;
  ariaLabel?: string;
  className?: string;
};

export function ReciterPicker({
  value,
  onChange,
  ariaLabel = "Reciter",
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

  const current = reciterInfo(value);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return OPTIONS;
    return OPTIONS.filter((option) => option.search.includes(needle));
  }, [query]);

  const groups = useMemo(
    () =>
      ACTIVE_GROUPS.map((group) => ({
        label: group.label,
        note: group.note,
        items: filtered
          .map((option, index) => ({ option, index }))
          .filter(({ option }) => option.kind === group.kind),
      })).filter((group) => group.items.length > 0),
    [filtered],
  );

  const optionId = (index: number) => `${baseId}-option-${filtered[index]?.value ?? index}`;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setQuery("");
      dialog.showModal();
      // showModal() focuses the close button; the search field is more useful.
      searchRef.current?.focus();
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

  const choose = (next: ReciterId) => {
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
        className={`input flex items-center justify-between gap-2 text-left text-xs ${className ?? ""}`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <Mic size={13} strokeWidth={1.8} className="shrink-0 text-muted" aria-hidden />
          <span className="truncate">{current.name}</span>
        </span>
        <ChevronDown size={12} strokeWidth={2} className="shrink-0 text-muted" aria-hidden />
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
            <p className="meta">Recitations</p>
            <h2 id={titleId} className="display text-xl">
              Choose a reciter
            </h2>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={() => setOpen(false)}
            aria-label="Close reciter picker"
          >
            <X size={18} strokeWidth={1.7} />
          </button>
        </div>

        <div className="border-b border-line px-5 py-3">
          <input
            ref={searchRef}
            type="search"
            className="input"
            placeholder="Search reciter, language or bitrate"
            aria-label="Search reciters"
            aria-controls={listId}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          <p className="mt-2 text-[0.6875rem] text-muted" aria-live="polite">
            {filtered.length === 1 ? "1 reciter" : `${filtered.length} reciters`}
          </p>
        </div>

        <div className="picker-body">
          <div
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label="Reciters"
            tabIndex={0}
            aria-activedescendant={filtered[active] ? optionId(active) : undefined}
            className="picker-list"
            onKeyDown={handleListKeyDown}
          >
            {groups.map((group) => (
              <div key={group.label} role="group" aria-label={group.label}>
                <p className="picker-group-label">
                  {group.label}
                  <span className="mt-1 block text-[0.6875rem] font-normal normal-case tracking-normal text-muted">
                    {group.note}
                  </span>
                </p>
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
                        <span className="block truncate text-sm">{option.name}</span>
                        <span className="block truncate text-xs text-muted">
                          {option.detail}
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
                No reciter matches “{query.trim()}”.
              </p>
            ) : null}
          </div>
        </div>
      </dialog>
    </>
  );
}
