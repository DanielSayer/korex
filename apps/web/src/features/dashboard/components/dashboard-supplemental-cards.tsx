import type {
  DashboardWeeklyDistance,
  RecentActivity,
} from "@korex/api/modules/activities/activities.types";
import { Button } from "@korex/ui/components/button";
import {
  FootprintsIcon,
  NotebookPenIcon,
  NotebookTextIcon,
} from "lucide-react";

function RecoveryCard({ runs }: { runs: RecentActivity[] }) {
  const averageHr = average(
    runs
      .map((run) => run.averageHeartRateBeatsPerMinute)
      .filter((value): value is number => value !== null),
  );
  const score = averageHr
    ? Math.max(52, Math.min(92, 112 - averageHr / 3))
    : 78;

  return (
    <section className="rounded-xl border border-border/55 bg-card/40 p-5 shadow-black/5 shadow-md backdrop-blur-sm dark:bg-card/35 dark:shadow-black/15">
      <h2 className="font-semibold font-serif text-sm uppercase">Recovery</h2>
      <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
        <RingGauge label="/100" value={score} />
        <div className="min-w-0">
          <p className="font-semibold font-serif text-lg">Good</p>
          <p className="mt-2 text-muted-foreground text-sm leading-6">
            Mocked until recovery signals are exported by the API.
          </p>
          <div className="mt-4 border-t pt-3 text-sm">
            <span className="text-muted-foreground">Trend</span>
            <span className="ml-4 font-semibold text-emerald-600 dark:text-emerald-300">
              +6 pts
            </span>
            <span className="ml-4 text-muted-foreground">vs yesterday</span>
          </div>
        </div>
      </div>
    </section>
  );
}

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
      <div className="grid gap-5 2xl:grid-cols-[220px_1fr] 2xl:items-center">
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
            <p className="hidden text-right font-medium text-muted-foreground text-xs 2xl:block">
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

function TrainingNotesCard() {
  return (
    <section className="rounded-xl border border-border/55 bg-card/40 p-5 shadow-black/5 shadow-md backdrop-blur-sm dark:bg-card/35 dark:shadow-black/15">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <NotebookTextIcon className="mt-1 size-5 text-muted-foreground" />
          <div>
            <h2 className="font-semibold font-serif text-sm uppercase">
              Training notes
            </h2>
            <p className="mt-4 text-muted-foreground text-sm leading-6">
              Notes are mocked until a training notes API exists.
            </p>
          </div>
        </div>
        <Button className="self-start" size="sm" variant="outline">
          <NotebookPenIcon className="size-4" />
          Add note
        </Button>
      </div>
    </section>
  );
}

function RingGauge({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="grid size-32 shrink-0 place-items-center rounded-full"
      style={{
        background: `conic-gradient(var(--primary) ${value * 3.6}deg, var(--muted) 0deg)`,
      }}
    >
      <div className="grid size-24 place-items-center rounded-full bg-background">
        <div className="text-center">
          <p className="font-semibold font-serif text-5xl tabular-nums">
            {Math.round(value)}
          </p>
          <p className="text-muted-foreground text-sm">{label}</p>
        </div>
      </div>
    </div>
  );
}

function average(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

export { RecoveryCard, ShoeMileageCard, TrainingNotesCard };
