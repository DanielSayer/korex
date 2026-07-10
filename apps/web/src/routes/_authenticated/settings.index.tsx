import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRightIcon } from "lucide-react";
import { settingsTabs } from "@/features/settings/components/settings-layout";

export const Route = createFileRoute("/_authenticated/settings/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <nav aria-label="Settings sections" className="flex flex-col md:hidden">
        {settingsTabs.map((tab) => (
          <Link
            className="flex min-w-0 items-center gap-3 border-border/40 border-b py-4 transition-colors last:border-b-0 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            key={tab.to}
            to={tab.to}
          >
            <tab.icon className="size-5 shrink-0 text-primary" />
            <span className="grid min-w-0 flex-1 gap-0.5">
              <span className="truncate font-display text-base tracking-tight">
                {tab.label}
              </span>
              <span className="line-clamp-2 text-muted-foreground text-xs leading-relaxed">
                {tab.description}
              </span>
            </span>
            <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </nav>
      <section className="hidden md:block">
        <div className="border-border/40 border-b pb-5">
          <p className="font-display text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
            Settings index
          </p>
          <h2 className="mt-1 font-display text-2xl lowercase tracking-tight">
            Choose what to tune.
          </h2>
        </div>
        <nav
          aria-label="Settings sections"
          className="grid border-border/40 border-b lg:grid-cols-2"
        >
          {settingsTabs.map((tab, index) => (
            <Link
              className="group flex min-w-0 items-start gap-4 border-border/40 border-b py-5 transition-colors last:border-b-0 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50 lg:px-5 lg:odd:border-r"
              key={tab.to}
              to={tab.to}
            >
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors group-hover:text-foreground">
                <tab.icon className="size-4" />
              </span>
              <span className="grid min-w-0 flex-1 gap-1">
                <span className="font-display text-lg tracking-tight">
                  {tab.label}
                </span>
                <span className="text-muted-foreground text-sm leading-5">
                  {tab.description}
                </span>
              </span>
              <span className="font-display text-[10px] text-muted-foreground tabular-nums uppercase tracking-[0.18em]">
                {String(index + 1).padStart(2, "0")}
              </span>
            </Link>
          ))}
        </nav>
      </section>
    </>
  );
}
