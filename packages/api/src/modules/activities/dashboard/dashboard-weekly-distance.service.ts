import { Effect } from "effect";
import {
  DashboardWeeklyDistanceQuery,
  type GetDashboardWeeklyDistanceInput,
} from "./dashboard-weekly-distance.dependencies";

export function getDashboardWeeklyDistance(
  input: GetDashboardWeeklyDistanceInput,
) {
  return Effect.gen(function* () {
    const query = yield* DashboardWeeklyDistanceQuery;

    return yield* query.getDashboardWeeklyDistance(input);
  });
}
