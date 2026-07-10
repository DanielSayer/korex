import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { ErrorMessage } from "@/components/error-message";
import { PageHeader } from "@/components/page-layout";
import { QueryRenderer } from "@/components/query-renderer";
import { useIsMobileViewport } from "@/components/responsive";
import { orpc } from "@/utils/orpc";
import {
  useWeeklySummaryRegeneration,
  WeeklySummaryActions,
} from "./weekly-training-summary-actions";
import {
  WeeklyTrainingSummaryDetail,
  WeeklyTrainingSummaryDetailLoading,
} from "./weekly-training-summary-detail";
import {
  formatGeneratedAt,
  formatTrainingWeek,
} from "./weekly-training-summary-formatters";

function WeeklyTrainingSummaryDetailPage({
  weekStartAt,
}: {
  weekStartAt: Date;
}) {
  const isMobileViewport = useIsMobileViewport();
  const detailQueryOptions =
    orpc.activities.getWeeklyTrainingSummary.queryOptions({
      input: { weekStartAt },
    });
  const detailQuery = useQuery(detailQueryOptions);
  const { isRegenerating, regenerate } = useWeeklySummaryRegeneration({
    detailQueryKey: detailQueryOptions.queryKey,
    weekStartAt,
  });

  return (
    <div className="grid gap-6 p-4 md:gap-4 md:p-0">
      <Link
        className="inline-flex w-fit items-center gap-1 text-muted-foreground text-sm transition-colors hover:text-foreground"
        to="/weekly-summaries"
      >
        <ArrowLeftIcon className="size-4" />
        Weekly Summaries
      </Link>
      <QueryRenderer
        error={
          <ErrorMessage
            message="Could not load this weekly summary."
            variant="banner"
          />
        }
        loading={<WeeklyTrainingSummaryDetailLoading />}
        query={detailQuery}
      >
        {(summary) =>
          summary ? (
            <>
              <PageHeader
                actions={
                  <WeeklySummaryActions
                    desktop={!isMobileViewport}
                    isRegenerating={isRegenerating}
                    onRegenerate={regenerate}
                  />
                }
                className="border-border/40 border-b pb-4"
                description={`Generated ${formatGeneratedAt(summary.generatedAt)}`}
                eyebrow="Weekly summary"
                title={formatTrainingWeek(
                  summary.weekStartAt,
                  summary.weekEndAt,
                )}
              />
              <WeeklyTrainingSummaryDetail
                desktop={!isMobileViewport}
                summary={summary}
              />
            </>
          ) : (
            <ErrorMessage
              message="This weekly summary is no longer available."
              variant="banner"
            />
          )
        }
      </QueryRenderer>
    </div>
  );
}

export { WeeklyTrainingSummaryDetailPage };
