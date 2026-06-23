import { Link, Outlet, useLocation } from "@tanstack/react-router";
import {
  BellIcon,
  ChevronLeftIcon,
  CloudIcon,
  ClockIcon,
  MonitorIcon,
  PaletteIcon,
  ShieldIcon,
  UserIcon,
} from "lucide-react";
import { PageHeader, PageLayout } from "@/components/page-layout";
import { cn } from "@/lib/utils";

function SettingsLayout() {
  const location = useLocation();
  const isSettingsHub = location.pathname === "/settings";

  return (
    <PageLayout className="gap-5 p-3 md:gap-8 md:p-0">
      {isSettingsHub ? (
        <Link
          className="inline-flex w-fit items-center gap-1 font-medium text-muted-foreground text-sm transition-colors hover:text-foreground md:hidden"
          to="/more"
        >
          <ChevronLeftIcon className="size-4" />
          More
        </Link>
      ) : null}
      <PageHeader
        className="border-border/70 border-b pb-4 md:pb-6"
        description="Manage account details, display preferences, training configuration, and connected app behavior."
        title="Settings"
      />

      <div className="hidden overflow-x-auto md:block">
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
    </PageLayout>
  );
}

function MobileSettingsBackLink() {
  return (
    <Link
      className="inline-flex w-fit items-center gap-1 font-medium text-muted-foreground text-sm transition-colors hover:text-foreground md:hidden"
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
    description: "Weekly Training Summary notification behavior.",
    icon: BellIcon,
    label: "Notifications",
    to: "/settings/notifications",
  },
  {
    description: "Password and account security.",
    icon: ShieldIcon,
    label: "Security",
    to: "/settings/security",
  },
] as const;

export { MobileSettingsBackLink, SettingsLayout, settingsTabs };
