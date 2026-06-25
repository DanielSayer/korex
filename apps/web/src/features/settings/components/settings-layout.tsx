import { Link, Outlet, useLocation } from "@tanstack/react-router";
import {
  BellIcon,
  ChevronLeftIcon,
  ClockIcon,
  CloudIcon,
  MonitorIcon,
  PaletteIcon,
  ShieldIcon,
  UserIcon,
} from "lucide-react";
import { RouteAccent, WaypointDot } from "@/components/brand";
import { PageHeader, PageLayout } from "@/components/page-layout";
import { cn } from "@/lib/utils";

function SettingsLayout() {
  const location = useLocation();
  const isSettingsHub = location.pathname === "/settings";
  const activeSettingsTab =
    location.pathname === "/settings" ? "/settings/profile" : location.pathname;

  return (
    <PageLayout className="gap-6 p-4 md:gap-8 md:p-0">
      {isSettingsHub ? (
        <Link
          className="inline-flex w-fit items-center gap-1 text-muted-foreground text-sm transition-colors hover:text-foreground md:hidden"
          to="/more"
        >
          <ChevronLeftIcon className="size-4" />
          More
        </Link>
      ) : null}
      <header className="md:hidden">
        <h1 className="font-display text-3xl lowercase leading-none tracking-tight">
          Settings
        </h1>
        <p className="mt-2 text-muted-foreground text-sm">
          Account, display, training, and security.
        </p>
        <RouteAccent className="mt-3 h-3 w-16 text-primary" />
      </header>
      <PageHeader
        className="hidden border-border/70 border-b pb-4 md:flex md:pb-6"
        description="Account, display, training, and security."
        eyebrow="Settings"
        title="Control center"
      />

      <div className="hidden overflow-x-auto md:block">
        <nav className="flex min-w-max gap-1 border-border/40 border-b pb-2">
          {settingsTabs.map((tab) => (
            <Link
              className={cn(
                "group flex h-9 items-center gap-2 rounded-md border border-transparent px-3 font-medium text-muted-foreground text-sm transition-colors hover:text-foreground",
                activeSettingsTab === tab.to &&
                  "active border-primary/40 bg-primary/5 text-foreground",
              )}
              key={tab.to}
              to={tab.to}
            >
              <WaypointDot className="hidden group-[.active]:inline-flex" />
              <tab.icon className="size-4" />
              <span>{tab.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      <Outlet />
    </PageLayout>
  );
}

function MobileSettingsBackLink() {
  return (
    <Link
      className="inline-flex w-fit items-center gap-1 text-muted-foreground text-sm transition-colors hover:text-foreground md:hidden"
      to="/settings"
    >
      <ChevronLeftIcon className="size-4" />
      Settings
    </Link>
  );
}

const settingsTabs = [
  {
    description: "Provider connection health and recent sync activity.",
    icon: CloudIcon,
    label: "Connections",
    to: "/settings/connections",
  },
  {
    description: "Account identity and profile details.",
    icon: UserIcon,
    label: "Profile",
    to: "/settings/profile",
  },
  {
    description: "Date, time, and locale preferences.",
    icon: ClockIcon,
    label: "Time and Locale",
    to: "/settings/time",
  },
  {
    description: "Theme and display preferences.",
    icon: PaletteIcon,
    label: "Appearance",
    to: "/settings/appearance",
  },
  {
    description: "Equipment, Heart Rate Zones, and Training Note Tags.",
    icon: MonitorIcon,
    label: "Training",
    to: "/settings/training",
  },
  {
    description: "Current notification availability.",
    icon: BellIcon,
    label: "Notifications",
    to: "/settings/notifications",
  },
  {
    description: "Current account access options.",
    icon: ShieldIcon,
    label: "Security",
    to: "/settings/security",
  },
] as const;

export { MobileSettingsBackLink, SettingsLayout, settingsTabs };
