import { Button } from "@korex/ui/components/button";
import { CloudSyncIcon } from "lucide-react";

type DashboardHeaderProps = {
  isSyncing: boolean;
  onSync: () => void;
};

function DashboardHeader({ isSyncing, onSync }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Here's how your recent training is looking.
        </p>
      </div>
      <Button
        className="w-full sm:w-auto"
        loading={isSyncing}
        loadingText="Syncing"
        onClick={onSync}
        type="button"
        variant="outline"
      >
        <CloudSyncIcon className="size-4" />
        Sync now
      </Button>
    </div>
  );
}

export { DashboardHeader };
