import type {
  DashboardWeeklyDistance,
  RecentActivity,
} from "@korex/api/modules/activities/activities.types";
import { Button } from "@korex/ui/components/button";
import { FootprintsIcon, NotebookTextIcon } from "lucide-react";
import { formatDistanceValue } from "@/utils/formatters";

const weeklyTargetBars = [
  { day: "monday", height: 0.82 },
  { day: "tuesday", height: 0.38 },
  { day: "wednesday", height: 0.56 },
  { day: "thursday", height: 0.18 },
  { day: "friday", height: 0.28 },
  { day: "saturday", height: 0.36 },
  { day: "sunday", height: 0.48 },
];

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
    <section className="rounded-lg border p-5">
      <h2 className="font-semibold text-lg">Recovery</h2>
      <div className="mt-5 flex flex-col gap-5">
        <RingGauge label="/100" value={score} />
        <div className="min-w-0">
          <p className="font-semibold">Good</p>
          <p className="mt-2 text-muted-foreground text-sm leading-6">
            Mocked until recovery signals are exported by the API.
          </p>
          <div className="mt-4 border-t pt-3 text-sm">
            <span className="text-muted-foreground">Trend</span>
            <span className="ml-4 font-semibold">+6 pts</span>
            <span className="ml-4 text-muted-foreground">vs yesterday</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function WeeklyTargetCard({
  weeklyDistance,
}: {
  weeklyDistance?: DashboardWeeklyDistance;
}) {
  const targetMeters = 50_000;
  const distanceMeters = weeklyDistance?.thisWeekDistanceMeters ?? 0;
  const progress = Math.min(
    100,
    Math.round((distanceMeters / targetMeters) * 100),
  );

  return (
    <section className="rounded-lg border p-5">
      <h2 className="font-semibold text-lg">Weekly target</h2>
      <div className="mt-5 flex flex-col gap-5">
        <RingGauge label="%" value={progress} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-2xl tabular-nums">
            {formatDistanceValue(distanceMeters)}
            <span className="font-normal text-muted-foreground"> / 50 km</span>
          </p>
          <p className="text-muted-foreground text-sm">Distance</p>
          <div className="mt-5 flex h-16 items-end gap-2 border-t pt-3 sm:gap-4">
            {weeklyTargetBars.map((bar) => (
              <div className="grid flex-1 place-items-end gap-1" key={bar.day}>
                <span
                  className="w-full rounded-t-sm bg-primary"
                  style={{ height: `${bar.height * 100}%` }}
                />
              </div>
            ))}
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
    <section className="rounded-lg border p-5">
      <h2 className="font-semibold text-lg">Shoe mileage</h2>
      <div className="mt-5 flex items-center gap-4">
        <FootprintsIcon className="size-10 text-muted-foreground" />
        <div>
          <p className="font-semibold">Racer Pro 2</p>
          <p className="font-semibold text-3xl tabular-nums">
            {totalKilometers}
            <span className="ml-1 font-normal text-muted-foreground text-sm">
              km
            </span>
          </p>
          <p className="text-muted-foreground text-sm">Mocked shoe total</p>
        </div>
      </div>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-[34%] rounded-full bg-primary" />
      </div>
      <p className="mt-3 text-right font-medium text-muted-foreground text-xs">
        138 km to go
      </p>
    </section>
  );
}

function TrainingNotesCard() {
  return (
    <section className="rounded-lg border p-5">
      <div className="flex items-center gap-3">
        <NotebookTextIcon className="size-5 text-muted-foreground" />
        <h2 className="font-semibold text-lg">Training notes</h2>
      </div>
      <p className="mt-5 text-muted-foreground text-sm leading-6">
        Notes are mocked until a training notes API exists.
      </p>
      <Button className="mt-6" size="sm" variant="outline">
        <NotebookTextIcon className="size-4" />
        Add note
      </Button>
    </section>
  );
}

function RingGauge({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="grid size-28 shrink-0 place-items-center rounded-full"
      style={{
        background: `conic-gradient(var(--primary) ${value * 3.6}deg, var(--muted) 0deg)`,
      }}
    >
      <div className="grid size-[86px] place-items-center rounded-full bg-background">
        <div className="text-center">
          <p className="font-semibold text-4xl tabular-nums">
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

export { RecoveryCard, ShoeMileageCard, TrainingNotesCard, WeeklyTargetCard };
