import type { AnalyticsVolumeBucketMode } from "@korex/api/modules/activities/activities.types";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AnalyticsBestEffortsSection } from "@/features/analytics/components/analytics-best-efforts-section";
import {
  AnalyticsVolumeControls,
  AnalyticsVolumeSection,
} from "@/features/analytics/components/analytics-volume-section";

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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Analytics</h1>
          <p className="text-muted-foreground text-sm">
            Yearly training volume from current activities.
          </p>
        </div>
        <AnalyticsVolumeControls
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
      </div>
      <AnalyticsVolumeSection bucketMode={bucketMode} year={year} />
      <AnalyticsBestEffortsSection year={year} />
    </div>
  );
}
