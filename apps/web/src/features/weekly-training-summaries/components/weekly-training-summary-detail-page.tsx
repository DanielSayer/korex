import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { RouteAccent } from "@/components/brand";
import { ErrorMessage } from "@/components/error-message";
import { QueryRenderer } from "@/components/query-renderer";
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
              <div className="flex items-start justify-between gap-3 border-border/40 border-b pb-4">
                <div className="min-w-0">
                  <p className="font-display text-[11px] text-primary uppercase tracking-[0.18em]">
                    Weekly summary
                  </p>
                  <h1 className="mt-1 font-display text-2xl tracking-tight">
                    {formatTrainingWeek(summary.weekStartAt, summary.weekEndAt)}
                  </h1>
                  <p className="mt-1 text-muted-foreground text-xs">
                    Generated {formatGeneratedAt(summary.generatedAt)}
                  </p>
                  <RouteAccent className="mt-2 h-3 w-16 text-primary" />
                </div>
                <WeeklySummaryActions
                  isRegenerating={isRegenerating}
                  onRegenerate={regenerate}
                />
              </div>
              <WeeklyTrainingSummaryDetail summary={summary} />
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
