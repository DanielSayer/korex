import { Button } from "@korex/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@korex/ui/components/dropdown-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontalIcon, RefreshCwIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";

function useWeeklySummaryRegeneration({
  detailQueryKey,
  weekStartAt,
}: {
  detailQueryKey: readonly unknown[];
  weekStartAt: Date | null;
}) {
  const queryClient = useQueryClient();
  const listQuery = orpc.activities.weeklyTrainingSummaries.queryOptions();
  const regenerateMutation = useMutation(
    orpc.activities.regenerateWeeklyTrainingSummary.mutationOptions({
      onError: (error) => {
        toast.error(error.message);
      },
      onSuccess: () => {
        toast.success("Weekly Training Summary regeneration queued");
        queryClient.invalidateQueries({
          queryKey: detailQueryKey,
        });
        queryClient.invalidateQueries({ queryKey: listQuery.queryKey });
      },
    }),
  );

  return {
    isRegenerating: regenerateMutation.isPending,
    regenerate: () => {
      if (!weekStartAt) {
        return;
      }

      regenerateMutation.mutate({ weekStartAt });
    },
  };
}

function WeeklySummaryActions({
  isRegenerating,
  onRegenerate,
}: {
  isRegenerating: boolean;
  onRegenerate: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            aria-label="Weekly summary actions"
            size="icon-sm"
            type="button"
            variant="outline"
          />
        }
      >
        <MoreHorizontalIcon className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem disabled={isRegenerating} onClick={onRegenerate}>
          <RefreshCwIcon
            className={cn("size-4", isRegenerating && "animate-spin")}
          />
          Regenerate
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { useWeeklySummaryRegeneration, WeeklySummaryActions };
