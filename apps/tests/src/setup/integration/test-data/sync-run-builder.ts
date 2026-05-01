type SyncRunStatus = "pending" | "running" | "success" | "failed" | "partial";
type SyncType = "initial" | "incremental" | "manual" | "backfill";
type ExternalProvider = "intervals_icu";

export type SyncRunTestData = {
  provider: ExternalProvider;
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
      provider: "intervals_icu",
      status: "success",
      syncType: "manual",
      userId,
    };
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
