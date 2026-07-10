import type { WeeklyTrainingSummaryListItem } from "@korex/api/modules/activities/weekly-training-summaries/weekly-training-summary.types";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@korex/ui/components/sheet";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence } from "motion/react";
import { WaypointDot } from "@/components/brand";
import { ErrorMessage } from "@/components/error-message";
import { QueryRenderer } from "@/components/query-renderer";
import { orpc } from "@/utils/orpc";
import {
  useWeeklySummaryRegeneration,
  WeeklySummaryActions,
} from "./weekly-training-summary-actions";
import {
  AnimatedPanelState,
  WeeklyTrainingSummaryDetail,
  WeeklyTrainingSummaryDetailLoading,
} from "./weekly-training-summary-detail";
import {
  formatGeneratedAt,
  formatTrainingWeek,
} from "./weekly-training-summary-formatters";

type WeeklyTrainingSummaryDetailPanelProps = {
  onOpenChange: (open: boolean) => void;
  summary: WeeklyTrainingSummaryListItem | null;
};

function WeeklyTrainingSummaryDetailPanel({
  onOpenChange,
  summary,
}: WeeklyTrainingSummaryDetailPanelProps) {
  const detailQueryOptions =
    orpc.activities.getWeeklyTrainingSummary.queryOptions({
      input: { weekStartAt: summary?.weekStartAt ?? new Date(0) },
    });
  const detailQuery = useQuery({
    ...detailQueryOptions,
    enabled: summary !== null,
  });
  const { isRegenerating, regenerate } = useWeeklySummaryRegeneration({
    detailQueryKey: detailQueryOptions.queryKey,
    weekStartAt: summary?.weekStartAt ?? null,
  });

  return (
    <Sheet onOpenChange={onOpenChange} open={summary !== null}>
      <SheetContent className="w-full overflow-y-auto p-0 data-[side=right]:sm:w-190 data-[side=right]:sm:max-w-190">
        {summary ? (
          <>
            <SheetHeader className="border-b bg-background p-6">
              <div className="flex items-start justify-between gap-3 pr-10">
                <div className="flex min-w-0 items-start gap-3">
                  <WaypointDot className="mt-2.5 shrink-0 bg-journal-route" />
                  <div className="min-w-0">
                    <p className="font-display text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
                      Weekly summary
                    </p>
                    <SheetTitle className="mt-1 font-display text-2xl lowercase tracking-tight">
                      {formatTrainingWeek(
                        summary.weekStartAt,
                        summary.weekEndAt,
                      )}
                    </SheetTitle>
                    <SheetDescription>
                      Stored snapshot · generated{" "}
                      {formatGeneratedAt(summary.generatedAt)}
                    </SheetDescription>
                  </div>
                </div>
                <WeeklySummaryActions
                  desktop
                  isRegenerating={isRegenerating}
                  onRegenerate={regenerate}
                />
              </div>
            </SheetHeader>

            <div className="p-4 sm:p-6">
              <AnimatePresence mode="wait">
                <QueryRenderer
                  error={
                    <AnimatedPanelState key="error">
                      <ErrorMessage
                        message="Could not load this weekly summary."
                        variant="banner"
                      />
                    </AnimatedPanelState>
                  }
                  loading={<WeeklyTrainingSummaryDetailLoading key="loading" />}
                  query={detailQuery}
                >
                  {(detail) =>
                    detail ? (
                      <WeeklyTrainingSummaryDetail desktop summary={detail} />
                    ) : (
                      <AnimatedPanelState key="empty">
                        <ErrorMessage
                          message="This weekly summary is no longer available."
                          variant="banner"
                        />
                      </AnimatedPanelState>
                    )
                  }
                </QueryRenderer>
              </AnimatePresence>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

export { WeeklyTrainingSummaryDetailPanel };
