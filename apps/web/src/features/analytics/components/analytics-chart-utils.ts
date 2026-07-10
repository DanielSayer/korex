import type {
  AnalyticsVolumeBucket,
  AnalyticsVolumeBucketMode,
} from "@korex/api/modules/activities/activities.types";

function formatKilometers(
  value: number | string | readonly (number | string)[] | undefined,
) {
  const numericValue = Number(Array.isArray(value) ? value[0] : (value ?? 0));

  return `${numericValue.toFixed(1)} km`;
}

function getBucketLabel(
  bucket: AnalyticsVolumeBucket,
  bucketMode: AnalyticsVolumeBucketMode,
) {
  const startAt = new Date(bucket.bucketStartAt);

  if (bucketMode === "monthly") {
    return new Intl.DateTimeFormat(undefined, { month: "short" }).format(
      startAt,
    );
  }

  return `${startAt.getDate()} ${new Intl.DateTimeFormat(undefined, {
    month: "short",
  }).format(startAt)}`;
}

function getFullBucketLabel(
  bucket: AnalyticsVolumeBucket,
  bucketMode: AnalyticsVolumeBucketMode,
) {
  const startAt = new Date(bucket.bucketStartAt);

  if (bucketMode === "monthly") {
    return new Intl.DateTimeFormat(undefined, {
      month: "long",
      year: "numeric",
    }).format(startAt);
  }

  const endAt = new Date(new Date(bucket.bucketEndAt).getTime() - 1);
  const formatter = new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
  });

  return `Training Week · ${formatter.format(startAt)}–${formatter.format(endAt)}`;
}

function getXAxisInterval(bucketMode: AnalyticsVolumeBucketMode) {
  return bucketMode === "weekly" ? 7 : 0;
}

const chartAxisTick = {
  fill: "var(--muted-foreground)",
  fontSize: 12,
  width: 64,
} as const;

export {
  chartAxisTick,
  formatKilometers,
  getBucketLabel,
  getFullBucketLabel,
  getXAxisInterval,
};
