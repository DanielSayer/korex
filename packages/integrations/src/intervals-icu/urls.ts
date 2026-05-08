const DEFAULT_BASE_URL = "https://intervals.icu";

export function getIntervalsIcuRequestUrl(path: string) {
  return `${DEFAULT_BASE_URL}${path}`;
}

export function getIntervalsIcuActivityListPath({
  athleteId,
  endDate,
  startDate,
}: {
  athleteId: string;
  endDate: Date;
  startDate: Date;
}) {
  const searchParams = new URLSearchParams({
    oldest: toIntervalsIcuDateParam(startDate),
    newest: toIntervalsIcuDateParam(endDate),
  });

  return `/api/v1/athlete/${encodeURIComponent(athleteId)}/activities?${searchParams.toString()}`;
}

export function getIntervalsIcuActivityDetailPath(activityId: string) {
  return `/api/v1/activity/${encodeURIComponent(activityId)}?intervals=true`;
}

export function getIntervalsIcuActivityMapPath(activityId: string) {
  return `/api/v1/activity/${encodeURIComponent(activityId)}/map`;
}

export function getIntervalsIcuActivityStreamsPath(activityId: string) {
  return `/api/v1/activity/${encodeURIComponent(activityId)}/streams.json`;
}

export function getIntervalsIcuActivityMapRequestUrl(activityId: string) {
  return getIntervalsIcuRequestUrl(getIntervalsIcuActivityMapPath(activityId));
}

export function getIntervalsIcuActivityStreamsRequestUrl(activityId: string) {
  return getIntervalsIcuRequestUrl(
    getIntervalsIcuActivityStreamsPath(activityId),
  );
}

function toIntervalsIcuDateParam(date: Date) {
  return date.toISOString().slice(0, 10);
}
