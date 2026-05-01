import { db, providerConnections, syncRuns } from "@korex/db";
import type { ProviderConnectionTestData } from "./provider-connection-builder";
import type { SyncRunTestData } from "./sync-run-builder";

type ProviderConnectionInsert = typeof providerConnections.$inferInsert;
type SyncRunInsert = typeof syncRuns.$inferInsert;

class DataSeedBuilder {
  private readonly providerConnectionData: Array<ProviderConnectionTestData>;
  private readonly syncRunData: Array<SyncRunTestData>;

  constructor({
    providerConnectionData = [],
    syncRunData = [],
  }: {
    providerConnectionData?: Array<ProviderConnectionTestData>;
    syncRunData?: Array<SyncRunTestData>;
  } = {}) {
    this.providerConnectionData = providerConnectionData;
    this.syncRunData = syncRunData;
  }

  withProviderConnections(
    ...providerConnectionData: ProviderConnectionTestData[]
  ) {
    return new DataSeedBuilder({
      providerConnectionData: [
        ...this.providerConnectionData,
        ...providerConnectionData,
      ],
      syncRunData: this.syncRunData,
    });
  }

  withSyncRuns(...syncRunData: SyncRunTestData[]) {
    return new DataSeedBuilder({
      providerConnectionData: this.providerConnectionData,
      syncRunData: [...this.syncRunData, ...syncRunData],
    });
  }

  async seedAsync(): Promise<void> {
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

function toProviderConnectionInsert(
  testData: ProviderConnectionTestData,
): ProviderConnectionInsert {
  return testData;
}

function toSyncRunInsert(testData: SyncRunTestData): SyncRunInsert {
  return testData;
}
