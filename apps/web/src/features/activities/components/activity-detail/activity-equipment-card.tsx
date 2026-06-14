import type { ActivityDetailSummary } from "@korex/api/modules/activities/activities.types";
import type { Equipment } from "@korex/api/modules/equipment/equipment.types";
import { Button } from "@korex/ui/components/button";
import { Label } from "@korex/ui/components/label";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FootprintsIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { ErrorMessage } from "@/components/error-message";
import { QueryRenderer } from "@/components/query-renderer";
import { orpc } from "@/utils/orpc";

type ActivityEquipmentCardProps = {
  activityId: string;
  summary: ActivityDetailSummary;
};

function ActivityEquipmentCard({
  activityId,
  summary,
}: ActivityEquipmentCardProps) {
  const equipmentQuery = useQuery(orpc.equipment.list.queryOptions());

  return (
    <QueryRenderer
      error={
        <ErrorMessage message="Could not load Equipment." variant="banner" />
      }
      loading={<ActivityEquipmentCardSkeleton />}
      query={equipmentQuery}
    >
      {(equipment) => (
        <ActivityEquipmentEditor
          activityId={activityId}
          equipment={equipment}
          summary={summary}
        />
      )}
    </QueryRenderer>
  );
}

function ActivityEquipmentEditor({
  activityId,
  equipment,
  summary,
}: {
  activityId: string;
  equipment: Equipment[];
  summary: ActivityDetailSummary;
}) {
  const queryClient = useQueryClient();
  const summaryQueryOptions = orpc.activities.summary.queryOptions({
    input: { activityId },
  });
  const equipmentQueryOptions = orpc.equipment.list.queryOptions();
  const assignedShoes = summary.activityEquipmentUses.find(
    (item) => item.equipmentType === "shoes",
  );
  const activeShoes = equipment.filter(
    (item) => item.equipmentType === "shoes" && item.retiredAt === null,
  );
  const assignMutation = useMutation(
    orpc.equipment.assignActivity.mutationOptions({
      onError: (error) => toast.error(error.message),
      onSuccess: async (activityEquipmentUse) => {
        const selectedEquipment = activeShoes.find(
          (item) => item.id === activityEquipmentUse.equipmentId,
        );

        queryClient.setQueryData<ActivityDetailSummary>(
          summaryQueryOptions.queryKey,
          (currentSummary) =>
            currentSummary
              ? {
                  ...currentSummary,
                  activityEquipmentUses: [
                    ...currentSummary.activityEquipmentUses.filter(
                      (item) =>
                        item.equipmentType !==
                        activityEquipmentUse.equipmentType,
                    ),
                    {
                      activityId: activityEquipmentUse.activityId,
                      equipmentId: activityEquipmentUse.equipmentId,
                      equipmentName:
                        selectedEquipment?.name ??
                        assignedShoes?.equipmentName ??
                        "Shoes",
                      equipmentType: activityEquipmentUse.equipmentType,
                      id: activityEquipmentUse.id,
                    },
                  ],
                }
              : currentSummary,
        );
        toast.success("Activity Equipment saved");
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: summaryQueryOptions.queryKey,
          }),
          queryClient.invalidateQueries({
            queryKey: equipmentQueryOptions.queryKey,
          }),
        ]);
      },
    }),
  );
  const removeMutation = useMutation(
    orpc.equipment.removeActivityUse.mutationOptions({
      onError: (error) => toast.error(error.message),
      onSuccess: async () => {
        queryClient.setQueryData<ActivityDetailSummary>(
          summaryQueryOptions.queryKey,
          (currentSummary) =>
            currentSummary
              ? {
                  ...currentSummary,
                  activityEquipmentUses:
                    currentSummary.activityEquipmentUses.filter(
                      (item) => item.equipmentType !== "shoes",
                    ),
                }
              : currentSummary,
        );
        toast.success("Activity Equipment removed");
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: summaryQueryOptions.queryKey,
          }),
          queryClient.invalidateQueries({
            queryKey: equipmentQueryOptions.queryKey,
          }),
        ]);
      },
    }),
  );

  const isMutating = assignMutation.isPending || removeMutation.isPending;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-medium text-muted-foreground text-xs uppercase">
          <FootprintsIcon className="size-4 text-primary" />
          Equipment
        </p>
        <div className="min-h-8">
          {assignedShoes ? (
            <Button
              aria-label="Remove shoes from Activity"
              disabled={removeMutation.isPending}
              onClick={() =>
                removeMutation.mutate({
                  activityId: summary.activity.id,
                  equipmentType: "shoes",
                })
              }
              size="sm"
              type="button"
              variant="ghost"
            >
              <XIcon className="size-4" />
              Remove
            </Button>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="sr-only" htmlFor="activity-shoes">
          Shoes
        </Label>
        <select
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isMutating}
          id="activity-shoes"
          onChange={(event) => {
            const equipmentId = Number(event.target.value);

            if (!equipmentId) {
              return;
            }

            assignMutation.mutate({
              activityId: summary.activity.id,
              equipmentId,
            });
          }}
          value={assignedShoes?.equipmentId ?? ""}
        >
          <option value="">No shoes assigned</option>
          {activeShoes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <p className="text-muted-foreground text-xs">
          {assignedShoes
            ? `${assignedShoes.equipmentName} counts toward shoe mileage.`
            : "Select shoes to add this Activity to their mileage."}
        </p>
      </div>
    </div>
  );
}

function ActivityEquipmentCardSkeleton() {
  return <div className="h-20 animate-pulse rounded-md bg-muted/30" />;
}

export { ActivityEquipmentCard };
