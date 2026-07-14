import { db } from "@korex/db";
import { enqueueJob } from "../../job-runtime/job-runtime";
import { activityBestEffortJobName } from "./activity-best-effort-job";

type ActivityBestEffortJobDatabase = Pick<typeof db, "insert" | "select">;

export async function enqueueActivityBestEffortCalculation({
  activityId,
  database = db,
}: {
  activityId: number;
  database?: ActivityBestEffortJobDatabase;
}) {
  return enqueueJob({
    database,
    key: String(activityId),
    name: activityBestEffortJobName,
    payload: { activityId },
  });
}
