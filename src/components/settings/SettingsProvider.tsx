"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_SETTINGS,
  LEGACY_STORAGE_KEYS,
  STORAGE_KEYS,
  parseSettings,
  readStorage,
  removeStorage,
  writeStorage,
} from "@/lib/storage";
import type { ReaderSettings, ThemePreference } from "@/types/quran";

type SettingsContextValue = {
  settings: ReaderSettings;
  update: (patch: Partial<ReaderSettings>) => void;
  reset: () => void;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: ThemePreference) => void;
  loaded: boolean;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

function systemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS);
  const [system, setSystem] = useState<"light" | "dark">("light");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = readStorage(
      STORAGE_KEYS.settings,
      (value) => (value && typeof value === "object" ? parseSettings(value) : null),
      LEGACY_STORAGE_KEYS.settings,
    );
    if (stored) setSettings(stored);
    setSystem(systemTheme());
    setLoaded(true);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystem(media.matches ? "dark" : "light");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEYS.settings) return;
      if (!event.newValue) {
        setSettings(DEFAULT_SETTINGS);
        return;
      }
      try {
        setSettings(parseSettings(JSON.parse(event.newValue)));
      } catch {
        // Ignore malformed cross-tab state.
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const resolvedTheme = settings.theme === "system" ? system : settings.theme;

  useEffect(() => {
    if (!loaded) return;
    const root = document.documentElement;
    root.classList.toggle("dark", resolvedTheme === "dark");
    root.dataset.theme = settings.theme;
    root.style.setProperty("--arabic-size", `${settings.arabicSize}px`);
    root.style.setProperty("--translation-size", `${settings.translationSize}px`);
    writeStorage(STORAGE_KEYS.settings, settings);
  }, [settings, resolvedTheme, loaded]);

  const update = useCallback((patch: Partial<ReaderSettings>) => {
    setSettings((current) => parseSettings({ ...current, ...patch }));
  }, []);

  const reset = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    removeStorage(STORAGE_KEYS.settings);
  }, []);

  const setTheme = useCallback((theme: ThemePreference) => update({ theme }), [update]);

  const value = useMemo(
    () => ({ settings, update, reset, resolvedTheme, setTheme, loaded }),
    [settings, update, reset, resolvedTheme, setTheme, loaded],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used inside SettingsProvider");
  return context;
}
