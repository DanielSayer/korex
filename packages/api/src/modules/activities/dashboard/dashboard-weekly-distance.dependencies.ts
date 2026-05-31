import { Context, type Effect } from "effect";
import type {
  DashboardThisWeek,
  DashboardWeeklyDistance,
} from "../activities.types";
import type {
  getDashboardThisWeekRow,
  listDashboardWeeklyDistanceRows,
  sumDashboardDistance,
} from "./dashboard-weekly-distance.repository";

export type DashboardWeeklyDistanceRepositoryService = {
  getDashboardThisWeekRow: (
    input: Parameters<typeof getDashboardThisWeekRow>[0],
  ) => ReturnType<typeof getDashboardThisWeekRow>;
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
  getDashboardThisWeek: (
    input: GetDashboardWeeklyDistanceInput,
  ) => Effect.Effect<DashboardThisWeek>;
  getDashboardWeeklyDistance: (
    input: GetDashboardWeeklyDistanceInput,
  ) => Effect.Effect<DashboardWeeklyDistance>;
};

export class DashboardWeeklyDistanceQuery extends Context.Tag(
  "DashboardWeeklyDistanceQuery",
)<DashboardWeeklyDistanceQuery, DashboardWeeklyDistanceService>() {}
