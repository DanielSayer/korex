import { Button } from "@korex/ui/components/button";
import { Input } from "@korex/ui/components/input";
import { useQuery } from "@tanstack/react-query";
import {
  EyeIcon,
  Loader2Icon,
  MoonIcon,
  SearchIcon,
  ShuffleIcon,
  SunIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTheme, useThemePreset } from "@/components/theme-provider";
import {
  DEFAULT_THEME_URL,
  defaultTheme,
  fetchThemeFromUrl,
  THEME_URLS,
} from "@/lib/theme-utils";
import { ModeCard } from "./mode-card";
import { SettingsSection } from "./settings-section";
import { ThemeCard } from "./theme-card";

function AppearanceSettings() {
  const { mode, selectedTheme, setSelectedTheme } = useThemePreset();
  const { resolvedTheme, setTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const selectedThemeUrl = selectedTheme?.url ?? DEFAULT_THEME_URL;

  const { data: fetchedThemes = [], isLoading } = useQuery({
    queryKey: ["tweakcn-themes", THEME_URLS],
    queryFn: () => Promise.all(THEME_URLS.map(fetchThemeFromUrl)),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const themes = useMemo(
    () => [defaultTheme, ...fetchedThemes],
    [fetchedThemes],
  );
  const filteredThemes = useMemo(
    () =>
      themes.filter((theme) =>
        theme.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [searchQuery, themes],
  );

  const randomizeTheme = () => {
    const availableThemes = fetchedThemes.filter((theme) => !theme.error);

    if (availableThemes.length === 0) {
      return;
    }

    const randomTheme =
      availableThemes[Math.floor(Math.random() * availableThemes.length)];

    setSelectedTheme(randomTheme);
  };

  return (
    <div className="space-y-10">
      <SettingsSection
        description="Choose between light and dark mode."
        title="Display Mode"
      >
        <div className="grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
          <ModeCard
            icon={SunIcon}
            isSelected={resolvedTheme === "light"}
            label="Light"
            onClick={() => setTheme("light")}
          />
          <ModeCard
            icon={MoonIcon}
            isSelected={resolvedTheme === "dark"}
            label="Dark"
            onClick={() => setTheme("dark")}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        description="Select and manage your color theme."
        title="Themes"
      >
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="bg-muted/20 pl-9 focus:bg-background"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search themes..."
                value={searchQuery}
              />
            </div>
            <Button
              disabled={isLoading || fetchedThemes.length === 0}
              onClick={randomizeTheme}
              size="icon"
              title="Random theme"
              type="button"
              variant="outline"
            >
              <ShuffleIcon className="size-4" />
              <span className="sr-only">Random theme</span>
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground text-sm">
              <Loader2Icon className="size-4 animate-spin" />
              Loading themes...
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {filteredThemes.map((theme) => (
                <ThemeCard
                  currentMode={mode}
                  isSelected={selectedThemeUrl === theme.url}
                  key={theme.url}
                  onSelect={setSelectedTheme}
                  theme={theme}
                />
              ))}
            </div>
          )}

          {filteredThemes.length === 0 && searchQuery && !isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <EyeIcon className="mb-3 size-8 text-muted-foreground" />
              <h4 className="font-medium text-foreground">No themes found</h4>
              <p className="mt-1 text-muted-foreground text-sm">
                Try adjusting your search query.
              </p>
            </div>
          ) : null}
        </div>
      </SettingsSection>
    </div>
  );
}

export { AppearanceSettings };
