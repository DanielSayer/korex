import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Diagonal "stride" lines lifted from the korex app icon, faded out.
 * Decorative brand texture for hero surfaces.
 */
function StrideTexture({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 opacity-[0.07]",
        "[background:repeating-linear-gradient(115deg,transparent_0_12px,var(--primary)_12px_14px)]",
        "[mask-image:linear-gradient(105deg,black,transparent_72%)]",
        className,
      )}
    />
  );
}

/**
 * Ascending route line ending in a waypoint dot — the core brand motif.
 */
function RouteAccent({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 72 12"
    >
      <path
        d="M2 10 41 3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.5"
      />
      <circle cx="41" cy="3" fill="currentColor" r="3.5" />
    </svg>
  );
}

function SectionLabel({
  action,
  children,
}: {
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-display text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
        {children}
      </span>
      {action}
    </div>
  );
}

/**
 * A waypoint dot — the core brand mark. Filled marks a point on the trail;
 * hollow marks a future point.
 */
function WaypointDot({
  filled = true,
  className,
}: {
  filled?: boolean;
  className?: string;
}) {
  return filled ? (
    <span className={cn("size-1.5 rounded-full bg-primary", className)} />
  ) : (
    <span
      className={cn(
        "grid size-2.5 place-items-center rounded-full border-2 border-primary bg-background",
        className,
      )}
    >
      <span className="size-1 rounded-full bg-primary" />
    </span>
  );
}

/**
 * A route-line progress: a hairline trail with a waypoint dot climbing
 * up-right as progress grows. Replaces generic progress bars on the trail.
 */
function RouteProgress({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(value, 100));

  return (
    <div
      className={cn("relative h-1 rounded-full bg-border/50", className)}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-primary"
        style={{ width: `${clamped}%` }}
      />
      <span
        aria-hidden="true"
        className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-primary"
        style={{ left: `${clamped}%` }}
      />
    </div>
  );
}

export { RouteAccent, RouteProgress, SectionLabel, StrideTexture, WaypointDot };
