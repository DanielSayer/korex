import { Context, type Effect } from "effect";
import type { DashboardWeeklyDistance } from "../activities.types";
import type {
  listDashboardWeeklyDistanceRows,
  sumDashboardDistance,
} from "./dashboard-weekly-distance.repository";

export type DashboardWeeklyDistanceRepositoryService = {
  listDashboardWeeklyDistanceRows: (
    input: Parameters<typeof listDashboardWeeklyDistanceRows>[0],
  ) => ReturnType<typeof listDashboardWeeklyDistanceRows>;
  sumDashboardDistance: (
    input: Parameters<typeof sumDashboardDistance>[0],
  ) => ReturnType<typeof sumDashboardDistance>;
};

export class DashboardWeeklyDistanceRepository extends Context.Tag(
  "DashboardWeeklyDistanceRepository",
)<
  DashboardWeeklyDistanceRepository,
  DashboardWeeklyDistanceRepositoryService
>() {}

export type GetDashboardWeeklyDistanceInput = {
  now?: Date;
  userId: string;
};

export type DashboardWeeklyDistanceService = {
  getDashboardWeeklyDistance: (
    input: GetDashboardWeeklyDistanceInput,
  ) => Effect.Effect<DashboardWeeklyDistance>;
};

export class DashboardWeeklyDistanceQuery extends Context.Tag(
  "DashboardWeeklyDistanceQuery",
)<DashboardWeeklyDistanceQuery, DashboardWeeklyDistanceService>() {}
