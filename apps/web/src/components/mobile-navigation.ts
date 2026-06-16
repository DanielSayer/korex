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

export const mobileTabs: MobileTabItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    to: "/dashboard",
    icon: Home,
  },
  {
    id: "calendar",
    label: "Calendar",
    to: "/calendar",
    icon: CalendarDaysIcon,
  },
  {
    id: "analytics",
    label: "Analytics",
    to: "/analytics",
    icon: LineChartIcon,
  },
  {
    id: "goals",
    label: "Goals",
    to: "/goals",
    icon: TargetIcon,
  },
  {
    id: "more",
    label: "More",
    to: "/more",
    icon: MoreHorizontalIcon,
  },
];

export const moreNavigationItems: MoreNavigationItem[] = [
  {
    label: "Heatmap",
    description: "Explore your Activity Route Heatmap.",
    to: "/heatmap",
    icon: FlameIcon,
  },
  {
    label: "Weekly Summaries",
    description: "Replay completed Training Weeks.",
    to: "/weekly-summaries",
    icon: TrophyIcon,
  },
  {
    label: "Settings",
    description: "Manage account, display, training, and security settings.",
    to: "/settings",
    icon: SettingsIcon,
  },
];

export function getActiveMobileTab(pathname: string): MobileTabId | null {
  if (pathname === "/" || pathname.startsWith("/dashboard")) {
    return "dashboard";
  }

  if (pathname.startsWith("/calendar")) {
    return "calendar";
  }

  if (pathname.startsWith("/analytics")) {
    return "analytics";
  }

  if (pathname.startsWith("/goals")) {
    return "goals";
  }

  if (
    pathname.startsWith("/more") ||
    pathname.startsWith("/heatmap") ||
    pathname.startsWith("/weekly-summaries") ||
    pathname.startsWith("/settings")
  ) {
    return "more";
  }

  return null;
}

export function shouldHideMobileBottomNav(pathname: string) {
  return /^\/activity\/[^/]+$/.test(pathname);
}
