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
  summary: ActivityDetailSummary;
};

function ActivityEquipmentCard({ summary }: ActivityEquipmentCardProps) {
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
        <ActivityEquipmentEditor equipment={equipment} summary={summary} />
      )}
    </QueryRenderer>
  );
}

function ActivityEquipmentEditor({
  equipment,
  summary,
}: {
  equipment: Equipment[];
  summary: ActivityDetailSummary;
}) {
  const queryClient = useQueryClient();
  const summaryQueryOptions = orpc.activities.summary.queryOptions({
    input: { activityId: summary.activity.id },
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
      onSuccess: async () => {
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

  return (
    <section className="rounded-xl border bg-card p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-md border bg-muted/30">
            <FootprintsIcon className="size-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-base">Equipment</h2>
            <p className="text-muted-foreground text-sm">
              Assign shoes used for this Activity.
            </p>
          </div>
        </div>
        {assignedShoes ? (
          <Button
            disabled={removeMutation.isPending}
            onClick={() =>
              removeMutation.mutate({
                activityId: summary.activity.id,
                equipmentType: "shoes",
              })
            }
            type="button"
            variant="outline"
          >
            <XIcon className="size-4" />
            Remove
          </Button>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(12rem,1fr)_auto] sm:items-end">
        <div className="space-y-2">
          <Label htmlFor="activity-shoes">Shoes</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
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
        </div>
        <div className="text-muted-foreground text-sm">
          {assignedShoes
            ? `${assignedShoes.equipmentName} is assigned.`
            : "No shoes assigned."}
        </div>
      </div>
    </section>
  );
}

function ActivityEquipmentCardSkeleton() {
  return <div className="h-34 animate-pulse rounded-xl border bg-muted/30" />;
}

export { ActivityEquipmentCard };
