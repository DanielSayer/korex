import type { AnalyticsVolumeBucketMode } from "@korex/api/modules/activities/activities.types";
import { RouteAccent, SectionLabel } from "@/components/brand";
import { PageLayout } from "@/components/page-layout";
import { useIsMobileViewport } from "@/components/responsive";
import { AnalyticsBestEffortsSection } from "./analytics-best-efforts-section";
import {
  AnalyticsVolumeControls,
  AnalyticsVolumeSection,
} from "./analytics-volume-section";

type AnalyticsPageProps = {
  bucketMode: AnalyticsVolumeBucketMode;
  onBucketModeChange: (bucketMode: AnalyticsVolumeBucketMode) => void;
  onYearChange: (year: number) => void;
  year: number;
};

function AnalyticsPage(props: AnalyticsPageProps) {
  const isMobileViewport = useIsMobileViewport();

  return isMobileViewport ? (
    <AnalyticsMobile {...props} />
  ) : (
    <AnalyticsDesktop {...props} />
  );
}

function AnalyticsDesktop({
  bucketMode,
  onBucketModeChange,
  onYearChange,
  year,
}: AnalyticsPageProps) {
  return (
    <PageLayout className="min-w-0">
      <header className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <SectionLabel>Analytics</SectionLabel>
          <h1 className="mt-1 font-display text-4xl lowercase leading-none tracking-tight">
            Trends
          </h1>
          <p className="mt-2 text-muted-foreground text-sm">
            Yearly volume and personal best efforts.
          </p>
        </div>
        <div className="shrink-0">
          <AnalyticsVolumeControls
            bucketMode={bucketMode}
            onBucketModeChange={onBucketModeChange}
            onYearChange={onYearChange}
            year={year}
          />
        </div>
      </header>
      <AnalyticsVolumeSection bucketMode={bucketMode} year={year} />
      <AnalyticsBestEffortsSection year={year} />
    </PageLayout>
  );
}

function AnalyticsMobile({
  bucketMode,
  onBucketModeChange,
  onYearChange,
  year,
}: AnalyticsPageProps) {
  return (
    <PageLayout className="gap-6 p-4">
      <header className="grid gap-3">
        <div className="min-w-0">
          <p className="font-display text-[11px] text-primary uppercase tracking-[0.18em]">
            Analytics
          </p>
          <h1 className="mt-1 font-display text-3xl lowercase leading-none tracking-tight">
            Trends
          </h1>
          <p className="mt-2 text-muted-foreground text-sm">
            Yearly volume and personal best efforts.
          </p>
          <RouteAccent className="mt-3 h-3 w-16 text-primary" />
        </div>
        <AnalyticsVolumeControls
          bucketMode={bucketMode}
          className="w-full"
          onBucketModeChange={onBucketModeChange}
          onYearChange={onYearChange}
          year={year}
        />
      </header>
      <AnalyticsVolumeSection
        bucketMode={bucketMode}
        density="mobile"
        year={year}
      />
      <AnalyticsBestEffortsSection year={year} />
    </PageLayout>
  );
}

export { AnalyticsPage };
