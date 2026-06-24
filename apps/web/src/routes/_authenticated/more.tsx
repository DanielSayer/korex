import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRightIcon } from "lucide-react";
import { RouteAccent } from "@/components/brand";
import { moreNavigationItems } from "@/components/mobile-navigation";

export const Route = createFileRoute("/_authenticated/more")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-col gap-6 p-4">
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
