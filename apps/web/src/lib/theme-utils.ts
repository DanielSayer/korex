export const DEFAULT_THEME_URL = "korex://default";

export const THEME_URLS = [
  "https://tweakcn.com/editor/theme?theme=amber-minimal",
  "https://tweakcn.com/editor/theme?theme=amethyst-haze",
  "https://tweakcn.com/editor/theme?theme=claymorphism",
  "https://tweakcn.com/editor/theme?theme=darkmatter",
  "https://tweakcn.com/editor/theme?theme=doom-64",
  "https://tweakcn.com/editor/theme?theme=graphite",
  "https://tweakcn.com/editor/theme?theme=modern-minimal",
  "https://tweakcn.com/editor/theme?theme=nature",
  "https://tweakcn.com/editor/theme?theme=northern-lights",
  "https://tweakcn.com/editor/theme?theme=sage-garden",
  "https://tweakcn.com/editor/theme?theme=soft-pop",
  "https://tweakcn.com/editor/theme?theme=starry-night",
  "https://tweakcn.com/editor/theme?theme=sunset-horizon",
  "https://tweakcn.com/editor/theme?theme=supabase",
  "https://tweakcn.com/editor/theme?theme=tangerine",
];

export type ThemePreset = {
  cssVars: {
    theme: Record<string, string>;
    light: Record<string, string>;
    dark: Record<string, string>;
  };
};

export type FetchedTheme = {
  name: string;
  preset: ThemePreset | null;
  url: string;
  error?: string;
};

export const defaultTheme: FetchedTheme = {
  name: "Korex",
  preset: null,
  url: DEFAULT_THEME_URL,
};

function convertToThemePreset(externalTheme: unknown): ThemePreset {
  if (
    typeof externalTheme === "object" &&
    externalTheme !== null &&
    "cssVars" in externalTheme
  ) {
    const cssVars = externalTheme.cssVars as Partial<ThemePreset["cssVars"]>;

    return {
      cssVars: {
        theme: cssVars.theme ?? {},
        light: cssVars.light ?? {},
        dark: cssVars.dark ?? {},
      },
    };
  }

  throw new Error("Unsupported theme format");
}

function getThemeName(themeData: unknown): string {
  if (
    typeof themeData === "object" &&
    themeData !== null &&
    "name" in themeData &&
    typeof themeData.name === "string"
  ) {
    return themeData.name
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  return "Custom Theme";
}

export async function fetchThemeFromUrl(url: string): Promise<FetchedTheme> {
  const baseUrl = "https://tweakcn.com/r/themes/";
  const isBuiltInUrl = url.includes("editor/theme?theme=");
  const transformedUrl =
    url
      .replace("https://tweakcn.com/editor/theme?theme=", baseUrl)
      .replace("https://tweakcn.com/themes/", baseUrl) +
    (isBuiltInUrl ? ".json" : "");

  try {
    const response = await fetch(transformedUrl);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const themeData = await response.json();

    return {
      name: getThemeName(themeData),
      preset: convertToThemePreset(themeData),
      url,
    };
  } catch (error) {
    return {
      name: getThemeName({}),
      preset: { cssVars: { theme: {}, light: {}, dark: {} } },
      url,
      error: error instanceof Error ? error.message : "Failed to fetch theme",
    };
  }
}

export function extractThemeColors(
  preset: ThemePreset | null,
  mode: "light" | "dark",
): string[] {
  if (!preset) {
    return [
      "oklch(0.74 0.12 65.8)",
      "oklch(0.78 0.105 67)",
      "oklch(0.265 0.018 72)",
      "oklch(0.145 0.012 205)",
      "oklch(0.25 0.012 88 / 72%)",
    ];
  }

  const colorKeys = [
    "primary",
    "accent",
    "secondary",
    "background",
    "muted",
    "destructive",
    "border",
    "card",
    "popover",
  ];
  const currentVars = {
    ...preset.cssVars.theme,
    ...preset.cssVars[mode],
  };

  return colorKeys
    .map((key) => currentVars[key])
    .filter((value): value is string => Boolean(value))
    .map((value) => (value.includes("hsl") ? `hsl(${value})` : value))
    .slice(0, 5);
}
