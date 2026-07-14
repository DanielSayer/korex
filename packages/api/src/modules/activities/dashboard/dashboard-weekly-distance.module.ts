import { type Clock, systemClock } from "../../clock";
import { listEquipment } from "../../equipment/equipment.repository";
import { listTrainingGoalProgress } from "../training-goals/training-goal.service";
import {
  buildDashboardThisWeek,
  buildDashboardWeeklyDistance,
  createDashboardWeeklyDistanceBuckets,
  getLastWeekSamePointRange,
} from "./dashboard-weekly-distance";
import {
  getDashboardThisWeekRow,
  listDashboardWeeklyDistanceRows,
  sumDashboardDistance,
} from "./dashboard-weekly-distance.repository";
import { buildDashboardWeeklyFocus } from "./dashboard-weekly-focus";

type DashboardWeeklyDistanceRepository = {
  getDashboardThisWeekRow: typeof getDashboardThisWeekRow;
  listDashboardWeeklyDistanceRows: typeof listDashboardWeeklyDistanceRows;
  sumDashboardDistance: typeof sumDashboardDistance;
};

type DashboardWeeklyDistanceDependencies = {
  clock: Clock;
  listEquipment: typeof listEquipment;
  listTrainingGoalProgress: typeof listTrainingGoalProgress;
  repository: DashboardWeeklyDistanceRepository;
};

type DashboardWeeklyDistanceInput = {
  userId: string;
};

export function createDashboardWeeklyDistanceModule({
  clock,
  listEquipment: listEquipmentForUser,
  listTrainingGoalProgress: listTrainingGoalProgressForUser,
  repository,
}: DashboardWeeklyDistanceDependencies) {
  const getWeeklyDistanceAt = async ({
    now,
    userId,
  }: DashboardWeeklyDistanceInput & { now: Date }) => {
    const buckets = createDashboardWeeklyDistanceBuckets({ now });
    const firstBucket = buckets.at(0);

    if (!firstBucket) {
      return buildDashboardWeeklyDistance({
        lastWeekAtSamePointDistanceMeters: 0,
        now,
        rows: [],
      });
    }

    const lastWeekSamePointRange = getLastWeekSamePointRange(now);
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
  };

  return {
    async getThisWeek({ userId }: DashboardWeeklyDistanceInput) {
      const now = clock.now();
      const weeklyDistance = await getWeeklyDistanceAt({ now, userId });
      const [row, goals, equipment] = await Promise.all([
        repository.getDashboardThisWeekRow({
          endAt: now,
          startAt: weeklyDistance.weekStartAt,
          userId,
        }),
        listTrainingGoalProgressForUser({ now, userId }),
        listEquipmentForUser({ userId }),
      ]);
      const weeklyFocus = buildDashboardWeeklyFocus({
        activityCount: row?.activityCount ?? 0,
        distanceMeters: row?.distanceMeters ?? 0,
        equipment,
        goals,
        now,
        weeklyDistance,
      });

      return buildDashboardThisWeek({
        row,
        weeklyFocus,
        weeklyDistance,
      });
    },
    getWeeklyDistance({ userId }: DashboardWeeklyDistanceInput) {
      return getWeeklyDistanceAt({ now: clock.now(), userId });
    },
  };
}

export const dashboardWeeklyDistanceModule =
  createDashboardWeeklyDistanceModule({
    clock: systemClock,
    listEquipment,
    listTrainingGoalProgress,
    repository: {
      getDashboardThisWeekRow,
      listDashboardWeeklyDistanceRows,
      sumDashboardDistance,
    },
  });
