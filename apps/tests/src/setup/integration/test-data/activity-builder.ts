import type { SportType } from "@korex/api/modules/activities/activities.types";

export type ActivityTestData = {
  averageCadenceStepsPerMinute: number | null;
  averageHeartRateBeatsPerMinute: number | null;
  averageSpeedMetersPerSecond: number | null;
  deviceName: string | null;
  distanceMeters: number | null;
  elapsedTimeSeconds: number | null;
  energyKilocalories: number | null;
  id: number;
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

export class ActivityBuilder {
  static initWithUser(userId: string) {
    return new ActivityBuilder(userId);
  }

  private value: ActivityTestData;

  private constructor(userId: string) {
    this.value = {
      averageCadenceStepsPerMinute: null,
      averageHeartRateBeatsPerMinute: null,
      averageSpeedMetersPerSecond: null,
      deviceName: null,
      distanceMeters: null,
      elapsedTimeSeconds: null,
      energyKilocalories: null,
      id: 1001,
      maxHeartRateBeatsPerMinute: null,
      maxSpeedMetersPerSecond: null,
      movingTimeSeconds: 300,
      name: "Morning Run",
      sportType: "run",
      startAt: new Date("2026-04-01T00:00:00.000Z"),
      totalElevationGainMeters: null,
      totalElevationLossMeters: null,
      userId,
    };
  }

  withId(id: number) {
    this.value.id = id;
    return this;
  }

  withMovingTimeSeconds(movingTimeSeconds: number | null) {
    this.value.movingTimeSeconds = movingTimeSeconds;
    return this;
  }

  build(): ActivityTestData {
    return this.value;
  }
}
