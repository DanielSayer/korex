import { Button } from "@korex/ui/components/button";
import { Input } from "@korex/ui/components/input";
import { Label } from "@korex/ui/components/label";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { orpc, queryClient } from "@/utils/orpc";
import { SettingsSection } from "./settings-section";

function ProviderConnectionSettings() {
  const overview = useQuery(orpc.providerConnections.overview.queryOptions());
  const [apiKey, setApiKey] = useState("");
  const refresh = () =>
    queryClient.invalidateQueries({
      queryKey: orpc.providerConnections.overview.queryOptions().queryKey,
    });
  const connect = useMutation(
    orpc.providerConnections.connectIntervalsIcu.mutationOptions({
      onError: (error) => toast.error(error.message),
      onSuccess: async () => {
        setApiKey("");
        await refresh();
        toast.success("Intervals.icu connected");
      },
    }),
  );
  const disconnect = useMutation(
    orpc.providerConnections.disconnect.mutationOptions({
      onError: (error) => toast.error(error.message),
      onSuccess: async () => {
        await refresh();
        toast.success("Provider disconnected");
      },
    }),
  );
  const sync = useMutation(
    orpc.syncs.incremental.mutationOptions({
      onError: (error) => toast.error(error.message),
      onSuccess: async () => {
        await refresh();
        toast.success("Activities synced");
      },
    }),
  );
  const connection = overview.data?.connection;
  const isActive = connection?.status === "active";

  return (
    <SettingsSection
      description="Manage your training data source and inspect recent imports."
      title="Connections"
    >
      <div className="space-y-6">
        <div className="rounded-lg border border-border/70 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold">Intervals.icu</p>
              <p className="text-muted-foreground text-sm">
                {isActive
                  ? connection.providerUserName || connection.providerUserId
                  : "Not connected"}
              </p>
              {connection?.lastSyncedAt ? (
                <p className="mt-1 text-muted-foreground text-xs">
                  Last synced {formatDate(connection.lastSyncedAt)}
                </p>
              ) : null}
            </div>
            <span className="rounded-full bg-muted px-2.5 py-1 font-medium text-xs capitalize">
              {connection?.status ?? "disconnected"}
            </span>
          </div>
          {isActive ? (
            <div className="mt-4 flex gap-2">
              <Button
                disabled={sync.isPending}
                onClick={() => sync.mutate(undefined)}
                type="button"
              >
                {sync.isPending ? "Syncing..." : "Sync now"}
              </Button>
              <Button
                disabled={disconnect.isPending}
                onClick={() => disconnect.mutate(undefined)}
                type="button"
                variant="outline"
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="mt-4 flex max-w-md gap-2">
              <div className="flex-1 space-y-2">
                <Label className="sr-only" htmlFor="intervals-api-key">
                  Intervals.icu API key
                </Label>
                <Input
                  id="intervals-api-key"
                  onChange={(event) => setApiKey(event.target.value)}
                  placeholder="Intervals.icu API key"
                  type="password"
                  value={apiKey}
                />
              </div>
              <Button
                disabled={!apiKey.trim() || connect.isPending}
                onClick={() => connect.mutate({ apiKey: apiKey.trim() })}
                type="button"
              >
                Connect
              </Button>
            </div>
          )}
        </div>

        <div>
          <h3 className="font-semibold text-sm">Recent syncs</h3>
          <div className="mt-2 divide-y rounded-lg border border-border/70">
            {overview.data?.recentSyncRuns.length ? (
              overview.data.recentSyncRuns.map((run) => (
                <div className="flex justify-between gap-4 p-3 text-sm" key={run.id}>
                  <div>
                    <p className="font-medium capitalize">{run.syncType} sync</p>
                    <p className="text-muted-foreground text-xs">
                      {formatDate(run.startedAt)} · {run.activitiesCreated} created, {run.activitiesUpdated} updated
                    </p>
                    {run.errorMessage ? <p className="mt-1 text-destructive text-xs">{run.errorMessage}</p> : null}
                  </div>
                  <span className="capitalize text-muted-foreground">{run.status}</span>
                </div>
              ))
            ) : (
              <p className="p-4 text-muted-foreground text-sm">No sync history yet.</p>
            )}
          </div>
        </div>
      </div>
    </SettingsSection>
  );
}

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export { ProviderConnectionSettings };
