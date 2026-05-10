type SyncRunStatus = "pending" | "running" | "success" | "failed" | "partial";
type SyncType = "initial" | "incremental" | "manual" | "backfill";
type ExternalProvider = "intervals_icu";

export type SyncRunTestData = {
  activitiesCreated: number;
  activitiesSeen: number;
  activitiesUpdated: number;
  finishedAt: Date | null;
  id?: number;
  provider: ExternalProvider;
  startedAt: Date;
  status: SyncRunStatus;
  syncType: SyncType;
  userId: string;
};

export class SyncRunBuilder {
  private value: SyncRunTestData;

  static initWithUser(userId: string) {
    return new SyncRunBuilder(userId);
  }

  private constructor(userId: string) {
    this.value = {
      activitiesCreated: 0,
      activitiesSeen: 0,
      activitiesUpdated: 0,
      finishedAt: new Date("2026-04-01T00:00:01.000Z"),
      provider: "intervals_icu",
      startedAt: new Date("2026-04-01T00:00:00.000Z"),
      status: "success",
      syncType: "manual",
      userId,
    };
  }

  withId(id: number) {
    this.value.id = id;
    return this;
  }

  withStartedAt(startedAt: Date) {
    this.value.startedAt = startedAt;
    return this;
  }

  withStatus(status: SyncRunStatus) {
    this.value.status = status;
    return this;
  }

  withSyncType(syncType: SyncType) {
    this.value.syncType = syncType;
    return this;
  }

  build() {
    return this.value;
  }
}
