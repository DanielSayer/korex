import type { JobHandler, JobHandlerContext } from "../job-runtime/job-runtime";

type JobImplementation<Payload> = (
  payload: Payload,
  context: JobHandlerContext,
) => Promise<void>;

function defineJob<Payload>(
  name: string,
  parsePayload: (payload: Record<string, unknown>) => Payload,
) {
  return {
    implement: (run: JobImplementation<Payload>) => ({
      handler: (async (payload, context) => {
        context.signal.throwIfAborted();
        await run(parsePayload(payload), context);
      }) satisfies JobHandler,
      name,
    }),
    name,
  };
}

export const activityBestEffortJobDefinition = defineJob(
  "activity.best-effort.calculate",
  (payload) => ({
    activityId: requiredActivityId(
      payload,
      "Activity best effort job requires an integer activityId",
    ),
  }),
);

export const activityHeartRateZoneTimeJobDefinition = defineJob(
  "activity.heart-rate-zone-time.calculate",
  (payload) => ({
    activityId: requiredActivityId(
      payload,
      "Activity Heart Rate Zone Time job requires an integer activityId",
    ),
  }),
);

export const activityRouteHeatmapJobDefinition = defineJob(
  "activity.route-heatmap.calculate",
  (payload) => ({
    activityId: requiredActivityId(
      payload,
      "Activity Route Heatmap job requires an integer activityId",
    ),
  }),
);

export const trainingStreakJobDefinition = defineJob(
  "training-streak.update",
  (payload) => ({
    userId: requiredUserId(payload, "Training Streak job requires a userId"),
    weekStartAt: requiredDate(
      payload.weekStartAt,
      "Training Streak job requires a valid weekStartAt",
      true,
    ),
  }),
);

export const weeklyTrainingSummaryJobDefinition = defineJob(
  "weekly-training-summary.generate",
  (payload) => ({
    userId: requiredUserId(
      payload,
      "Weekly Training Summary job requires a userId",
    ),
    weekStartAt: requiredDate(
      payload.weekStartAt,
      "Weekly Training Summary job requires a valid weekStartAt",
    ),
  }),
);

export const weeklyTrainingSummaryScheduleJobDefinition = defineJob(
  "weekly-training-summary.schedule",
  (payload) => ({
    weekStartAt: requiredDate(
      payload.weekStartAt,
      "Weekly Training Summary schedule job requires a valid weekStartAt",
    ),
  }),
);

function requiredActivityId(payload: Record<string, unknown>, message: string) {
  const activityId = payload.activityId;

  if (!Number.isInteger(activityId)) {
    throw new Error(message);
  }

  return activityId as number;
}

function requiredUserId(payload: Record<string, unknown>, message: string) {
  if (typeof payload.userId !== "string" || payload.userId.length === 0) {
    throw new Error(message);
  }

  return payload.userId;
}

function requiredDate(value: unknown, message: string, preserveDate = false) {
  const date =
    preserveDate && value instanceof Date ? value : new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    throw new Error(message);
  }

  return date;
}
