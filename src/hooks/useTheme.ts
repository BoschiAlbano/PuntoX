"use client";

import { useEffect } from "react";
import { create } from "zustand";

export type Theme = "light" | "dark";

interface ThemeStore {
  theme: Theme;
  isInitialized: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  initializeTheme: () => void;
}

const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: "light",
  isInitialized: false,
  setTheme: (newTheme: Theme) => {
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    set({ theme: newTheme });
  },
  toggleTheme: () => {
    const { theme } = get();
    const newTheme = theme === "light" ? "dark" : "light";
    get().setTheme(newTheme);
  },
  initializeTheme: () => {
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;

    let initialTheme: Theme = "light";
    if (savedTheme === "dark") {
      initialTheme = "dark";
    } else if (savedTheme === "light") {
      initialTheme = "light";
    } else {
      initialTheme = systemPrefersDark ? "dark" : "light";
    }

    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    set({ theme: initialTheme, isInitialized: true });
  },
}));

export function useTheme() {
  const store = useThemeStore();

  useEffect(() => {
    if (!store.isInitialized) {
      store.initializeTheme();
    }
  }, []);

  return {
    theme: store.theme,
    setTheme: store.setTheme,
    toggleTheme: store.toggleTheme,
    isDarkMode: store.theme === "dark",
    isInitialized: store.isInitialized,
  };
}
