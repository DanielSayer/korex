import { activityRouteHeatmapJobModule } from "@korex/api/modules/activities/route-heatmap/activity-route-heatmap-job";
import { enqueueActivityRouteHeatmapCalculation } from "@korex/api/modules/activities/route-heatmap/activity-route-heatmap-jobs.repository";
import {
  createJobRuntime,
  inspectJob,
} from "@korex/api/modules/job-runtime/job-runtime";
import {
  activities,
  activityMaps,
  activityRouteHeatmapCells,
  activityRouteHeatmapContributionSets,
  db,
} from "@korex/db";
import { eq } from "drizzle-orm";

if (!process.argv.includes("--reset")) {
  throw new Error(
    "Activity Route Heatmap backfill requires --reset because existing aggregate cells cannot be combined with an empty contribution-set projection",
  );
}

await db.transaction(async (tx) => {
  await tx.delete(activityRouteHeatmapCells);
  await tx.delete(activityRouteHeatmapContributionSets);
});

const qualifyingActivities = await db
  .select({ activityId: activities.id })
  .from(activities)
  .innerJoin(activityMaps, eq(activityMaps.activityId, activities.id))
  .where(eq(activities.sportType, "run"));
const jobs = [];

for (const { activityId } of qualifyingActivities) {
  jobs.push(await enqueueActivityRouteHeatmapCalculation({ activityId }));
}

const runtime = createJobRuntime({
  databaseUrl: requiredEnv("DATABASE_URL"),
  tasks: {
    [activityRouteHeatmapJobModule.name]: activityRouteHeatmapJobModule.handler,
  },
  workerId: "activity-route-heatmap-backfill",
});

try {
  await runtime.start();
  const terminalJobs = await waitForTerminalJobs(jobs.map((job) => job.id));
  const failedJobs = terminalJobs.filter((job) => job?.state === "failed");

  if (failedJobs.length > 0) {
    throw new Error(
      `Activity Route Heatmap backfill failed for ${failedJobs.length} Activities`,
    );
  }
} finally {
  await runtime.stop();
}

console.info(
  `Backfilled Activity Route Heatmap data for ${qualifyingActivities.length} Activities`,
);

async function waitForTerminalJobs(jobIds: string[]) {
  while (true) {
    const inspected = await Promise.all(jobIds.map((id) => inspectJob({ id })));

    if (
      inspected.every(
        (job) => job?.state === "failed" || job?.state === "succeeded",
      )
    ) {
      return inspected;
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}
