import { useRegisterSW } from "virtual:pwa-register/react";
import { Button } from "@korex/ui/components/button";
import { useLocation } from "@tanstack/react-router";
import { RefreshCwIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { shouldHideMobileBottomNav } from "./mobile-navigation";

function PwaUpdatePrompt() {
  const location = useLocation();
  const hideBottomNav = shouldHideMobileBottomNav(location.pathname);
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({ immediate: true });

  if (!needRefresh) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed right-3 left-3 z-50 md:right-4 md:bottom-4 md:left-auto",
        hideBottomNav
          ? "bottom-[calc(0.75rem+env(safe-area-inset-bottom))]"
          : "bottom-[calc(4.75rem+env(safe-area-inset-bottom))]",
      )}
    >
      <div className="mx-auto flex max-w-md items-center gap-3 rounded-md border border-border/80 bg-popover p-3 text-popover-foreground shadow-lg md:w-96">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm">Update available</p>
          <p className="mt-0.5 text-muted-foreground text-xs">
            Reload Korex to use the latest version.
          </p>
        </div>
        <Button
          onClick={() => updateServiceWorker(true)}
          size="sm"
          type="button"
        >
          <RefreshCwIcon data-icon="inline-start" />
          Reload
        </Button>
        <Button
          aria-label="Dismiss update"
          onClick={() => setNeedRefresh(false)}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <XIcon />
        </Button>
      </div>
    </div>
  );
}

export { PwaUpdatePrompt };
