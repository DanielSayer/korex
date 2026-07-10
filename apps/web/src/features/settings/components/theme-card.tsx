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
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg border border-border/60 bg-card text-card-foreground transition-colors",
        isSelected
          ? "bg-accent text-accent-foreground ring-1 ring-ring/30"
          : "hover:border-border hover:bg-accent/30",
        theme.error && "cursor-not-allowed opacity-50",
      )}
    >
      <button
        aria-pressed={isSelected}
        className="flex w-full items-center justify-between p-4 pb-0 text-left"
        disabled={Boolean(theme.error)}
        onClick={() => onSelect(theme)}
        type="button"
      >
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h4 className="truncate font-medium text-sm">{theme.name}</h4>
            {isSelected ? (
              <CheckCircleIcon className="size-4 flex-shrink-0 text-journal-route" />
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
    </div>
  );
}

export { ThemeCard };
