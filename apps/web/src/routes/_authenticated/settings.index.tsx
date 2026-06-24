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
      <div className="hidden md:block">
        <ProfileSettings />
      </div>
    </>
  );
}
