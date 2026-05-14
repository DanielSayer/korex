export type SportType = "run" | "treadmill" | "hike";

export type ActivityStreamType =
  | "cadence"
  | "distance"
  | "altitude"
  | "heartRate"
  | "velocity";

export type ActivityInput = {
  averageCadenceStepsPerMinute: number | null;
  averageHeartRateBeatsPerMinute: number | null;
  averageSpeedMetersPerSecond: number | null;
  deviceName: string | null;
  distanceMeters: number | null;
  elapsedTimeSeconds: number | null;
  energyKilocalories: number | null;
  maxHeartRateBeatsPerMinute: number | null;
  maxSpeedMetersPerSecond: number | null;
  movingTimeSeconds: number | null;
  name: string;
  sportType: SportType;
  startAt: Date;
  totalElevationGainMeters: number | null;
  totalElevationLossMeters: number | null;
  userId: string;
};

export type ActivityLapInput = {
  averageCadenceStepsPerMinute: number | null;
  averageHeartRateBeatsPerMinute: number | null;
  averageSpeedMetersPerSecond: number | null;
  averageStrideLengthMeters: number | null;
  distanceMeters: number;
  elapsedTimeSeconds: number | null;
  endTimeSeconds: number;
  index: number;
  maxHeartRateBeatsPerMinute: number | null;
  maxSpeedMetersPerSecond: number | null;
  movingTimeSeconds: number | null;
  startTimeSeconds: number;
  totalElevationGainMeters: number | null;
};

export type ActivityMapCoordinateInput = {
  latitude: number;
  longitude: number;
};

export type ActivityMapBoundsInput = {
  northEast: ActivityMapCoordinateInput;
  southWest: ActivityMapCoordinateInput;
};

export type ActivityMapInput = {
  bounds: ActivityMapBoundsInput | null;
  coordinates: ActivityMapCoordinateInput[];
};

export type RecentActivity = {
  averageHeartRateBeatsPerMinute: number | null;
  distanceMeters: number | null;
  durationSeconds: number | null;
  id: number;
  map: ActivityMapInput | null;
  name: string;
  startAt: Date;
};

export type ActivityListItem = {
  averageHeartRateBeatsPerMinute: number | null;
  distanceMeters: number | null;
  durationSeconds: number | null;
  name: string;
  startAt: Date;
};

export type ActivitySummaryInput = ActivityListItem & {
  totalElevationGainMeters: number | null;
};

export type ActivitySummary = {
  distanceMeters: number;
  durationSeconds: number;
  totalElevationGainMeters: number;
  weekStartDate: Date;
};

export type ActivityCalendarRange = {
  activities: ActivityListItem[];
  summaries: ActivitySummary[];
};

export type ActivityStreamInput = {
  data: number[];
  streamType: ActivityStreamType;
};

export type ActivityHeartRateZoneSnapshotInput = {
  maxBpm: number | null;
  minBpm: number;
  name: string;
  position: number;
};

export type ActivityHeartRateZoneTimeInput = {
  position: number;
  timeSeconds: number;
};
