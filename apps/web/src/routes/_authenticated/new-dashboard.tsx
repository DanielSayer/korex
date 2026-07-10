import { createFileRoute } from "@tanstack/react-router";
import { NewDashboardPage } from "@/features/new-dashboard/new-dashboard-page";

export const Route = createFileRoute("/_authenticated/new-dashboard")({
  component: NewDashboardPage,
});
