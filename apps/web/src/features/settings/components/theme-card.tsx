import { Card } from "@korex/ui/components/card";
import { CheckCircleIcon } from "lucide-react";
import { extractThemeColors, type FetchedTheme } from "@/lib/theme-utils";
import { cn } from "@/lib/utils";

type ThemeCardProps = {
  currentMode: "light" | "dark";
  isSelected: boolean;
  onSelect: (theme: FetchedTheme) => void;
  theme: FetchedTheme;
};

function ThemeCard({
  currentMode,
  isSelected,
  onSelect,
  theme,
}: ThemeCardProps) {
  const colors = theme.error
    ? []
    : extractThemeColors(theme.preset, currentMode);

  return (
    <Card
      className={cn(
        "group relative overflow-hidden p-0",
        isSelected
          ? "bg-primary/5 ring-1 ring-primary/20"
          : "hover:ring-1 hover:ring-border",
        theme.error && "cursor-not-allowed opacity-50",
      )}
    >
      <button
        className="flex w-full items-center justify-between p-4 pb-0 text-left"
        disabled={Boolean(theme.error)}
        onClick={() => onSelect(theme)}
        type="button"
      >
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h4 className="truncate font-medium text-foreground text-sm">
              {theme.name}
            </h4>
            {isSelected ? (
              <CheckCircleIcon className="size-4 flex-shrink-0 text-primary" />
            ) : null}
          </div>

          {colors.length > 0 ? (
            <div className="-mx-4 flex h-3 overflow-hidden rounded-sm bg-background/50">
              {colors.map((color) => (
                <div
                  className="flex-1"
                  key={`${theme.url}-${color}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          ) : null}

          {theme.error ? (
            <div className="mt-2 font-medium text-destructive text-xs">
              Error: {theme.error}
            </div>
          ) : null}
        </div>
      </button>
    </Card>
  );
}

export { ThemeCard };
