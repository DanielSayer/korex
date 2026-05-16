import type { WeeklyTrainingSummaryPayloadJson } from "@korex/db";

export type WeeklyTrainingSummaryListItem = {
  activityCount: number;
  averageSpeedMetersPerSecond: number | null;
  generatedAt: Date;
  id: number;
  previousWeekActivityCountDelta: number;
  previousWeekAverageSpeedDeltaMetersPerSecond: number | null;
  previousWeekDistanceDeltaMeters: number;
  previousWeekMovingTimeDeltaSeconds: number;
  totalDistanceMeters: number;
  totalMovingTimeSeconds: number;
  weekEndAt: Date;
  weekStartAt: Date;
};

export type WeeklyTrainingSummaryDetail = WeeklyTrainingSummaryListItem & {
  longestActivityId: number | null;
  payload: WeeklyTrainingSummaryPayloadJson;
};

export type WeeklyTrainingSummaryInput = {
  activityCount: number;
  averageSpeedMetersPerSecond: number | null;
  generatedAt: Date;
  longestActivityId: number | null;
  payload: WeeklyTrainingSummaryPayloadJson;
  previousWeekActivityCountDelta: number;
  previousWeekAverageSpeedDeltaMetersPerSecond: number | null;
  previousWeekDistanceDeltaMeters: number;
  previousWeekMovingTimeDeltaSeconds: number;
  totalDistanceMeters: number;
  totalMovingTimeSeconds: number;
  userId: string;
  weekEndAt: Date;
  weekStartAt: Date;
};
