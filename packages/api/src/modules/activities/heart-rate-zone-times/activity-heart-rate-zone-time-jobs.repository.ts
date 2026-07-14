import { db, jobRuntimeJobs } from "@korex/db";
import { and, eq } from "drizzle-orm";
import { enqueueJob } from "../../job-runtime/job-runtime";
import { activityHeartRateZoneTimeJobName } from "./activity-heart-rate-zone-time-job";

type ActivityHeartRateZoneTimeJobDatabase = Pick<
  typeof db,
  "delete" | "insert" | "select"
>;

export async function enqueueActivityHeartRateZoneTimeCalculation({
  activityId,
  database = db,
}: {
  activityId: number;
  database?: ActivityHeartRateZoneTimeJobDatabase;
}) {
  return enqueueJob({
    database,
    key: String(activityId),
    maxAttempts: 3,
    name: activityHeartRateZoneTimeJobName,
    payload: { activityId },
  });
}

export async function deleteActivityHeartRateZoneTimeCalculationJob({
  activityId,
  database = db,
}: {
  activityId: number;
  database?: ActivityHeartRateZoneTimeJobDatabase;
}) {
  await database
    .delete(jobRuntimeJobs)
    .where(
      and(
        eq(jobRuntimeJobs.name, activityHeartRateZoneTimeJobName),
        eq(jobRuntimeJobs.key, String(activityId)),
      ),
    );
}
