import { Effect, Layer } from "effect";
import {
  TimeProvider,
  TimeProviderLive,
} from "../../time-provider.dependencies";
import {
  buildDashboardWeeklyDistance,
  createDashboardWeeklyDistanceBuckets,
  getLastWeekSamePointRange,
} from "./dashboard-weekly-distance";
import {
  DashboardWeeklyDistanceQuery,
  DashboardWeeklyDistanceRepository,
} from "./dashboard-weekly-distance.dependencies";
import {
  listDashboardWeeklyDistanceRows,
  sumDashboardDistance,
} from "./dashboard-weekly-distance.repository";

export const DashboardWeeklyDistanceRepositoryLive = Layer.succeed(
  DashboardWeeklyDistanceRepository,
  {
    listDashboardWeeklyDistanceRows,
    sumDashboardDistance,
  },
);

export const DashboardWeeklyDistanceQueryLayer = Layer.effect(
  DashboardWeeklyDistanceQuery,
  Effect.gen(function* () {
    const repository = yield* DashboardWeeklyDistanceRepository;
    const timeProvider = yield* TimeProvider;

    return {
      getDashboardWeeklyDistance: ({ now = timeProvider.now(), userId }) => {
        const buckets = createDashboardWeeklyDistanceBuckets({ now });
        const firstBucket = buckets.at(0);

        if (!firstBucket) {
          return Effect.succeed(
            buildDashboardWeeklyDistance({
              lastWeekAtSamePointDistanceMeters: 0,
              now,
              rows: [],
            }),
          );
        }

        const lastWeekSamePointRange = getLastWeekSamePointRange(now);

        return Effect.promise(async () => {
          const [rows, lastWeekAtSamePointDistanceMeters] = await Promise.all([
            repository.listDashboardWeeklyDistanceRows({
              bucketEndAt: now,
              bucketStartAt: firstBucket.bucketStartAt,
              userId,
            }),
            repository.sumDashboardDistance({
              endAt: lastWeekSamePointRange.endAt,
              startAt: lastWeekSamePointRange.startAt,
              userId,
            }),
          ]);

          return buildDashboardWeeklyDistance({
            lastWeekAtSamePointDistanceMeters,
            now,
            rows,
          });
        });
      },
    };
  }),
);

export const DashboardWeeklyDistanceLive =
  DashboardWeeklyDistanceQueryLayer.pipe(
    Layer.provide(
      Layer.mergeAll(TimeProviderLive, DashboardWeeklyDistanceRepositoryLive),
    ),
  );
