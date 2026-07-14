import { db } from "@korex/db";
import { enqueueJob } from "../../job-runtime/job-runtime";
import { activityBestEffortJobDefinition } from "../activity-job-definitions";

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
    name: activityBestEffortJobDefinition.name,
    payload: { activityId },
  });
}
