import type {
  DashboardWeeklyDistance,
} from "@korex/api/modules/activities/activities.types";
import { FootprintsIcon } from "lucide-react";
import { RecentTrainingNotesCard } from "@/features/training-notes/components/training-notes-section";

function ShoeMileageCard({
  weeklyDistance,
}: {
  weeklyDistance?: DashboardWeeklyDistance;
}) {
  const totalKilometers =
    724 +
    Math.round((weeklyDistance?.averageWeeklyDistanceMeters ?? 16_200) / 1000) *
      8;

  return (
    <section className="rounded-xl border border-border/55 bg-card/40 p-5 shadow-black/5 shadow-md backdrop-blur-sm dark:bg-card/35 dark:shadow-black/15">
      <div className="grid gap-5">
        <div className="flex items-center gap-4">
          <div className="grid size-16 shrink-0 place-items-center rounded-md border border-border/70 bg-muted/20">
            <FootprintsIcon className="size-9 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold font-serif text-sm uppercase">
              Shoe mileage
            </h2>
            <p className="mt-2 font-semibold font-serif">Racer Pro 2</p>
          </div>
        </div>
        <div>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-semibold font-serif text-5xl tabular-nums">
                {totalKilometers}
                <span className="ml-1 font-normal font-sans text-muted-foreground text-sm">
                  km
                </span>
              </p>
              <p className="text-primary text-sm">Mocked shoe total</p>
            </div>
            <p className="hidden text-right font-medium text-muted-foreground text-xs sm:block">
              138 km to go
            </p>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-[86%] rounded-full bg-primary" />
          </div>
        </div>
      </div>
    </section>
  );
}

export {
  RecentTrainingNotesCard as TrainingNotesCard,
  ShoeMileageCard,
};
