"use client";

import { useCallback, useSyncExternalStore } from "react";

import { THEME_KEY, type Theme } from "@/lib/theme";

const listeners = new Set<() => void>();
const read = (): Theme => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");

export function useTheme() {
  const theme = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => "light" as Theme,
  );

  const setTheme = useCallback((t: Theme) => {
    document.documentElement.dataset.theme = t;
    try {
      window.localStorage.setItem(THEME_KEY, t);
    } catch {}
    listeners.forEach((l) => l());
  }, []);

  /** true quando não há escolha guardada e o tema segue o aparelho. */
  const system = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => {
      try {
        const v = window.localStorage.getItem(THEME_KEY);
        return v !== "light" && v !== "dark";
      } catch {
        return true;
      }
    },
    () => true,
  );

  const setSystem = useCallback(() => {
    try {
      window.localStorage.removeItem(THEME_KEY);
    } catch {}
    document.documentElement.dataset.theme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    listeners.forEach((l) => l());
  }, []);

  return { theme, system, setTheme, setSystem, toggle: () => setTheme(theme === "dark" ? "light" : "dark") };
}
