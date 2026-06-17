import type { AnalyticsVolumeBucketMode } from "@korex/api/modules/activities/activities.types";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AnalyticsPage } from "@/features/analytics/components/analytics-page";

const currentYear = new Date().getFullYear();

export const Route = createFileRoute("/_authenticated/analytics")({
  validateSearch: z.object({
    view: z.enum(["monthly", "weekly"]).optional().catch(undefined),
    year: z.coerce
      .number()
      .int()
      .min(2026)
      .max(currentYear)
      .optional()
      .catch(undefined),
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const bucketMode = search.view ?? "monthly";
  const year = search.year ?? currentYear;

  return (
    <AnalyticsPage
      bucketMode={bucketMode}
      onBucketModeChange={(view: AnalyticsVolumeBucketMode) =>
        navigate({
          search: {
            view,
            year,
          },
        })
      }
      onYearChange={(nextYear) =>
        navigate({
          search: {
            view: bucketMode,
            year: nextYear,
          },
        })
      }
      year={year}
    />
  );
}
