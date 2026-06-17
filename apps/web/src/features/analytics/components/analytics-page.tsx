import type { AnalyticsVolumeBucketMode } from "@korex/api/modules/activities/activities.types";
import { PageHeader, PageLayout } from "@/components/page-layout";
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
    <PageLayout>
      <PageHeader
        title="Analytics"
        description="Yearly training volume from current activities."
        actions={
          <AnalyticsVolumeControls
            bucketMode={bucketMode}
            onBucketModeChange={onBucketModeChange}
            onYearChange={onYearChange}
            year={year}
          />
        }
      />
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
    <PageLayout className="gap-4 p-3">
      <header className="grid gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-primary text-xs uppercase">
            Analytics
          </p>
          <h1 className="mt-1 font-semibold text-2xl tracking-tight">
            Training trends
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Yearly volume and personal best efforts.
          </p>
        </div>
        <AnalyticsVolumeControls
          bucketMode={bucketMode}
          className="w-full"
          onBucketModeChange={onBucketModeChange}
          onYearChange={onYearChange}
          year={year}
        />
      </header>
      <AnalyticsVolumeSection bucketMode={bucketMode} year={year} />
      <AnalyticsBestEffortsSection year={year} />
    </PageLayout>
  );
}

export { AnalyticsPage };
