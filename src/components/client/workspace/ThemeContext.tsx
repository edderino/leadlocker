"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type ThemeOption = "default" | "red" | "yellow" | "purple";

interface ThemeContextValue {
  theme: ThemeOption;
  setTheme: (theme: ThemeOption) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STYLES: Record<ThemeOption, {
  cardBaseClass: string;
  cardHoverClass: string;
  accentTextClass: string;
  linkHoverClass: string;
}> = {
  default: {
    cardBaseClass: "shadow-[0_4px_16px_rgba(0,0,0,0.3)]",
    cardHoverClass: "hover:shadow-[0_10px_30px_rgba(110,160,255,0.4)] hover:border-[#6f9fff]/70",
    accentTextClass: "text-[#a8c4ff]",
    linkHoverClass: "hover:text-[#6f9fff]",
  },
  red: {
    cardBaseClass: "shadow-[0_4px_16px_rgba(0,0,0,0.3)]",
    cardHoverClass: "hover:shadow-[0_10px_30px_rgba(255,120,120,0.4)] hover:border-[#ff8a8a]/70",
    accentTextClass: "text-[#ffc2c2]",
    linkHoverClass: "hover:text-[#ff8a8a]",
  },
  yellow: {
    cardBaseClass: "shadow-[0_4px_16px_rgba(0,0,0,0.3)]",
    cardHoverClass: "hover:shadow-[0_10px_30px_rgba(255,214,110,0.4)] hover:border-[#ffd46e]/70",
    accentTextClass: "text-[#ffe7a3]",
    linkHoverClass: "hover:text-[#ffd46e]",
  },
  purple: {
    cardBaseClass: "shadow-[0_4px_16px_rgba(0,0,0,0.3)]",
    cardHoverClass: "hover:shadow-[0_10px_30px_rgba(168,134,255,0.4)] hover:border-[#a886ff]/70",
    accentTextClass: "text-[#d5c8ff]",
    linkHoverClass: "hover:text-[#a886ff]",
  },
};

const THEME_STORAGE_KEY = "leadlocker-client-theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeOption>(() => {
    if (typeof window === "undefined") return "default";
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as ThemeOption | null;
    return stored ?? "default";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export function useThemeStyles() {
  const { theme } = useTheme();
  return THEME_STYLES[theme];
}

export const themeOptions: Array<{ id: ThemeOption; label: string; swatch: string }> = [
  { id: "default", label: "Default", swatch: "bg-[#6f9fff]" },
  { id: "red", label: "Red", swatch: "bg-[#ff8a8a]" },
  { id: "yellow", label: "Yellow", swatch: "bg-[#ffd46e]" },
  { id: "purple", label: "Purple", swatch: "bg-[#a886ff]" },
];
