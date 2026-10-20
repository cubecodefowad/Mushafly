"use client";

import {
  groupedTranslations,
  translationLabel,
} from "@/data/translations";
import type { TranslationLanguage } from "@/types/quran";

const GROUPS = groupedTranslations();

type Props = {
  value: TranslationLanguage | "off";
  onChange: (value: TranslationLanguage | "off") => void;
  includeOff?: boolean;
  className?: string;
  ariaLabel?: string;
  id?: string;
};

export function TranslationSelect({
  value,
  onChange,
  includeOff = false,
  className,
  ariaLabel = "Translation",
  id,
}: Props) {
  return (
    <select
      id={id}
      aria-label={ariaLabel}
      value={value}
      onChange={(event) => onChange(event.target.value as TranslationLanguage | "off")}
      className={className}
    >
      {includeOff ? <option value="off">Off</option> : null}
      {GROUPS.map((group) => (
        <optgroup key={group.label} label={group.label}>
          {group.translations.map((translation) => (
            <option key={translation.languageCode} value={translation.languageCode}>
              {translationLabel(translation)}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
