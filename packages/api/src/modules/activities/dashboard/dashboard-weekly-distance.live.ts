import { Effect, Layer } from "effect";
import {
  TimeProvider,
  TimeProviderLive,
} from "../../time-provider.dependencies";
import {
  buildDashboardThisWeek,
  buildDashboardWeeklyDistance,
  createDashboardWeeklyDistanceBuckets,
  getLastWeekSamePointRange,
} from "./dashboard-weekly-distance";
import {
  DashboardWeeklyDistanceQuery,
  DashboardWeeklyDistanceRepository,
} from "./dashboard-weekly-distance.dependencies";
import {
  getDashboardThisWeekRow,
  listDashboardWeeklyDistanceRows,
  sumDashboardDistance,
} from "./dashboard-weekly-distance.repository";

export const DashboardWeeklyDistanceRepositoryLive = Layer.succeed(
  DashboardWeeklyDistanceRepository,
  {
    getDashboardThisWeekRow,
    listDashboardWeeklyDistanceRows,
    sumDashboardDistance,
  },
);

export const DashboardWeeklyDistanceQueryLayer = Layer.effect(
  DashboardWeeklyDistanceQuery,
  Effect.gen(function* () {
    const repository = yield* DashboardWeeklyDistanceRepository;
    const timeProvider = yield* TimeProvider;

    const getDashboardWeeklyDistance = ({
      now = timeProvider.now(),
      userId,
    }: {
      now?: Date;
      userId: string;
    }) => {
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
    };

    return {
      getDashboardThisWeek: ({ now = timeProvider.now(), userId }) =>
        getDashboardWeeklyDistance({ now, userId }).pipe(
          Effect.flatMap((weeklyDistance) =>
            Effect.promise(async () => {
              const row = await repository.getDashboardThisWeekRow({
                endAt: now,
                startAt: weeklyDistance.weekStartAt,
                userId,
              });

              return buildDashboardThisWeek({ row, weeklyDistance });
            }),
          ),
        ),
      getDashboardWeeklyDistance,
    };
  }),
);

export const DashboardWeeklyDistanceLive =
  DashboardWeeklyDistanceQueryLayer.pipe(
    Layer.provide(
      Layer.mergeAll(TimeProviderLive, DashboardWeeklyDistanceRepositoryLive),
    ),
  );
