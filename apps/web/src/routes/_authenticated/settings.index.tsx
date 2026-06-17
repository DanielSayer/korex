import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRightIcon } from "lucide-react";
import { ProfileSettings } from "@/features/settings/components/profile-settings";
import { settingsTabs } from "@/features/settings/components/settings-layout";

export const Route = createFileRoute("/_authenticated/settings/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <nav aria-label="Settings sections" className="grid gap-2 md:hidden">
        {settingsTabs.map((tab) => (
          <Link
            className="flex min-w-0 items-center gap-3 rounded-md border border-border/70 bg-card px-3 py-3 text-card-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            key={tab.to}
            to={tab.to}
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
              <tab.icon className="size-5" />
            </span>
            <span className="grid min-w-0 flex-1 gap-0.5">
              <span className="truncate font-medium text-sm">{tab.label}</span>
              <span className="line-clamp-2 text-muted-foreground text-sm">
                {tab.description}
              </span>
            </span>
            <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </nav>
      <div className="hidden md:block">
        <ProfileSettings />
      </div>
    </>
  );
}
