import { useIsMobileViewport } from "@/components/responsive";
import { useDashboardData } from "../hooks/use-dashboard-data";
import { DashboardDesktop } from "./dashboard-desktop";
import { DashboardMobile } from "./dashboard-mobile";

function DashboardPage() {
  const isMobileViewport = useIsMobileViewport();
  const dashboardProps = useDashboardData();

  return isMobileViewport ? (
    <DashboardMobile {...dashboardProps} />
  ) : (
    <DashboardDesktop {...dashboardProps} />
  );
}

export { DashboardPage };
