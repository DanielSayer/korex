import type { AnalyticsVolumeBucketMode } from "@korex/api/modules/activities/activities.types";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { PageHeader, PageLayout } from "@/components/page-layout";
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
    <PageLayout>
      <PageHeader
        title="Analytics"
        description="Yearly training volume from current activities."
        actions={
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
        }
      />
      <AnalyticsVolumeSection bucketMode={bucketMode} year={year} />
      <AnalyticsBestEffortsSection year={year} />
    </PageLayout>
  );
}
