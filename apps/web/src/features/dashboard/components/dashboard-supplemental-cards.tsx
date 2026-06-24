import { Button } from "@korex/ui/components/button";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { FootprintsIcon } from "lucide-react";
import { RouteProgress, SectionLabel } from "@/components/brand";
import { RecentTrainingNotesCard } from "@/features/training-notes/components/training-notes-section";
import { formatDistance } from "@/utils/formatters";
import { orpc } from "@/utils/orpc";

function ShoeMileageCard() {
  const equipmentQuery = useQuery(orpc.equipment.list.queryOptions());
  const shoes = (equipmentQuery.data ?? [])
    .filter((item) => item.equipmentType === "shoes" && item.retiredAt === null)
    .toSorted(
      (left, right) => right.usageDistanceMeters - left.usageDistanceMeters,
    );
  const primaryShoe = shoes[0];
  const retirementDistance = primaryShoe?.retirementDistanceMeters ?? null;
  const remainingDistance =
    primaryShoe && retirementDistance !== null
      ? Math.max(retirementDistance - primaryShoe.usageDistanceMeters, 0)
      : null;
  const retirementPercent =
    primaryShoe && retirementDistance && retirementDistance > 0
      ? Math.min(
          (primaryShoe.usageDistanceMeters / retirementDistance) * 100,
          100,
        )
      : null;

  return (
    <section className="pb-8">
      <div className="grid gap-5">
        <div className="flex items-center gap-4">
          <FootprintsIcon className="size-5 shrink-0 text-primary" />
          <div>
            <SectionLabel>Shoe mileage</SectionLabel>
            <p className="mt-1 font-display font-medium">
              {primaryShoe?.name ?? "No shoes tracked"}
            </p>
          </div>
        </div>
        {equipmentQuery.isPending ? (
          <div className="h-22 animate-pulse rounded-md bg-muted" />
        ) : primaryShoe ? (
          <div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="font-display text-5xl tabular-nums">
                  {Math.round(primaryShoe.usageDistanceMeters / 1000)}
                  <span className="ml-1 font-normal font-sans text-muted-foreground text-sm">
                    km
                  </span>
                </p>
                <p className="text-primary text-sm">
                  {primaryShoe.activityCount} assigned Activities
                </p>
              </div>
              {remainingDistance !== null ? (
                <p className="hidden text-right font-medium text-muted-foreground text-xs sm:block">
                  {formatDistance(remainingDistance)} to go
                </p>
              ) : null}
            </div>
            {retirementPercent !== null ? (
              <RouteProgress className="mt-5" value={retirementPercent} />
            ) : null}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Add shoes in Training settings to track mileage from Activity
              assignments.
            </p>
            <Button
              size="sm"
              variant="outline"
              render={<Link to="/settings/training" />}
            >
              Add shoes
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

export { RecentTrainingNotesCard as TrainingNotesCard, ShoeMileageCard };
