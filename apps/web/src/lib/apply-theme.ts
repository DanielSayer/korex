import type { ThemePreset } from "@/lib/theme-utils";

type ThemeMode = "dark" | "light";

const THEME_VARIABLES = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "destructive-foreground",
  "border",
  "input",
  "ring",
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "radius",
  "sidebar",
  "sidebar-foreground",
  "sidebar-primary",
  "sidebar-primary-foreground",
  "sidebar-accent",
  "sidebar-accent-foreground",
  "sidebar-border",
  "sidebar-ring",
  "journal-hero",
  "journal-hero-foreground",
  "journal-plan",
  "journal-plan-foreground",
  "journal-route",
  "font-sans",
  "font-serif",
  "font-mono",
  "shadow-color",
  "shadow-opacity",
  "shadow-blur",
  "shadow-spread",
  "shadow-offset-x",
  "shadow-offset-y",
  "letter-spacing",
  "spacing",
  "shadow-2xs",
  "shadow-xs",
  "shadow-sm",
  "shadow",
  "shadow-md",
  "shadow-lg",
  "shadow-xl",
  "shadow-2xl",
  "tracking-tighter",
  "tracking-tight",
  "tracking-normal",
  "tracking-wide",
  "tracking-wider",
  "tracking-widest",
] as const;

function clearThemeFromElement(element: HTMLElement) {
  for (const variable of THEME_VARIABLES) {
    element.style.removeProperty(`--${variable}`);
  }

  element.removeAttribute("data-theme");
}

export function applyThemeToElement({
  element,
  mode,
  preset,
}: {
  element: HTMLElement;
  mode: ThemeMode;
  preset: ThemePreset | null;
}) {
  clearThemeFromElement(element);

  if (!preset) {
    return;
  }

  for (const [key, value] of Object.entries(preset.cssVars.theme)) {
    element.style.setProperty(`--${key}`, normalizeThemeValue(key, value));
  }

  for (const [key, value] of Object.entries(preset.cssVars[mode])) {
    if (key in preset.cssVars.theme) {
      continue;
    }

    element.style.setProperty(`--${key}`, normalizeThemeValue(key, value));
  }

  element.setAttribute("data-theme", mode);
}

function normalizeThemeValue(key: string, value: string) {
  if (
    (key.startsWith("tracking-") || key === "letter-spacing") &&
    (value.trim().startsWith("-") || value.includes(" - "))
  ) {
    return "0em";
  }

  return value;
}
