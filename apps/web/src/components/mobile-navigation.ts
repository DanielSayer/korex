import {
  CalendarDaysIcon,
  FlameIcon,
  Home,
  LineChartIcon,
  MoreHorizontalIcon,
  SettingsIcon,
  TargetIcon,
  TrophyIcon,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";

type NavigationIcon = ComponentType<SVGProps<SVGSVGElement>>;

export type MobileTabId =
  | "dashboard"
  | "calendar"
  | "analytics"
  | "goals"
  | "more";

export type AppNavigationId =
  | "dashboard"
  | "calendar"
  | "analytics"
  | "goals"
  | "heatmap"
  | "weekly-summaries"
  | "settings";

export interface AppNavigationItem {
  description?: string;
  icon: NavigationIcon;
  id: AppNavigationId;
  label: string;
  mobileTabId: MobileTabId;
  to: string;
}

export interface MobileTabItem {
  id: MobileTabId;
  label: string;
  to: string;
  icon: NavigationIcon;
}

export interface MoreNavigationItem {
  label: string;
  description: string;
  to: string;
  icon: NavigationIcon;
}

export const appNavigationItems: AppNavigationItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    to: "/dashboard",
    icon: Home,
    mobileTabId: "dashboard",
  },
  {
    id: "calendar",
    label: "Calendar",
    to: "/calendar",
    icon: CalendarDaysIcon,
    mobileTabId: "calendar",
  },
  {
    id: "analytics",
    label: "Analytics",
    to: "/analytics",
    icon: LineChartIcon,
    mobileTabId: "analytics",
  },
  {
    id: "goals",
    label: "Goals",
    to: "/goals",
    icon: TargetIcon,
    mobileTabId: "goals",
  },
  {
    id: "heatmap",
    label: "Heatmap",
    description: "Explore your Activity Route Heatmap.",
    to: "/heatmap",
    icon: FlameIcon,
    mobileTabId: "more",
  },
  {
    id: "weekly-summaries",
    label: "Weekly Summaries",
    description: "Replay completed Training Weeks.",
    to: "/weekly-summaries",
    icon: TrophyIcon,
    mobileTabId: "more",
  },
  {
    id: "settings",
    label: "Settings",
    description: "Manage account, display, training, and security settings.",
    to: "/settings",
    icon: SettingsIcon,
    mobileTabId: "more",
  },
];

const primaryMobileItems = appNavigationItems.filter(
  (item) => item.mobileTabId !== "more",
);
const secondaryMobileItems = appNavigationItems.filter(
  (item) => item.mobileTabId === "more",
);

export const mobileTabs: MobileTabItem[] = [
  ...primaryMobileItems.map((item) => ({
    id: item.mobileTabId,
    label: item.label,
    to: item.to,
    icon: item.icon,
  })),
  {
    id: "more",
    label: "More",
    to: "/more",
    icon: MoreHorizontalIcon,
  },
];

export const moreNavigationItems: MoreNavigationItem[] =
  secondaryMobileItems.map((item) => ({
    label: item.label,
    description: item.description ?? "",
    to: item.to,
    icon: item.icon,
  }));

export function getActiveMobileTab(pathname: string): MobileTabId | null {
  if (pathname === "/" || pathStartsWithRoute(pathname, "/dashboard")) {
    return "dashboard";
  }

  if (pathStartsWithRoute(pathname, "/more")) {
    return "more";
  }

  return (
    appNavigationItems.find((item) => pathStartsWithRoute(pathname, item.to))
      ?.mobileTabId ?? null
  );
}

export function shouldHideMobileBottomNav(pathname: string) {
  return (
    /^\/activity\/[^/]+$/.test(pathname) ||
    /^\/weekly-summaries\/[^/]+$/.test(pathname)
  );
}

function pathStartsWithRoute(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}
