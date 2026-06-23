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

export { RouteAccent, SectionLabel, StrideTexture };
