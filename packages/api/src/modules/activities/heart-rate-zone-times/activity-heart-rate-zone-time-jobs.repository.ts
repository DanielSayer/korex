import { db, jobRuntimeJobs } from "@korex/db";
import { and, eq } from "drizzle-orm";
import { enqueueJob } from "../../job-runtime/job-runtime";
import { activityHeartRateZoneTimeJobDefinition } from "../activity-job-definitions";

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
    name: activityHeartRateZoneTimeJobDefinition.name,
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
        eq(jobRuntimeJobs.name, activityHeartRateZoneTimeJobDefinition.name),
        eq(jobRuntimeJobs.key, String(activityId)),
      ),
    );
}
