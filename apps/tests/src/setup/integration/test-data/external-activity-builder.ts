import type { UpsertExternalActivityInput } from "@korex/api/modules/activity-sync/repositories/external-activities.repository";

export class ExternalActivityBuilder {
  private value: UpsertExternalActivityInput;

  static init(syncRunId: number, userId: string) {
    return new ExternalActivityBuilder(syncRunId, userId);
  }

  private constructor(syncRunId: number, userId: string) {
    this.value = {
      activityEndAt: new Date("2026-04-01T08:00:00.000Z"),
      activityStartAt: new Date("2026-04-01T07:00:00.000Z"),
      lastSyncRunId: syncRunId,
      provider: "intervals_icu",
      providerActivityId: "activity-1",
      providerAthleteId: "athlete-1",
      providerUpdatedAt: new Date("2026-04-01T09:00:00.000Z"),
      rawData: { id: "activity-1", name: "Morning Run" },
      sourceType: "Intervals.icu",
      sportType: "Run",
      userId,
    };
  }

  withRawData(rawData: unknown) {
    this.value.rawData = rawData;
    return this;
  }

  withSportType(sportType: string | null) {
    this.value.sportType = sportType;
    return this;
  }

  build() {
    return this.value;
  }
}
