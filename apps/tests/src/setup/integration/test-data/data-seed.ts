import { db, providerConnections } from "@korex/db";
import type { ProviderConnectionTestData } from "./provider-connection-builder";

type ProviderConnectionInsert = typeof providerConnections.$inferInsert;

class DataSeedBuilder {
  private readonly providerConnectionData: Array<ProviderConnectionTestData>;

  constructor({
    providerConnectionData = [],
  }: {
    providerConnectionData?: Array<ProviderConnectionTestData>;
  } = {}) {
    this.providerConnectionData = providerConnectionData;
  }

  withProviderConnections(
    ...providerConnectionData: ProviderConnectionTestData[]
  ) {
    return new DataSeedBuilder({
      providerConnectionData: [
        ...this.providerConnectionData,
        ...providerConnectionData,
      ],
    });
  }

  async seedAsync(): Promise<void> {
    if (this.providerConnectionData.length === 0) {
      return;
    }

    await db
      .insert(providerConnections)
      .values(this.providerConnectionData.map(toProviderConnectionInsert));
  }
}

export const DataSeedAsync = new DataSeedBuilder();

function toProviderConnectionInsert(
  testData: ProviderConnectionTestData,
): ProviderConnectionInsert {
  return testData;
}
