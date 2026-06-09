import { Button } from "@korex/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@korex/ui/components/tooltip";
import { Loader2Icon, RefreshCwIcon } from "lucide-react";

type DashboardHeaderProps = {
  isSyncing: boolean;
  onSync: () => void;
};

function DashboardHeader({ isSyncing, onSync }: DashboardHeaderProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            aria-label={isSyncing ? "Syncing activities" : "Sync activities"}
            disabled={isSyncing}
            onClick={onSync}
            size="icon"
            type="button"
            variant="outline"
          />
        }
      >
        {isSyncing ? (
          <Loader2Icon aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <RefreshCwIcon aria-hidden="true" className="size-4" />
        )}
        <span className="sr-only">
          {isSyncing ? "Syncing activities" : "Sync activities"}
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {isSyncing ? "Syncing activities" : "Sync activities"}
      </TooltipContent>
    </Tooltip>
  );
}

export { DashboardHeader };
