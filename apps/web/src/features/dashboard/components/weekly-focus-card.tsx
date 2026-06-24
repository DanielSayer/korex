import type {
  DashboardWeeklyFocus,
  DashboardWeeklyFocusReason,
  DashboardWeeklyFocusReasonKind,
  DashboardWeeklyFocusStatus,
  DashboardWeeklyFocusTone,
} from "@korex/api/modules/activities/activities.types";
import {
  ActivityIcon,
  RouteIcon,
  ShieldCheckIcon,
  TargetIcon,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { RouteAccent, SectionLabel, StrideTexture } from "@/components/brand";
import { cn } from "@/lib/utils";

type WeeklyFocusCardProps = {
  focus?: DashboardWeeklyFocus;
  isLoading: boolean;
};

const focusToneDotClass: Record<DashboardWeeklyFocusTone, string> = {
  default: "bg-primary",
  good: "bg-emerald-500",
  warn: "bg-amber-500",
};

const reasonToneIconClass: Partial<Record<DashboardWeeklyFocusTone, string>> = {
  good: "text-emerald-600 dark:text-emerald-300",
  warn: "text-amber-600 dark:text-amber-300",
};

const reasonToneTextClass: Partial<Record<DashboardWeeklyFocusTone, string>> = {
  good: "text-emerald-700 dark:text-emerald-300",
  warn: "text-amber-700 dark:text-amber-300",
};

const reasonKindIcon: Record<
  DashboardWeeklyFocusReasonKind,
  ComponentType<SVGProps<SVGSVGElement>>
> = {
  activity: ActivityIcon,
  equipment: ShieldCheckIcon,
  goal: TargetIcon,
  time: ShieldCheckIcon,
  volume: RouteIcon,
};

const loadingFocus: DashboardWeeklyFocus = {
  action: "Preparing next step",
  body: "Checking current activity, goal progress, volume, and equipment.",
  reasons: [
    { kind: "goal", label: "Goals" },
    { kind: "volume", label: "Volume" },
    { kind: "time", label: "Timing" },
  ],
  status: "steady",
  title: "Reading this week.",
  tone: "default",
};

const unavailableFocus: DashboardWeeklyFocus = {
  action: "One consistent run",
  body: "Add controlled volume and keep the session repeatable.",
  reasons: [
    { kind: "goal", label: "Goal pending" },
    { kind: "volume", label: "Volume pending" },
    { kind: "time", label: "Keep it repeatable" },
  ],
  status: "build",
  title: "Build the week.",
  tone: "default",
};

function WeeklyFocusCard({ focus, isLoading }: WeeklyFocusCardProps) {
  const visibleFocus = isLoading ? loadingFocus : (focus ?? unavailableFocus);

  return (
    <section className="relative max-w-2xl">
      <StrideTexture className="opacity-30" />
      <div className="relative">
      <div className="flex items-center gap-2">
        <SectionLabel>Weekly focus</SectionLabel>
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            focusToneDotClass[visibleFocus.tone],
          )}
        />
        <span className="font-medium text-muted-foreground text-xs">
          {isLoading ? "Reading week" : formatStatus(visibleFocus.status)}
        </span>
      </div>

      <h1 className="mt-5 max-w-130 font-display text-5xl leading-[0.94] tracking-tight sm:text-6xl">
        {visibleFocus.title}
      </h1>
      <RouteAccent className="mt-3 h-3 w-20 text-primary" />
      <p className="mt-6 max-w-lg text-muted-foreground leading-7">
        {visibleFocus.body}
      </p>

      <div className="mt-8 grid max-w-xl gap-4 border-border/70 border-l pl-4 sm:grid-cols-[minmax(0,1fr)_minmax(13rem,0.9fr)] sm:pl-5">
        <div className="min-w-0">
          <p className="font-medium text-muted-foreground text-xs uppercase">
            Next
          </p>
          <p className="mt-1 font-semibold text-xl">{visibleFocus.action}</p>
        </div>

        <div className="grid gap-2">
          {visibleFocus.reasons.map((reason) => (
            <FocusReason
              key={`${reason.kind}-${reason.label}`}
              reason={reason}
            />
          ))}
        </div>
      </div>
      </div>
    </section>
  );
}

function FocusReason({ reason }: { reason: DashboardWeeklyFocusReason }) {
  const Icon = reasonKindIcon[reason.kind];
  const iconToneClass = reason.tone
    ? reasonToneIconClass[reason.tone]
    : undefined;
  const textToneClass = reason.tone
    ? reasonToneTextClass[reason.tone]
    : undefined;

  return (
    <div className="flex min-w-0 items-center gap-2 text-sm">
      <Icon
        className={cn("size-4 shrink-0 text-muted-foreground", iconToneClass)}
      />
      <span
        className={cn("min-w-0 truncate text-muted-foreground", textToneClass)}
      >
        {reason.label}
      </span>
    </div>
  );
}

function formatStatus(status: DashboardWeeklyFocusStatus) {
  switch (status) {
    case "build":
      return "Build";
    case "complete":
      return "Complete";
    case "recover":
      return "Recover";
    case "restart":
      return "Restart";
    case "steady":
      return "Steady";
  }
}

export { WeeklyFocusCard };
