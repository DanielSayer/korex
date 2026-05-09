import type { RecentActivity } from "@korex/api/modules/activities/activities.types";
import { RunCard } from "./run-card";

type LastFiveRunsProps = {
  runs: RecentActivity[];
};

function LastFiveRuns({ runs }: LastFiveRunsProps) {
  if (runs.length === 0) {
    return (
      <div className="flex min-h-36 items-center justify-center rounded-lg border border-dashed text-muted-foreground text-sm">
        No recent runs yet.
      </div>
    );
  }

  return (
    <div className="grid gap-3 lg:grid-cols-5">
      {runs.map((run) => (
        <RunCard key={run.id} run={run} />
      ))}
    </div>
  );
}

export { LastFiveRuns };
