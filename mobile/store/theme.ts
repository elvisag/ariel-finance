import { create } from "zustand";
import { useColorScheme as useSystemColorScheme } from "react-native";

export type Theme = "dark" | "light" | "system";

interface ThemeState {
  preference: Theme;
  setPreference: (t: Theme) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  preference: "system",
  setPreference: (t: Theme) => set({ preference: t }),
}));

export function useEffectiveTheme(): "dark" | "light" {
  const preference = useThemeStore((s) => s.preference);
  const system = useSystemColorScheme();
  if (preference === "system") {
    return system === "dark" ? "dark" : "light";
  }
  return preference;
}

export const THEME_VARIABLES: Record<string, Record<string, string>> = {
  dark: {
    "--color-bg": "#181818",
    "--color-bg-surface": "#383838",
    "--color-bg-elevated": "#484848",
    "--color-bg-hover": "#404040",
    "--color-text-primary": "#f8f8f8",
    "--color-text-secondary": "#a0a0a0",
    "--color-text-muted": "#707070",
    "--color-border": "#303030",
    "--color-border-light": "#484848",
  },
  light: {
    "--color-bg": "#f3f4f6",
    "--color-bg-surface": "#ffffff",
    "--color-bg-elevated": "#f9fafb",
    "--color-bg-hover": "#f0f0f0",
    "--color-text-primary": "#111827",
    "--color-text-secondary": "#4b5563",
    "--color-text-muted": "#9ca3af",
    "--color-border": "#d1d5db",
    "--color-border-light": "#e5e7eb",
  },
};
