import { Button } from "@korex/ui/components/button";
import { RefreshCwIcon } from "lucide-react";

type DashboardHeaderProps = {
  isSyncing: boolean;
  onSync: () => void;
};

function DashboardHeader({ isSyncing, onSync }: DashboardHeaderProps) {
  return (
    <div className="flex justify-end">
      <Button
        className="w-full sm:w-auto"
        loading={isSyncing}
        loadingText="Syncing"
        onClick={onSync}
        type="button"
        variant="outline"
      >
        <RefreshCwIcon className="size-4" />
        Sync now
      </Button>
    </div>
  );
}

export { DashboardHeader };
