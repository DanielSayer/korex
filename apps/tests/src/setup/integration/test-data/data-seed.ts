import { activities, db, providerConnections, syncRuns } from "@korex/db";
import type { ActivityTestData } from "./activity-builder";
import type { ProviderConnectionTestData } from "./provider-connection-builder";
import type { SyncRunTestData } from "./sync-run-builder";

type ActivityInsert = typeof activities.$inferInsert;
type ProviderConnectionInsert = typeof providerConnections.$inferInsert;
type SyncRunInsert = typeof syncRuns.$inferInsert;

class DataSeedBuilder {
  private readonly activityData: Array<ActivityTestData>;
  private readonly providerConnectionData: Array<ProviderConnectionTestData>;
  private readonly syncRunData: Array<SyncRunTestData>;

  constructor({
    activityData = [],
    providerConnectionData = [],
    syncRunData = [],
  }: {
    activityData?: Array<ActivityTestData>;
    providerConnectionData?: Array<ProviderConnectionTestData>;
    syncRunData?: Array<SyncRunTestData>;
  } = {}) {
    this.activityData = activityData;
    this.providerConnectionData = providerConnectionData;
    this.syncRunData = syncRunData;
  }

  withActivities(...activityData: ActivityTestData[]) {
    return new DataSeedBuilder({
      activityData: [...this.activityData, ...activityData],
      providerConnectionData: this.providerConnectionData,
      syncRunData: this.syncRunData,
    });
  }

  withProviderConnections(
    ...providerConnectionData: ProviderConnectionTestData[]
  ) {
    return new DataSeedBuilder({
      activityData: this.activityData,
      providerConnectionData: [
        ...this.providerConnectionData,
        ...providerConnectionData,
      ],
      syncRunData: this.syncRunData,
    });
  }

  withSyncRuns(...syncRunData: SyncRunTestData[]) {
    return new DataSeedBuilder({
      activityData: this.activityData,
      providerConnectionData: this.providerConnectionData,
      syncRunData: [...this.syncRunData, ...syncRunData],
    });
  }

  async seedAsync(): Promise<void> {
    if (this.activityData.length > 0) {
      await db
        .insert(activities)
        .values(this.activityData.map(toActivityInsert));
    }

    if (this.providerConnectionData.length > 0) {
      await db
        .insert(providerConnections)
        .values(this.providerConnectionData.map(toProviderConnectionInsert));
    }

    if (this.syncRunData.length > 0) {
      await db.insert(syncRuns).values(this.syncRunData.map(toSyncRunInsert));
    }
  }
}

export const DataSeedAsync = new DataSeedBuilder();

function toActivityInsert(testData: ActivityTestData): ActivityInsert {
  return testData;
}

function toProviderConnectionInsert(
  testData: ProviderConnectionTestData,
): ProviderConnectionInsert {
  return testData;
}

function toSyncRunInsert(testData: SyncRunTestData): SyncRunInsert {
  return testData;
}
