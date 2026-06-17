import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
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
    <div className="grid gap-4 p-3 md:p-0">
      <Link
        className="inline-flex w-fit items-center gap-1 font-medium text-muted-foreground text-sm transition-colors hover:text-foreground"
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
              <div className="flex items-start justify-between gap-3 border-border/70 border-b pb-4">
                <div className="min-w-0">
                  <p className="font-semibold text-primary text-xs uppercase">
                    Weekly Summary
                  </p>
                  <h1 className="mt-1 font-semibold text-2xl tracking-tight">
                    {formatTrainingWeek(summary.weekStartAt, summary.weekEndAt)}
                  </h1>
                  <p className="mt-1 text-muted-foreground text-sm">
                    Generated {formatGeneratedAt(summary.generatedAt)}
                  </p>
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
