import {
  ThemeProvider as NextThemesProvider,
  useTheme as useNextTheme,
} from "next-themes";
import type * as React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { applyThemeToElement } from "@/lib/apply-theme";
import { DEFAULT_THEME_URL, type FetchedTheme } from "@/lib/theme-utils";

const THEME_PRESET_STORAGE_KEY = "korex-theme-preset";

type PaletteMode = "light" | "dark";

type StoredTheme = {
  name: string;
  preset: NonNullable<FetchedTheme["preset"]>;
  url: string;
};

type ThemePresetProviderState = {
  mode: PaletteMode;
  selectedTheme: StoredTheme | null;
  setSelectedTheme: (theme: FetchedTheme) => void;
};

const ThemePresetContext = createContext<ThemePresetProviderState | null>(null);

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      <ThemePresetProvider>{children}</ThemePresetProvider>
    </NextThemesProvider>
  );
}

function ThemePresetProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useNextTheme();
  const [selectedTheme, setSelectedThemeState] = useState<StoredTheme | null>(
    () => {
      if (typeof window === "undefined") {
        return null;
      }

      return readStoredTheme();
    },
  );
  const mode: PaletteMode = resolvedTheme === "light" ? "light" : "dark";

  useEffect(() => {
    const root = window.document.documentElement;
    applyThemeToElement({
      element: root,
      mode,
      preset: selectedTheme?.preset ?? null,
    });
  }, [mode, selectedTheme]);

  const setSelectedTheme = useCallback((theme: FetchedTheme) => {
    if (theme.url === DEFAULT_THEME_URL || !theme.preset || theme.error) {
      window.localStorage.removeItem(THEME_PRESET_STORAGE_KEY);
      setSelectedThemeState(null);
      return;
    }

    const storedTheme: StoredTheme = {
      name: theme.name,
      preset: theme.preset,
      url: theme.url,
    };

    window.localStorage.setItem(
      THEME_PRESET_STORAGE_KEY,
      JSON.stringify(storedTheme),
    );
    setSelectedThemeState(storedTheme);
  }, []);

  const value = useMemo(
    () => ({ mode, selectedTheme, setSelectedTheme }),
    [mode, selectedTheme, setSelectedTheme],
  );

  return (
    <ThemePresetContext.Provider value={value}>
      {children}
    </ThemePresetContext.Provider>
  );
}

export function useThemePreset() {
  const context = useContext(ThemePresetContext);

  if (!context) {
    throw new Error("useThemePreset must be used within ThemeProvider");
  }

  return context;
}

function readStoredTheme(): StoredTheme | null {
  try {
    const storedTheme = window.localStorage.getItem(THEME_PRESET_STORAGE_KEY);

    if (!storedTheme) {
      return null;
    }

    const parsedTheme = JSON.parse(storedTheme) as Partial<StoredTheme>;

    if (
      typeof parsedTheme.name !== "string" ||
      typeof parsedTheme.url !== "string" ||
      !parsedTheme.preset
    ) {
      return null;
    }

    return {
      name: parsedTheme.name,
      preset: parsedTheme.preset,
      url: parsedTheme.url,
    };
  } catch {
    return null;
  }
}

export { useTheme } from "next-themes";
