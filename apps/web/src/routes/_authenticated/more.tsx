import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRightIcon } from "lucide-react";
import { RouteAccent, WaypointDot } from "@/components/brand";
import { moreNavigationItems } from "@/components/mobile-navigation";
import { PageHeader, PageLayout } from "@/components/page-layout";

export const Route = createFileRoute("/_authenticated/more")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <MobileMoreHub />
      <DesktopMoreHub />
    </>
  );
}

function MobileMoreHub() {
  return (
    <div className="flex flex-col gap-6 p-4 md:hidden">
      <header>
        <h1 className="font-display text-3xl lowercase leading-none tracking-tight">
          More
        </h1>
        <p className="mt-2 text-muted-foreground text-sm">
          The rest of your trail.
        </p>
        <RouteAccent className="mt-3 h-3 w-16 text-primary" />
      </header>
      <nav aria-label="Secondary" className="flex flex-col">
        {moreNavigationItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              className="flex min-w-0 items-center gap-3 border-border/40 border-b py-4 transition-colors last:border-b-0 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              key={item.to}
              to={item.to}
            >
              <Icon className="size-5 shrink-0 text-primary" />
              <span className="grid min-w-0 flex-1 gap-0.5">
                <span className="truncate font-display text-base tracking-tight">
                  {item.label}
                </span>
                <span className="line-clamp-2 text-muted-foreground text-xs leading-relaxed">
                  {item.description}
                </span>
              </span>
              <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function DesktopMoreHub() {
  return (
    <PageLayout className="hidden gap-8 md:flex">
      <PageHeader
        className="border-border/70 border-b pb-6"
        description="Secondary routes for reviewing your history and managing Korex."
        eyebrow="Field journal"
        title="More"
      />

      <section className="max-w-4xl" aria-labelledby="secondary-routes-title">
        <h2
          className="font-display text-[11px] text-muted-foreground uppercase tracking-[0.18em]"
          id="secondary-routes-title"
        >
          Secondary routes
        </h2>
        <nav aria-label="Secondary" className="mt-3 border-border/60 border-t">
          {moreNavigationItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                className="group grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 border-border/60 border-b px-3 py-5 transition-colors hover:bg-muted/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                key={item.to}
                to={item.to}
              >
                <span className="grid size-10 place-items-center rounded-full bg-muted text-foreground transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                  <Icon className="size-4" />
                </span>
                <span className="grid min-w-0 gap-1">
                  <span className="font-display text-lg lowercase leading-tight tracking-tight">
                    {item.label}
                  </span>
                  <span className="text-muted-foreground text-sm leading-relaxed">
                    {item.description}
                  </span>
                </span>
                <span className="flex items-center gap-3 text-muted-foreground transition-colors group-hover:text-foreground">
                  <WaypointDot
                    filled={false}
                    className="border-journal-route [&>span]:bg-journal-route"
                  />
                  <ChevronRightIcon className="size-4" />
                </span>
              </Link>
            );
          })}
        </nav>
      </section>
    </PageLayout>
  );
}
