import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@korex/ui/components/sidebar";
import {
  Link,
  Outlet,
  useLocation,
  useMatchRoute,
} from "@tanstack/react-router";
import {
  Activity,
  CalendarDaysIcon,
  FlameIcon,
  Home,
  LineChartIcon,
  SettingsIcon,
  TargetIcon,
  TrophyIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getActiveMobileTab,
  mobileTabs,
  shouldHideMobileBottomNav,
} from "./mobile-navigation";
import { useIsMobileViewport } from "./responsive";

function AppLayout() {
  const isMobileShell = useIsMobileViewport();

  return isMobileShell ? <MobileAppLayout /> : <DesktopAppLayout />;
}

function DesktopAppLayout() {
  const matchRoute = useMatchRoute();
  const isDashboard = Boolean(matchRoute({ to: "/dashboard" }));

  return (
    <SidebarProvider className="h-svh min-h-0 overflow-hidden">
      <Sidebar collapsible="icon">
        <SidebarHeader className="px-4 pt-5">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                className="gap-2.5 px-0 hover:bg-transparent data-active:bg-transparent"
                size="lg"
                tooltip="korex"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-none bg-transparent text-sidebar-primary">
                  <Activity className="size-6" />
                </div>
                <span className="truncate font-semibold text-2xl tracking-tight">
                  korex
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent className="relative overflow-hidden">
          <SidebarGroup className="relative z-10 px-3 pt-6">
            <SidebarGroupContent>
              <SidebarMenu className="gap-1.5">
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={Boolean(matchRoute({ to: "/dashboard" }))}
                    tooltip="Dashboard"
                    render={<Link to="/dashboard" />}
                  >
                    <Home />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={Boolean(matchRoute({ to: "/calendar" }))}
                    tooltip="Calendar"
                    render={<Link to="/calendar" />}
                  >
                    <CalendarDaysIcon />
                    <span>Calendar</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={Boolean(matchRoute({ to: "/analytics" }))}
                    tooltip="Analytics"
                    render={<Link to="/analytics" />}
                  >
                    <LineChartIcon />
                    <span>Analytics</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={Boolean(matchRoute({ to: "/goals" }))}
                    tooltip="Goals"
                    render={<Link to="/goals" />}
                  >
                    <TargetIcon />
                    <span>Goals</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={Boolean(matchRoute({ to: "/heatmap" }))}
                    tooltip="Heatmap"
                    render={<Link to="/heatmap" />}
                  >
                    <FlameIcon />
                    <span>Heatmap</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={Boolean(matchRoute({ to: "/weekly-summaries" }))}
                    tooltip="Weekly Summaries"
                    render={<Link to="/weekly-summaries" />}
                  >
                    <TrophyIcon />
                    <span>Weekly Summaries</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={Boolean(matchRoute({ to: "/settings" }))}
                    tooltip="Settings"
                    render={<Link to="/settings" />}
                  >
                    <SettingsIcon />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-[58svh] min-h-130 bg-[url('/dashboard/sidebar_mountains.png')] bg-cover bg-position-[center_68%] opacity-100 group-data-[collapsible=icon]:hidden md:block"
          >
            <div className="absolute inset-0 bg-linear-to-t from-sidebar/70 via-sidebar/5 to-sidebar/0" />
          </div>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <SidebarInset className="min-h-0 overflow-hidden">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto">
          <div
            className={cn(
              "mx-auto w-full",
              isDashboard ? "max-w-none" : "max-w-7xl p-4 md:p-6",
            )}
          >
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function MobileAppLayout() {
  const location = useLocation();
  const activeTab = getActiveMobileTab(location.pathname);
  const hideBottomNav = shouldHideMobileBottomNav(location.pathname);

  return (
    <div className="flex h-svh min-h-0 flex-col overflow-hidden bg-background">
      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto w-full max-w-7xl">
          <Outlet />
        </div>
      </main>
      {hideBottomNav ? null : (
        <nav
          aria-label="Primary"
          className="shrink-0 border-border/70 border-t bg-background/95 px-2 pt-1 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-10px_30px_color-mix(in_oklch,var(--background)_70%,transparent)] backdrop-blur"
        >
          <div className="grid grid-cols-5 gap-1">
            {mobileTabs.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-md px-1 py-2 text-muted-foreground text-xs transition-colors hover:bg-muted/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                    isActive && "bg-muted text-foreground",
                  )}
                  key={item.id}
                  to={item.to}
                >
                  <Icon className="size-5" />
                  <span className="w-full truncate text-center font-medium leading-tight">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

export { AppLayout };
