import {
  activities,
  activityMaps,
  db,
  heartRateZones,
  providerConnections,
  syncRuns,
  trainingGoals,
  trainingGoalVersions,
} from "@korex/db";
import type { ActivityTestData } from "./activity-builder";
import type { HeartRateZoneTestData } from "./heart-rate-zone-builder";
import type { ProviderConnectionTestData } from "./provider-connection-builder";
import type { SyncRunTestData } from "./sync-run-builder";
import type { TrainingGoalTestData } from "./training-goal-builder";

type ActivityInsert = typeof activities.$inferInsert;
type ActivityMapInsert = typeof activityMaps.$inferInsert;
type HeartRateZoneInsert = typeof heartRateZones.$inferInsert;
type ProviderConnectionInsert = typeof providerConnections.$inferInsert;
type SyncRunInsert = typeof syncRuns.$inferInsert;
type TrainingGoalInsert = typeof trainingGoals.$inferInsert;
type TrainingGoalVersionInsert = typeof trainingGoalVersions.$inferInsert;

class DataSeedBuilder {
  private readonly activityData: Array<ActivityTestData>;
  private readonly heartRateZoneData: Array<HeartRateZoneTestData>;
  private readonly providerConnectionData: Array<ProviderConnectionTestData>;
  private readonly syncRunData: Array<SyncRunTestData>;
  private readonly trainingGoalData: Array<TrainingGoalTestData>;

  constructor({
    activityData = [],
    heartRateZoneData = [],
    providerConnectionData = [],
    syncRunData = [],
    trainingGoalData = [],
  }: {
    activityData?: Array<ActivityTestData>;
    heartRateZoneData?: Array<HeartRateZoneTestData>;
    providerConnectionData?: Array<ProviderConnectionTestData>;
    syncRunData?: Array<SyncRunTestData>;
    trainingGoalData?: Array<TrainingGoalTestData>;
  } = {}) {
    this.activityData = activityData;
    this.heartRateZoneData = heartRateZoneData;
    this.providerConnectionData = providerConnectionData;
    this.syncRunData = syncRunData;
    this.trainingGoalData = trainingGoalData;
  }

  withActivities(...activityData: ActivityTestData[]) {
    return new DataSeedBuilder({
      activityData: [...this.activityData, ...activityData],
      heartRateZoneData: this.heartRateZoneData,
      providerConnectionData: this.providerConnectionData,
      syncRunData: this.syncRunData,
      trainingGoalData: this.trainingGoalData,
    });
  }

  withHeartRateZones(...heartRateZoneData: HeartRateZoneTestData[]) {
    return new DataSeedBuilder({
      activityData: this.activityData,
      heartRateZoneData: [...this.heartRateZoneData, ...heartRateZoneData],
      providerConnectionData: this.providerConnectionData,
      syncRunData: this.syncRunData,
      trainingGoalData: this.trainingGoalData,
    });
  }

  withProviderConnections(
    ...providerConnectionData: ProviderConnectionTestData[]
  ) {
    return new DataSeedBuilder({
      activityData: this.activityData,
      heartRateZoneData: this.heartRateZoneData,
      providerConnectionData: [
        ...this.providerConnectionData,
        ...providerConnectionData,
      ],
      syncRunData: this.syncRunData,
      trainingGoalData: this.trainingGoalData,
    });
  }

  withSyncRuns(...syncRunData: SyncRunTestData[]) {
    return new DataSeedBuilder({
      activityData: this.activityData,
      heartRateZoneData: this.heartRateZoneData,
      providerConnectionData: this.providerConnectionData,
      syncRunData: [...this.syncRunData, ...syncRunData],
      trainingGoalData: this.trainingGoalData,
    });
  }

  withTrainingGoals(...trainingGoalData: TrainingGoalTestData[]) {
    return new DataSeedBuilder({
      activityData: this.activityData,
      heartRateZoneData: this.heartRateZoneData,
      providerConnectionData: this.providerConnectionData,
      syncRunData: this.syncRunData,
      trainingGoalData: [...this.trainingGoalData, ...trainingGoalData],
    });
  }

  async seedAsync(): Promise<void> {
    if (this.activityData.length > 0) {
      await db
        .insert(activities)
        .values(this.activityData.map(toActivityInsert));

      const activityMapData = this.activityData.flatMap(toActivityMapInsert);

      if (activityMapData.length > 0) {
        await db.insert(activityMaps).values(activityMapData);
      }
    }

    if (this.heartRateZoneData.length > 0) {
      await db
        .insert(heartRateZones)
        .values(this.heartRateZoneData.map(toHeartRateZoneInsert));
    }

    if (this.providerConnectionData.length > 0) {
      await db
        .insert(providerConnections)
        .values(this.providerConnectionData.map(toProviderConnectionInsert));
    }

    if (this.syncRunData.length > 0) {
      await db.insert(syncRuns).values(this.syncRunData.map(toSyncRunInsert));
    }

    if (this.trainingGoalData.length > 0) {
      await db
        .insert(trainingGoals)
        .values(this.trainingGoalData.map(toTrainingGoalInsert));
      await db
        .insert(trainingGoalVersions)
        .values(this.trainingGoalData.map(toTrainingGoalVersionInsert));
    }
  }
}

export const DataSeedAsync = new DataSeedBuilder();

function toActivityInsert(testData: ActivityTestData): ActivityInsert {
  const { map: _map, ...activity } = testData;
  return activity;
}

function toActivityMapInsert(testData: ActivityTestData): ActivityMapInsert[] {
  if (!testData.map) {
    return [];
  }

  return [
    {
      activityId: testData.id,
      bounds: testData.map.bounds,
      coordinates: testData.map.coordinates,
    },
  ];
}

function toHeartRateZoneInsert(
  testData: HeartRateZoneTestData,
): HeartRateZoneInsert {
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

function toTrainingGoalInsert(
  testData: TrainingGoalTestData,
): TrainingGoalInsert {
  const {
    targetValue: _targetValue,
    version: _version,
    ...trainingGoal
  } = testData;

  return trainingGoal;
}

function toTrainingGoalVersionInsert(
  testData: TrainingGoalTestData,
): TrainingGoalVersionInsert {
  return {
    ...testData.version,
    targetValue: testData.targetValue,
    trainingGoalId: testData.id,
  };
}
