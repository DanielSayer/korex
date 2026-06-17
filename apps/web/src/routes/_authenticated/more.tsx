import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRightIcon } from "lucide-react";
import { moreNavigationItems } from "@/components/mobile-navigation";

export const Route = createFileRoute("/_authenticated/more")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="grid gap-5 p-3 md:p-0">
      <header className="grid gap-1">
        <h1 className="font-semibold text-2xl tracking-tight">More</h1>
        <p className="text-muted-foreground text-sm">
          Secondary Korex areas and settings.
        </p>
      </header>
      <nav aria-label="Secondary" className="grid gap-2">
        {moreNavigationItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              className="flex min-w-0 items-center gap-3 rounded-md border border-border/70 bg-card px-3 py-3 text-card-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              key={item.to}
              to={item.to}
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
                <Icon className="size-5" />
              </span>
              <span className="grid min-w-0 flex-1 gap-0.5">
                <span className="truncate font-medium text-sm">
                  {item.label}
                </span>
                <span className="line-clamp-2 text-muted-foreground text-sm">
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
