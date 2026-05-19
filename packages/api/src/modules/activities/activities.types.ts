export type SportType = "run" | "treadmill" | "hike";

export type ActivityStreamType =
  | "cadence"
  | "distance"
  | "altitude"
  | "heartRate"
  | "elapsedTime"
  | "velocity";

export type BestEffortStandardDistanceCode =
  | "400m"
  | "800m"
  | "1000m"
  | "1mi"
  | "3000m"
  | "5k"
  | "10k"
  | "half_marathon"
  | "marathon";

export type ActivityBestEffortInput = {
  distanceMeters: number;
  durationSeconds: number;
  endDistanceMeters: number;
  endElapsedTimeSeconds: number;
  standardDistanceCode: BestEffortStandardDistanceCode;
  startDistanceMeters: number;
  startElapsedTimeSeconds: number;
};

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

export type AnalyticsVolumeBucketMode = "monthly" | "weekly";

export type AnalyticsVolumeBucket = {
  activityCount: number;
  bucketEndAt: Date;
  bucketStartAt: Date;
  cumulativeDistanceMeters: number;
  distanceMeters: number;
  durationSeconds: number;
};

export type AnalyticsVolume = {
  bucketMode: AnalyticsVolumeBucketMode;
  buckets: AnalyticsVolumeBucket[];
  monthlyBuckets: AnalyticsVolumeBucket[];
  totalActivityCount: number;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  weeklyBuckets: AnalyticsVolumeBucket[];
  year: number;
};

export type PersonalBestEffort = {
  activityId: number;
  activityStartAt: Date;
  distanceMeters: number;
  durationSeconds: number;
  standardDistanceCode: BestEffortStandardDistanceCode;
};

export type PersonalBestEffortTrendBucket = {
  bucketEndAt: Date;
  bucketStartAt: Date;
  durationSeconds: number | null;
  standardDistanceCode: BestEffortStandardDistanceCode;
};

export type AnalyticsBestEfforts = {
  allTime: PersonalBestEffort[];
  monthlyTrendBuckets: PersonalBestEffortTrendBucket[];
  year: number;
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
