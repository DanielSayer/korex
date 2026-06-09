import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import {
  BellIcon,
  ClockIcon,
  MonitorIcon,
  PaletteIcon,
  ShieldIcon,
  UserIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="grid gap-8">
      <div className="border-border/70 border-b pb-6">
        <p className="font-medium text-muted-foreground text-xs uppercase">
          Workspace
        </p>
        <h1 className="mt-2 font-semibold text-3xl tracking-tight">Settings</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground text-sm">
          Manage account details, display preferences, training configuration,
          and connected app behavior.
        </p>
      </div>

      <div className="overflow-x-auto">
        <nav className="flex min-w-max gap-1 border-border/70 border-b pb-2">
          {settingsTabs.map((tab) => (
            <Link
              activeOptions={{ exact: true }}
              activeProps={{
                className:
                  "border-border bg-muted/70 text-foreground shadow-xs dark:bg-muted/50",
              }}
              className={cn(
                "flex h-9 items-center gap-2 rounded-md border border-transparent px-3 font-medium text-muted-foreground text-sm transition-colors hover:bg-muted/70 hover:text-foreground dark:hover:bg-muted/50",
              )}
              key={tab.to}
              to={tab.to}
            >
              <tab.icon className="size-4" />
              <span>{tab.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      <Outlet />
    </div>
  );
}

const settingsTabs = [
  { icon: UserIcon, label: "Profile", to: "/settings/profile" },
  { icon: ClockIcon, label: "Time and Locale", to: "/settings/time" },
  { icon: PaletteIcon, label: "Appearance", to: "/settings/appearance" },
  { icon: MonitorIcon, label: "Training", to: "/settings/training" },
  { icon: BellIcon, label: "Notifications", to: "/settings/notifications" },
  { icon: ShieldIcon, label: "Security", to: "/settings/security" },
] as const;
